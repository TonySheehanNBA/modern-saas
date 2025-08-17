# modern-saas Plan

## Summary
Multi-tenant SaaS starter built with Next.js (App Router) and Supabase. Focus on production-ready skeleton with authentication, org isolation, and projects.

## Stack
- Next.js (TypeScript, App Router, Server Actions)
- Supabase (Postgres, Auth w/ Google, Apple, email/password, RLS, Storage, Realtime)
- Tailwind CSS + shadcn/ui (Radix primitives, theming)
- TanStack Query, TanStack Table
- React Hook Form + Zod
- Framer Motion
- lucide-react, sonner
- Resend + React Email (later)
- Stripe (later)
- Sentry, Plausible (placeholders)

## Architecture Goals
- Multi-tenant: orgs + memberships, strict RLS
- Supabase Auth as identity source
- Consistent file structure: `src/app`, `src/components`, `src/lib`
- Accessible UI (Radix, keyboard navigation, focus rings)
- Edge/runtime safe

## Roadmap
1. Scaffold project with auth + hello world dashboard
2. Add multi-tenant org/membership model with RLS
3. Add projects table with optimistic CRUD
4. Add invites + transactional email (Resend)
5. Add billing with Stripe Checkout + Portal
6. Add analytics + accessibility polish

## Non-goals
- No custom backend beyond Supabase + Next
- No microservices or queues yet
- No heavy component libraries (MUI, Chakra)
