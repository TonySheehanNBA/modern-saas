// Complete OAuth Authentication Flow Test
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 Complete OAuth Authentication Flow Test\n')

let testsPassed = 0
let testsTotal = 0

function runTest(name, testFn) {
  testsTotal++
  try {
    const result = testFn()
    if (result) {
      console.log(`✅ ${name}`)
      testsPassed++
    } else {
      console.log(`❌ ${name}`)
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`)
  }
}

async function runAsyncTest(name, testFn) {
  testsTotal++
  try {
    const result = await testFn()
    if (result) {
      console.log(`✅ ${name}`)
      testsPassed++
    } else {
      console.log(`❌ ${name}`)
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`)
  }
}

// Environment Tests
console.log('📋 Environment Configuration')
runTest('Supabase URL configured', () => !!supabaseUrl)
runTest('Supabase Anon Key configured', () => !!supabaseAnonKey)
runTest('Supabase Service Role Key configured', () => !!supabaseServiceKey)

// Database Tests
console.log('\n📋 Database Connectivity')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

await runAsyncTest('Organizations table accessible', async () => {
  const { error } = await supabase.from('organizations').select('id').limit(1)
  return !error || error.code === 'PGRST116'
})

await runAsyncTest('Memberships table accessible', async () => {
  const { error } = await supabase.from('memberships').select('org_id').limit(1)
  return !error || error.code === 'PGRST116'
})

// Service Role Tests (if available)
if (supabaseServiceKey) {
  console.log('\n📋 Service Role Functionality')
  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
  
  await runAsyncTest('Service role can create organizations', async () => {
    const testName = `Test Org ${Date.now()}`
    const { data, error } = await serviceSupabase
      .from('organizations')
      .insert({ name: testName })
      .select()
      .single()
    
    if (error) return false
    
    // Cleanup
    await serviceSupabase.from('organizations').delete().eq('id', data.id)
    return true
  })
  
  await runAsyncTest('Service role can create memberships', async () => {
    // Create test org first
    const { data: org, error: orgError } = await serviceSupabase
      .from('organizations')
      .insert({ name: 'Test Membership Org' })
      .select()
      .single()
    
    if (orgError) return false
    
    // Create test membership
    const testUserId = crypto.randomUUID()
    const { error: membershipError } = await serviceSupabase
      .from('memberships')
      .insert({
        org_id: org.id,
        user_id: testUserId,
        role: 'owner'
      })
    
    // Cleanup
    await serviceSupabase.from('memberships').delete().eq('user_id', testUserId)
    await serviceSupabase.from('organizations').delete().eq('id', org.id)
    
    return !membershipError
  })
}

// Server Tests
console.log('\n📋 Development Server')
await runAsyncTest('Development server running', async () => {
  const response = await fetch('http://localhost:3000/sign-in')
  return response.ok
})

await runAsyncTest('OAuth callback route exists', async () => {
  const response = await fetch('http://localhost:3000/auth/callback', { redirect: 'manual' })
  return response.status === 307 // Should redirect without code
})

await runAsyncTest('Root page redirects unauthenticated users', async () => {
  const response = await fetch('http://localhost:3000/', { redirect: 'manual' })
  return response.status === 307 && response.headers.get('location')?.includes('/sign-in')
})

// RLS Policy Tests
console.log('\n📋 Row Level Security')
if (supabaseServiceKey) {
  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey)
  
  await runAsyncTest('Organizations RLS policies exist', async () => {
    const { data, error } = await serviceSupabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'organizations')
    
    if (error) return false
    
    const hasSelect = data.some(p => p.cmd === 'SELECT')
    const hasInsert = data.some(p => p.cmd === 'INSERT')
    return hasSelect && hasInsert
  })
  
  await runAsyncTest('Memberships RLS policies exist', async () => {
    const { data, error } = await serviceSupabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'memberships')
    
    if (error) return false
    
    const hasSelect = data.some(p => p.cmd === 'SELECT')
    const hasInsert = data.some(p => p.cmd === 'INSERT')
    return hasSelect && hasInsert
  })
}

// Summary
console.log('\n🎯 Test Results')
console.log(`✅ Passed: ${testsPassed}/${testsTotal}`)

if (testsPassed === testsTotal) {
  console.log('\n🎉 All tests passed! OAuth authentication flow is ready.')
} else {
  console.log(`\n⚠️  ${testsTotal - testsPassed} test(s) failed. Please check configuration.`)
}

console.log('\n📋 Manual Testing Steps:')
console.log('1. Go to http://localhost:3000/sign-in')
console.log('2. Click "Continue with Google"')
console.log('3. Complete Google authentication')
console.log('4. Should create default workspace automatically')
console.log('5. Should land on org dashboard: /(app)/[orgId]/dashboard')
console.log('6. Navbar should show workspace name and user menu')

if (!supabaseServiceKey) {
  console.log('\n⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
  console.log('   This is required for default org creation to work.')
  console.log('   Get it from: Supabase Dashboard > Settings > API > service_role key')
}
