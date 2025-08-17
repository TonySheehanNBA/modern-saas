import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserOrgs } from '@/lib/orgs'
import Link from 'next/link'

interface DashboardPageProps {
  params: { orgId: string }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  // Check if user is a member of this organization
  const { data: membership } = await supabase
    .from('memberships')
    .select('org_id, organization:organizations(name)')
    .eq('org_id', params.orgId)
    .single()

  if (!membership) {
    // User is not a member of this org, get their first org for redirect
    const userOrgs = await getUserOrgs()
    const firstOrg = userOrgs[0]
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No Access
          </h1>
          <p className="text-muted-foreground mb-6">
            You don't have access to this organization.
          </p>
          {firstOrg && (
            <Link
              href={`/(app)/${firstOrg.id}/dashboard`}
              className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Go to my workspace
            </Link>
          )}
        </div>
      </div>
    )
  }

  const orgName = (membership.organization as any)?.name || 'Unknown Organization'

  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto">
        <div className="border-4 border-dashed border-border rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Hello, you are in {orgName}
            </h1>
            <p className="text-muted-foreground">
              Welcome to your organization dashboard!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
