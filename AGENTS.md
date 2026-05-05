<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OpenClaw Dashboard

## Project Overview
A system monitoring dashboard for the OpenClaw AI agent running on AWS EC2.

## Stack
- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS v4 with glassmorphism design language
- **Backend:** node-ssh for EC2 communication
- **Port:** localhost:3838

## Architecture
- `src/app/page.tsx` — System Overview (main dashboard)
- `src/app/cron/` — Cron Monitor
- `src/app/inbox/` — Task Inbox
- `src/app/logs/` — Live Feed / Log Viewer
- `src/app/settings/` — Settings
- `src/app/login/` — Login
- `src/app/actions.ts` — Server Actions (SSH commands)
- `src/components/Sidebar.tsx` — Navigation sidebar
- `src/components/CommandPalette.tsx` — Cmd+K command palette
- `src/components/DashboardLayout.tsx` — Layout wrapper

## Design Guidelines
- Dark mode first, glassmorphism aesthetic
- Use `backdrop-blur`, subtle gradients, semi-transparent backgrounds
- Consistent with Tailwind v4 `@theme` design tokens
- Mobile-responsive mandatory

## Code Standards
- TypeScript strict mode
- Server Components by default, 'use client' only when needed
- Meaningful commits: `feat:`, `fix:`, `refactor:`, `test:`
- No hardcoded secrets — env vars only
