# Modern SaaS

A modern, multi-tenant SaaS starter application built with Next.js 15, Supabase, and TypeScript. Features organization-based multi-tenancy, OAuth authentication, and a clean, responsive UI.

## ✨ Features

- **🏢 Multi-tenant Architecture** - Organization-based workspace isolation
- **🔐 OAuth Authentication** - GitHub OAuth integration with Supabase Auth
- **🎨 Modern UI** - Built with Tailwind CSS and shadcn/ui components
- **🌙 Dark Mode** - System-aware theme switching
- **📱 Responsive Design** - Mobile-first responsive layout
- **⚡ Performance** - Next.js 15 with Turbopack for fast development
- **🔒 Row Level Security** - Supabase RLS for secure data access
- **🚀 TypeScript** - Full type safety throughout the application

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with class-variance-authority
- **Icons**: Lucide React
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase project
- GitHub OAuth app (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TonySheehanNBA/modern-saas.git
   cd modern-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.example env.local
   ```
   
   Update `env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Run the SQL migrations in your Supabase project
   - Set up Row Level Security policies
   - Configure GitHub OAuth in Supabase Auth settings

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Protected app routes
│   │   └── [orgId]/       # Organization-scoped routes
│   ├── (marketing)/       # Public marketing pages
│   └── auth/              # Authentication callbacks
├── components/            # Reusable UI components
│   ├── nav/              # Navigation components
│   └── ui/               # Base UI components
├── lib/                  # Utility functions and configs
│   ├── supabase/         # Supabase client configuration
│   └── orgs.ts           # Organization management
└── middleware.ts         # Authentication middleware
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Set up the database schema (see `supabase/` folder)
3. Configure GitHub OAuth:
   - Go to Authentication > Settings > Auth Providers
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials

### GitHub OAuth Setup

1. Create a GitHub OAuth app:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Set Authorization callback URL to: `https://your-project.supabase.co/auth/v1/callback`
2. Add the Client ID and Client Secret to your Supabase project

## 🏗️ Architecture

### Multi-tenancy

The application uses organization-based multi-tenancy:
- Each user can belong to multiple organizations
- Data is isolated by organization ID
- Row Level Security ensures users only access their organization's data

### Authentication Flow

1. User signs in with GitHub OAuth
2. Supabase creates/updates user record
3. Application ensures user has a default organization
4. User is redirected to their organization dashboard

### Database Schema

- `users` - User profiles and metadata
- `organizations` - Organization/workspace data
- `user_organizations` - Many-to-many relationship between users and orgs

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- Self-hosted with Docker

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Create an [issue](https://github.com/TonySheehanNBA/modern-saas/issues) for bug reports
- Start a [discussion](https://github.com/TonySheehanNBA/modern-saas/discussions) for questions
- Follow [@TonySheehanNBA](https://github.com/TonySheehanNBA) for updates

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Lucide](https://lucide.dev/) for the beautiful icons
