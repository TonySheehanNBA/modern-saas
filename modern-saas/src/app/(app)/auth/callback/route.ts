import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('🔍 OAuth callback - Code:', code ? 'Present' : 'Missing')

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('🔍 Exchange result:', { 
      hasSession: !!data?.session, 
      hasUser: !!data?.user,
      error: error?.message 
    })
    
    if (!error && data.session) {
      console.log('✅ Session created successfully, redirecting to:', next)
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      return redirectResponse
    }
    
    console.error('❌ OAuth callback error:', error)
  }

  console.log('❌ Redirecting to sign-in with error')
  return NextResponse.redirect(`${origin}/sign-in?error=Could not authenticate user`)
}
