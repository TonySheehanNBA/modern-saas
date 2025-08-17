'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'

interface UserMenuProps {
  userEmail?: string
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:text-muted-foreground transition-colors">
        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
          <User className="h-3 w-3 text-primary-foreground" />
        </div>
        <span className="max-w-32 truncate">{userEmail}</span>
      </button>
      
      <div className="absolute top-full right-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
