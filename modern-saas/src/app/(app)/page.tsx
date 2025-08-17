import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserOrgs } from '@/lib/orgs'

export default async function AppPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Get user's organizations and redirect to first one
  const orgs = await getUserOrgs()
  
  if (orgs.length === 0) {
    // This shouldn't happen since ensureDefaultOrg runs in layout
    redirect('/sign-in')
  }

  // Redirect to first organization's dashboard
  redirect(`/(app)/${orgs[0].id}/dashboard`)
}
