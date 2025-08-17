import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ensureDefaultOrg, getUserOrgs } from '@/lib/orgs'
import { AppNav } from '@/components/nav/app-nav'

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params?: { orgId?: string }
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Ensure user has a default org
  await ensureDefaultOrg()
  
  // Get user's organizations
  const orgs = await getUserOrgs()
  
  const currentOrgId = params?.orgId

  return (
    <div className="min-h-screen bg-background">
      <AppNav 
        orgs={orgs} 
        currentOrgId={currentOrgId}
        userEmail={user.email}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
