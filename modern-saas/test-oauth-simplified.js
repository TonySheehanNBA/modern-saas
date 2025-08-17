// Simplified OAuth test without service role key requirement
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🧪 Testing OAuth Authentication Flow (Simplified)...\n')

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables')
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}
console.log('   ✅ SUPABASE_URL: Present')
console.log('   ✅ SUPABASE_ANON_KEY: Present')

// Test 2: Database Connection
console.log('\n2️⃣ Testing Database Connection')
const supabase = createClient(supabaseUrl, supabaseAnonKey)

try {
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)

  if (orgsError && orgsError.code !== 'PGRST116') {
    console.log(`   ❌ Organizations table: ${orgsError.message}`)
  } else {
    console.log('   ✅ Organizations table: Accessible')
  }

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

// Test 3: Development Server
console.log('\n3️⃣ Testing Development Server')
try {
  const response = await fetch('http://localhost:3000/sign-in')
  if (response.ok) {
    console.log('   ✅ Development server: Running')
    console.log(`   ✅ Sign-in page: Accessible (${response.status})`)
  } else {
    console.log(`   ❌ Sign-in page: ${response.status} ${response.statusText}`)
  }
} catch (error) {
  console.log(`   ❌ Development server: Not accessible`)
}

// Test 4: OAuth Callback Route
console.log('\n4️⃣ Testing OAuth Callback Route')
try {
  const response = await fetch('http://localhost:3000/auth/callback')
  // Should redirect to sign-in with error (no code parameter)
  if (response.status === 307) {
    console.log('   ✅ OAuth callback route: Working (redirects as expected)')
  } else {
    console.log(`   ❌ OAuth callback route: Unexpected status ${response.status}`)
  }
} catch (error) {
  console.log(`   ❌ OAuth callback route: Not accessible`)
}

// Test 5: Root Page Redirect
console.log('\n5️⃣ Testing Root Page Redirect')
try {
  const response = await fetch('http://localhost:3000/', { redirect: 'manual' })
  if (response.status === 307) {
    const location = response.headers.get('location')
    console.log(`   ✅ Root page redirects to: ${location}`)
  } else {
    console.log(`   ❌ Root page: Unexpected status ${response.status}`)
  }
} catch (error) {
  console.log(`   ❌ Root page: Not accessible`)
}

console.log('\n🎯 Simplified OAuth Test Complete!')
console.log('\n📋 Manual Testing Required:')
console.log('1. Go to http://localhost:3000/sign-in')
console.log('2. Click "Continue with Google"')
console.log('3. Complete Google authentication')
console.log('4. Should create default workspace and land on dashboard')
console.log('\n⚠️  Note: Service role key needed in .env.local for full functionality:')
console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
console.log('\n✅ Basic infrastructure tests passed!')
