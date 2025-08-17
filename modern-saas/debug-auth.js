// Debug script to test authentication flow step by step
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Debugging Authentication Flow...\n')

// Test 1: Check environment variables
console.log('1️⃣ Environment Variables:')
console.log(`URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
console.log(`Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`)

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

// Test 2: Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey)
console.log('2️⃣ Supabase client created ✅\n')

// Test 3: Check current session
console.log('3️⃣ Checking current session...')
const { data: { session }, error: sessionError } = await supabase.auth.getSession()
if (sessionError) {
  console.error('❌ Session error:', sessionError.message)
} else {
  console.log(`Session: ${session ? '✅ Active' : '❌ None'}`)
  if (session) {
    console.log(`User: ${session.user.email}`)
    console.log(`Expires: ${new Date(session.expires_at * 1000)}`)
  }
}
console.log()

// Test 4: Check database connection and RLS
console.log('4️⃣ Testing database connection...')
try {
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
  
  if (orgsError) {
    console.error('❌ Organizations query error:', orgsError.message)
  } else {
    console.log('✅ Organizations table accessible')
    console.log(`Found ${orgs.length} organizations`)
  }
} catch (err) {
  console.error('❌ Database connection failed:', err.message)
}

// Test 5: Check memberships table
console.log('\n5️⃣ Testing memberships table...')
try {
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select('*')
    .limit(1)
  
  if (membershipsError) {
    console.error('❌ Memberships query error:', membershipsError.message)
  } else {
    console.log('✅ Memberships table accessible')
    console.log(`Found ${memberships.length} memberships`)
  }
} catch (err) {
  console.error('❌ Memberships query failed:', err.message)
}

console.log('\n🎯 Debug complete!')
