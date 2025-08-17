import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserOrgs, ensureDefaultOrg } from '@/lib/orgs'

export default async function HomePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  console.log('🔍 Root page - User:', user ? 'Present' : 'Missing')
  
  if (!user) {
    console.log('❌ No user, redirecting to sign-in')
    redirect('/sign-in')
  }

  console.log('✅ User found:', user.email)

  // Ensure user has a default org (critical for new OAuth users)
  console.log('🔍 Ensuring default org exists...')
  await ensureDefaultOrg()

  // Get user's organizations and redirect to first one
  const orgs = await getUserOrgs()
  
  console.log('🔍 User orgs after ensuring default:', orgs.length)
  
  if (orgs.length === 0) {
    console.log('❌ Still no orgs found after ensureDefaultOrg, something is wrong')
    redirect('/sign-in?error=Could not create workspace')
  }

  console.log('✅ Redirecting to org dashboard:', orgs[0].id)
  redirect(`/${orgs[0].id}/dashboard`)
}
