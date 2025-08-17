# API Documentation

This document outlines the API structure and key functions used in the Modern SaaS application.

## Authentication

The application uses Supabase Auth with GitHub OAuth for authentication. All API calls are authenticated using Supabase's built-in authentication system.

### Client-Side Authentication

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign in with GitHub
await supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Sign out
await supabase.auth.signOut()
```

### Server-Side Authentication

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## Organization Management

### Core Functions

#### `getUserOrgs()`
Retrieves all organizations for the current user.

```typescript
import { getUserOrgs } from '@/lib/orgs'

const orgs = await getUserOrgs()
// Returns: Organization[]
```

#### `ensureDefaultOrg()`
Ensures the current user has a default organization. Creates one if it doesn't exist.

```typescript
import { ensureDefaultOrg } from '@/lib/orgs'

await ensureDefaultOrg()
// Returns: void (creates org if needed)
```

#### `getOrgById(orgId: string)`
Retrieves a specific organization by ID.

```typescript
import { getOrgById } from '@/lib/orgs'

const org = await getOrgById('org-uuid')
// Returns: Organization | null
```

### Organization Type

```typescript
export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
  updated_at: string
}
```

## Database Schema

### Tables

#### `organizations`
```sql
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `user_organizations`
```sql
CREATE TABLE user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
```

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

#### Organizations
- **SELECT**: Users can view organizations they belong to
- **UPDATE**: Users can update organizations they own

#### User Organizations
- **SELECT**: Users can view their own organization memberships
- **ALL**: Organization owners can manage memberships

## Middleware

### Authentication Middleware

The application uses Next.js middleware to protect routes and handle authentication:

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Authentication logic
  // Redirects unauthenticated users to sign-in
  // Handles organization routing
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## Route Structure

### Public Routes
- `/` - Landing page (redirects to dashboard if authenticated)
- `/sign-in` - Authentication page

### Protected Routes (App)
- `/[orgId]/dashboard` - Organization dashboard
- `/[orgId]/settings` - Organization settings
- `/auth/callback` - OAuth callback handler

### Route Parameters
- `[orgId]` - Organization ID for multi-tenant routing

## Error Handling

### Common Error Patterns

```typescript
// Authentication errors
if (!user) {
  redirect('/sign-in')
}

// Organization access errors
const orgs = await getUserOrgs()
if (orgs.length === 0) {
  redirect('/sign-in?error=Could not create workspace')
}

// Invalid organization
const org = await getOrgById(orgId)
if (!org) {
  notFound() // Returns 404
}
```

## Environment Variables

### Required Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Optional Variables

```env
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Supabase Client Configuration

### Browser Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## Common Queries

### Get User Organizations

```sql
SELECT o.* 
FROM organizations o
JOIN user_organizations uo ON o.id = uo.organization_id
WHERE uo.user_id = auth.uid()
ORDER BY o.created_at ASC
```

### Check Organization Access

```sql
SELECT EXISTS(
  SELECT 1 FROM user_organizations 
  WHERE user_id = auth.uid() 
  AND organization_id = $1
)
```

### Create Organization

```sql
INSERT INTO organizations (name, slug)
VALUES ($1, $2)
RETURNING *
```

## Security Considerations

1. **Row Level Security**: All data access is controlled by RLS policies
2. **Organization Isolation**: Users can only access data from their organizations
3. **Authentication Required**: All app routes require authentication
4. **CSRF Protection**: Built-in with Supabase Auth
5. **SQL Injection Prevention**: Parameterized queries through Supabase client

## Performance Optimization

1. **Server-Side Rendering**: User data fetched on server
2. **Caching**: Supabase handles query caching
3. **Connection Pooling**: Managed by Supabase
4. **Optimistic Updates**: Client-side updates with server sync

## Rate Limiting

Supabase provides built-in rate limiting. For additional protection, consider:

1. **API Route Protection**: Implement custom rate limiting
2. **User-based Limits**: Limit actions per user/organization
3. **IP-based Limits**: Protect against abuse

## Monitoring and Logging

### Supabase Dashboard
- Real-time database activity
- Authentication logs
- API usage metrics
- Performance insights

### Application Logging
```typescript
// Development logging
console.log('🔍 Root page - User:', user ? 'Present' : 'Missing')
console.log('✅ User found:', user.email)
console.log('🔍 User orgs after ensuring default:', orgs.length)
```

## Testing

### Database Testing
```sql
-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid"}';
SELECT * FROM organizations; -- Should only return user's orgs
```

### Integration Testing
```typescript
// Test authentication flow
// Test organization creation
// Test multi-tenant isolation
```
