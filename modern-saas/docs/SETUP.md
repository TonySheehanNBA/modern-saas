# Setup Guide

This guide will walk you through setting up the Modern SaaS application from scratch.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- A Supabase account
- A GitHub account (for OAuth)

## Step 1: Supabase Project Setup

### 1.1 Create a New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `modern-saas` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Database Schema Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create organizations table
CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations junction table
CREATE TABLE user_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS on tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organizations they own" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their own organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" ON user_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Function to create default organization for new users
CREATE OR REPLACE FUNCTION create_default_org_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || '''s Workspace',
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'login', SPLIT_PART(NEW.email, '@', 1)),
      '[^a-zA-Z0-9]', '-', 'g'
    )) || '-' || SUBSTR(NEW.id::text, 1, 8)
  )
  RETURNING id INTO @org_id;
  
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (NEW.id, @org_id, 'owner');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default org for new users
CREATE TRIGGER create_default_org_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_org_for_user();
```

### 1.3 Configure GitHub OAuth

1. In your Supabase dashboard, go to **Authentication > Settings**
2. Scroll to **Auth Providers**
3. Find **GitHub** and toggle it on
4. You'll need GitHub OAuth credentials (we'll set these up next)

## Step 2: GitHub OAuth App Setup

### 2.1 Create GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: `Modern SaaS` (or your app name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
     - Replace `your-project-ref` with your actual Supabase project reference
4. Click **Register application**

### 2.2 Configure Supabase with GitHub Credentials

1. Copy the **Client ID** from your GitHub OAuth app
2. Generate a **Client Secret** and copy it
3. In Supabase, go back to **Authentication > Settings > Auth Providers > GitHub**
4. Paste the **Client ID** and **Client Secret**
5. Click **Save**

## Step 3: Application Setup

### 3.1 Clone and Install

```bash
git clone https://github.com/TonySheehanNBA/modern-saas.git
cd modern-saas
npm install
```

### 3.2 Environment Configuration

1. Copy the environment template:
   ```bash
   cp env.local.example env.local
   ```

2. Get your Supabase credentials:
   - Go to your Supabase project dashboard
   - Click **Settings > API**
   - Copy the **Project URL** and **anon public** key

3. Update `env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3.3 Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 4: Testing the Setup

1. **Test Authentication**:
   - Click "Sign in with GitHub"
   - Complete the OAuth flow
   - You should be redirected to your dashboard

2. **Verify Organization Creation**:
   - Check that a default organization was created
   - Verify you can access the organization dashboard

3. **Test Multi-tenancy**:
   - Create additional organizations (if implemented)
   - Switch between organizations
   - Verify data isolation

## Step 5: Production Deployment

### 5.1 Update GitHub OAuth App

1. Go to your GitHub OAuth app settings
2. Update the **Authorization callback URL** to your production domain:
   ```
   https://your-domain.com/auth/callback
   ```

### 5.2 Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Troubleshooting

### Common Issues

**OAuth Redirect Mismatch**
- Ensure your GitHub OAuth callback URL matches your Supabase project URL
- Check for typos in the URL

**Database Connection Issues**
- Verify your Supabase URL and anon key are correct
- Check that RLS policies are properly configured

**Organization Not Created**
- Check the database trigger is working
- Verify the user has proper permissions

**Build Errors**
- Ensure all environment variables are set
- Check that all dependencies are installed

### Getting Help

- Check the [GitHub Issues](https://github.com/TonySheehanNBA/modern-saas/issues)
- Review Supabase logs in your dashboard
- Check browser console for client-side errors

## Next Steps

Once your setup is complete, you can:

1. Customize the UI and branding
2. Add additional features and pages
3. Set up monitoring and analytics
4. Configure custom domains
5. Add payment integration (if needed)

For more advanced configuration, see the main [README.md](../README.md) file.
