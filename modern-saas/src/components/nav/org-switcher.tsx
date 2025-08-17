import { ChevronDown, Building2 } from 'lucide-react'
import { Organization } from '@/lib/orgs'
import Link from 'next/link'

interface OrgSwitcherProps {
  orgs: Organization[]
  currentOrgId?: string
}

export function OrgSwitcher({ orgs, currentOrgId }: OrgSwitcherProps) {
  const currentOrg = orgs.find(org => org.id === currentOrgId) || orgs[0]

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
        <Building2 className="h-4 w-4" />
        <span className="max-w-32 truncate">{currentOrg?.name || 'Select Organization'}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      
      <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-1">
          {orgs.map((org) => (
            <Link
              key={org.id}
              href={`/(app)/${org.id}/dashboard`}
              className={`block px-3 py-2 text-sm rounded-sm transition-colors ${
                org.id === currentOrgId
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{org.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
