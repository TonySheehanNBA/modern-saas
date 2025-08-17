import { createClient } from '@/lib/supabase/server'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Membership {
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  organization: Organization
}

export async function getUserOrgs(): Promise<Organization[]> {
  const supabase = await createClient()
  
  const { data: memberships, error } = await supabase
    .from('memberships')
    .select(`
      org_id,
      role,
      organization:organizations(id, name, created_at)
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching user organizations:', error)
    return []
  }

  return (memberships || [])
    .map(m => m.organization)
    .filter(Boolean) as unknown as Organization[]
}

export async function ensureDefaultOrg(): Promise<string | null> {
  const supabase = await createClient()
  
  // Get user info first to ensure we have auth context
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('No authenticated user found')
    return null
  }

  console.log('🔍 User authenticated:', user.id)

  // Check if user already has any memberships
  const { data: existingMemberships } = await supabase
    .from('memberships')
    .select('org_id')
    .limit(1)

  if (existingMemberships && existingMemberships.length > 0) {
    console.log('✅ User already has org:', existingMemberships[0].org_id)
    return existingMemberships[0].org_id
  }

  console.log('🔍 Creating new organization for user:', user.email)

  // Extract first name from user metadata or email
  const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                   user.user_metadata?.name?.split(' ')[0] || 
                   user.email?.split('@')[0] || 
                   'My'
  
  const orgName = `${firstName}'s Workspace`

  // Use service role client to bypass RLS for organization creation
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is missing')
    return null
  }

  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  // Create organization with service role
  const { data: org, error: orgError } = await serviceSupabase
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single()

  if (orgError) {
    console.error('Error creating organization:', orgError)
    return null
  }

  console.log('✅ Organization created:', org.id)

  // Create membership with service role
  const { error: membershipError } = await serviceSupabase
    .from('memberships')
    .insert({
      org_id: org.id,
      user_id: user.id,
      role: 'owner'
    })

  if (membershipError) {
    console.error('Error creating membership:', membershipError)
    return null
  }

  console.log('✅ Membership created for user:', user.id)
  return org.id
}
