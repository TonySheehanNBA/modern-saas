import Link from 'next/link'
import { OrgSwitcher } from './org-switcher'
import { UserMenu } from './user-menu'
import { Organization } from '@/lib/orgs'

interface AppNavProps {
  orgs: Organization[]
  currentOrgId?: string
  userEmail?: string
}

export function AppNav({ orgs, currentOrgId, userEmail }: AppNavProps) {
  const dashboardHref = currentOrgId ? `/(app)/${currentOrgId}/dashboard` : '/(app)'

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link 
            href={dashboardHref}
            className="flex items-center space-x-2 font-bold text-foreground hover:text-muted-foreground transition-colors"
          >
            Modern SaaS
          </Link>
          
          {orgs.length > 0 && (
            <OrgSwitcher orgs={orgs} currentOrgId={currentOrgId} />
          )}
        </div>
        
        <div className="flex items-center">
          <UserMenu userEmail={userEmail} />
        </div>
      </div>
    </header>
  )
}
