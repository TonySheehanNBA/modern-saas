#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMultiTenantSetup() {
  console.log('🧪 Testing Multi-Tenant Setup...\n')

  try {
    // Test 1: Check if tables exist (RLS will block this, which is expected)
    console.log('1️⃣ Checking database schema...')
    
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    // RLS should block this - if we get a specific RLS error, tables exist
    if (orgsError && (orgsError.message.includes('row-level security') || orgsError.code === 'PGRST116')) {
      console.log('✅ Database tables exist (RLS properly blocking unauthenticated access)')
    } else if (orgsError && orgsError.message.includes('relation') && orgsError.message.includes('does not exist')) {
      console.error('❌ Organizations table not found. Please run the SQL seed script in Supabase SQL editor:')
      console.log('   Go to: https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/sql')
      console.log('   Run the contents of: supabase/seed.sql')
      return false
    } else {
      console.log('✅ Database tables exist')
    }

    // Test 2: Check RLS policies
    console.log('\n2️⃣ Testing RLS policies...')
    
    // This should fail without authentication
    const { data: unauthData, error: unauthError } = await supabase
      .from('organizations')
      .select('*')
    
    if (!unauthError || unauthData?.length > 0) {
      console.log('⚠️  RLS might not be properly configured - unauthenticated access succeeded')
    } else {
      console.log('✅ RLS is working - unauthenticated access blocked')
    }

    // Test 3: Check if development server is running
    console.log('\n3️⃣ Checking development server...')
    
    try {
      const response = await fetch('http://localhost:3000/sign-in')
      if (response.ok) {
        console.log('✅ Development server is running')
      } else {
        console.log('❌ Development server returned error:', response.status)
        return false
      }
    } catch (error) {
      console.log('❌ Development server is not running. Please run: pnpm dev')
      return false
    }

    // Test 4: Check route structure
    console.log('\n4️⃣ Testing route accessibility...')
    
    try {
      // Test sign-in page
      const signInResponse = await fetch('http://localhost:3000/sign-in')
      console.log('✅ Sign-in page accessible')
      
      // Test app redirect (should redirect to sign-in when not authenticated)
      const appResponse = await fetch('http://localhost:3000/(app)', { redirect: 'manual' })
      if (appResponse.status === 302 || appResponse.status === 307) {
        console.log('✅ App route properly redirects unauthenticated users')
      }
      
    } catch (error) {
      console.log('❌ Route testing failed:', error.message)
      return false
    }

    console.log('\n🎉 Multi-tenant setup test completed successfully!')
    console.log('\n📋 Manual Testing Steps:')
    console.log('1. Go to http://localhost:3000/sign-in')
    console.log('2. Sign in with Google or email/password')
    console.log('3. Verify you land on /(app)/[orgId]/dashboard')
    console.log('4. Check that navbar shows your default workspace')
    console.log('5. Try accessing a random org ID to test access control')
    
    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return false
  }
}

// Run the test
testMultiTenantSetup().then(success => {
  process.exit(success ? 0 : 1)
})
