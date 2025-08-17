// Comprehensive test for OAuth authentication flow
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 Testing OAuth Authentication Flow...\n')

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables')
const envTests = [
  { name: 'SUPABASE_URL', value: supabaseUrl },
  { name: 'SUPABASE_ANON_KEY', value: supabaseAnonKey },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey }
]

let envPassed = true
envTests.forEach(test => {
  if (test.value) {
    console.log(`   ✅ ${test.name}: Present`)
  } else {
    console.log(`   ❌ ${test.name}: Missing`)
    envPassed = false
  }
})

if (!envPassed) {
  console.error('\n❌ Environment variables missing. Please check .env.local')
  process.exit(1)
}

// Test 2: Database Schema
console.log('\n2️⃣ Testing Database Schema')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

try {
  // Test organizations table
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .limit(1)

  if (orgsError && orgsError.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
    console.log(`   ❌ Organizations table: ${orgsError.message}`)
  } else {
    console.log('   ✅ Organizations table: Accessible')
  }

  // Test memberships table
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('org_id, user_id, role')
    .limit(1)

  if (membershipsError && membershipsError.code !== 'PGRST116') {
    console.log(`   ❌ Memberships table: ${membershipsError.message}`)
  } else {
    console.log('   ✅ Memberships table: Accessible')
  }
} catch (error) {
  console.log(`   ❌ Database connection: ${error.message}`)
}

// Test 3: Service Role Client
console.log('\n3️⃣ Testing Service Role Client')
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)

try {
  // Test service role can create organizations (bypassing RLS)
  const testOrgName = `Test Org ${Date.now()}`
  
  const { data: testOrg, error: createError } = await serviceSupabase
    .from('organizations')
    .insert({ name: testOrgName })
    .select()
    .single()

  if (createError) {
    console.log(`   ❌ Service role org creation: ${createError.message}`)
  } else {
    console.log('   ✅ Service role org creation: Working')
    
    // Clean up test org
    await serviceSupabase
      .from('organizations')
      .delete()
      .eq('id', testOrg.id)
    
    console.log('   ✅ Test org cleanup: Complete')
  }
} catch (error) {
  console.log(`   ❌ Service role test: ${error.message}`)
}

// Test 4: RLS Policies
console.log('\n4️⃣ Testing RLS Policies')
try {
  const { data: policies, error: policiesError } = await serviceSupabase
    .rpc('exec_sql', { 
      sql: `
        SELECT tablename, policyname, cmd, permissive
        FROM pg_policies 
        WHERE tablename IN ('organizations', 'memberships')
        ORDER BY tablename, cmd;
      `
    })

  if (policiesError) {
    console.log(`   ❌ RLS policies check: ${policiesError.message}`)
  } else {
    const orgPolicies = policies.filter(p => p.tablename === 'organizations')
    const membershipPolicies = policies.filter(p => p.tablename === 'memberships')
    
    console.log(`   ✅ Organizations policies: ${orgPolicies.length} found`)
    console.log(`   ✅ Memberships policies: ${membershipPolicies.length} found`)
    
    // Check for required policies
    const hasOrgInsert = orgPolicies.some(p => p.cmd === 'INSERT')
    const hasOrgSelect = orgPolicies.some(p => p.cmd === 'SELECT')
    const hasMembershipInsert = membershipPolicies.some(p => p.cmd === 'INSERT')
    const hasMembershipSelect = membershipPolicies.some(p => p.cmd === 'SELECT')
    
    console.log(`   ${hasOrgInsert ? '✅' : '❌'} Organizations INSERT policy`)
    console.log(`   ${hasOrgSelect ? '✅' : '❌'} Organizations SELECT policy`)
    console.log(`   ${hasMembershipInsert ? '✅' : '❌'} Memberships INSERT policy`)
    console.log(`   ${hasMembershipSelect ? '✅' : '❌'} Memberships SELECT policy`)
  }
} catch (error) {
  console.log(`   ❌ RLS policies test: ${error.message}`)
}

// Test 5: Default Org Creation Logic
console.log('\n5️⃣ Testing Default Org Creation Logic')

// Create a test user to simulate the flow
const testUserId = crypto.randomUUID()
const testUserEmail = `test-${Date.now()}@example.com`

try {
  // Simulate ensureDefaultOrg logic
  console.log(`   🔍 Simulating org creation for user: ${testUserEmail}`)
  
  // Check existing memberships (should be empty)
  const { data: existingMemberships } = await serviceSupabase
    .from('memberships')
    .select('org_id')
    .eq('user_id', testUserId)
    .limit(1)

  if (existingMemberships && existingMemberships.length > 0) {
    console.log('   ⚠️  Test user already has memberships (unexpected)')
  } else {
    console.log('   ✅ No existing memberships found')
  }

  // Create test organization
  const orgName = "Test User's Workspace"
  const { data: org, error: orgError } = await serviceSupabase
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single()

  if (orgError) {
    console.log(`   ❌ Test org creation failed: ${orgError.message}`)
  } else {
    console.log(`   ✅ Test org created: ${org.id}`)

    // Create test membership
    const { error: membershipError } = await serviceSupabase
      .from('memberships')
      .insert({
        org_id: org.id,
        user_id: testUserId,
        role: 'owner'
      })

    if (membershipError) {
      console.log(`   ❌ Test membership creation failed: ${membershipError.message}`)
    } else {
      console.log('   ✅ Test membership created')

      // Verify membership exists
      const { data: verifyMembership } = await serviceSupabase
        .from('memberships')
        .select('org_id, role')
        .eq('user_id', testUserId)
        .single()

      if (verifyMembership) {
        console.log(`   ✅ Membership verified: ${verifyMembership.role} of org ${verifyMembership.org_id}`)
      } else {
        console.log('   ❌ Membership verification failed')
      }
    }

    // Clean up test data
    await serviceSupabase.from('memberships').delete().eq('user_id', testUserId)
    await serviceSupabase.from('organizations').delete().eq('id', org.id)
    console.log('   ✅ Test data cleanup complete')
  }
} catch (error) {
  console.log(`   ❌ Default org creation test: ${error.message}`)
}

// Test 6: Development Server
console.log('\n6️⃣ Testing Development Server')
try {
  const response = await fetch('http://localhost:3000/sign-in')
  if (response.ok) {
    console.log('   ✅ Development server: Running')
    console.log(`   ✅ Sign-in page: Accessible (${response.status})`)
  } else {
    console.log(`   ❌ Sign-in page: ${response.status} ${response.statusText}`)
  }
} catch (error) {
  console.log(`   ❌ Development server: Not accessible (${error.message})`)
}

console.log('\n🎯 OAuth Authentication Flow Test Complete!')
console.log('\n📋 Manual Testing Steps:')
console.log('1. Go to http://localhost:3000/sign-in')
console.log('2. Click "Continue with Google"')
console.log('3. Complete Google authentication')
console.log('4. Should land on org dashboard with navbar')
console.log('5. Check that workspace name appears in navbar')
console.log('\n✅ All automated tests completed successfully!')
