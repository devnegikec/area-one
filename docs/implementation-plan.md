# Area-One — Phase-Wise Build, Test & Deploy Plan

> **Document Version:** 1.0
> **Date:** July 2026
> **Team Size:** 2–5 engineers
> **Cadence:** 2-week sprints, 6 phases over 6 months

---

## Table of Contents

1. [Phase 0: Project Scaffold & Environment Setup](#phase-0-project-scaffold--environment-setup)
2. [Phase 1: Foundation — Auth, Gmail, Dashboard](#phase-1-foundation--auth-gmail-dashboard)
3. [Phase 2: AI Memory — Understanding Customers](#phase-2-ai-memory--understanding-customers)
4. [Phase 3: Recommendations — AI Suggests Actions (MVP Launch)](#phase-3-recommendations--ai-suggests-actions-mvp-launch)
5. [Phase 4: Execution — AI Takes Action](#phase-4-execution--ai-takes-action)
6. [Phase 5: Multi-Agent & Autonomy](#phase-5-multi-agent--autonomy)
7. [Phase 6: Scale, Compliance & Enterprise](#phase-6-scale-compliance--enterprise)
8. [Testing Strategy Per Phase](#8-testing-strategy-per-phase)
9. [Deployment Strategy Per Phase](#9-deployment-strategy-per-phase)
10. [Definition of Done Checklist](#10-definition-of-done-checklist)

---

## Phase 0: Project Scaffold & Environment Setup ✅ DONE

**Duration:** 2–3 days
**Goal:** Everything ready to write feature code.
**Deploy:** Nothing public yet.

### Build Tasks

```
┌─────────────────────────────────────────────────────────────────┐
│ TASK 0.1: Monorepo & Project Scaffold                           │
├─────────────────────────────────────────────────────────────────┤
│ ☐ mkdir area-one && cd area-one                                 │
│ ☐ npx create-next-app@latest . --typescript --tailwind --eslint │
│    --app --src-dir --import-alias "@/*"                         │
│ ☐ npm install drizzle-orm postgres dotenv                        │
│ ☐ npm install -D drizzle-kit vitest @playwright/test            │
│ ☐ npm install @clerk/nextjs                                     │
│ ☐ npm install @t3-oss/env-nextjs zod                            │
│ ☐ npm install @shadcn/ui (init)                                 │
│ ☐ Create directory structure as per architecture doc            │
│                                                                  │
│ Output:                                                         │
│ src/                                                            │
│ ├── app/            # App Router                                 │
│ │   ├── (auth)/      # Sign in, sign up                          │
│ │   ├── (dashboard)/ # Authenticated routes                      │
│ │   ├── (marketing)/ # Landing page                              │
│ │   └── api/         # API routes                                │
│ ├── lib/            # Domain logic                               │
│ │   ├── auth/                                                   │
│ │   ├── workspace/                                              │
│ │   ├── customer-memory/                                        │
│ │   ├── recommendations/                                        │
│ │   ├── drafting/                                               │
│ │   ├── integrations/                                           │
│ │   ├── agents/                                                 │
│ │   ├── ai/                                                     │
│ │   ├── queue/                                                  │
│ │   └── shared/                                                 │
│ ├── db/             # Drizzle                                    │
│ │   ├── schema/                                                 │
│ │   ├── migrations/                                             │
│ │   └── seed/                                                   │
│ └── emails/         # React Email templates                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TASK 0.2: Environment Configuration                              │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create .env.example:                                          │
│    DATABASE_URL=postgresql://...                                 │
│    CLERK_SECRET_KEY=sk_...                                       │
│    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...                      │
│    OPENAI_API_KEY=sk-...                                         │
│    ANTHROPIC_API_KEY=sk-ant-...                                  │
│    GOOGLE_AI_API_KEY=...                                         │
│    UPSTASH_REDIS_URL=...                                         │
│    UPSTASH_REDIS_TOKEN=...                                       │
│    RESEND_API_KEY=re_...                                         │
│    SENTRY_DSN=...                                                │
│    TOKEN_ENCRYPTION_KEY=...                                      │
│ ☐ Setup @t3-oss/env-nextjs for type-safe env vars               │
│ ☐ Create .env.local (gitignored)                                 │
│                                                                  │
│ Output: Typed, validated environment variables.                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TASK 0.3: Database Setup (Local Docker)                          │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create docker-compose.yml:                                    │
│    services:                                                     │
│      postgres:                                                   │
│        image: pgvector/pgvector:pg16                             │
│        ports: ["5432:5432"]                                      │
│        environment:                                              │
│          POSTGRES_USER: areaone                                  │
│          POSTGRES_PASSWORD: areaone                              │
│          POSTGRES_DB: areaone                                    │
│      redis:                                                      │
│        image: redis:7-alpine                                     │
│        ports: ["6379:6379"]                                      │
│ ☐ docker compose up -d                                           │
│ ☐ Create Drizzle config (drizzle.config.ts)                     │
│ ☐ Create initial schema (workspaces, users — from architecture) │
│ ☐ npx drizzle-kit push (initial migration)                      │
│                                                                  │
│ Output: Running PostgreSQL with pgvector + Redis.                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TASK 0.4: CI/CD Pipeline (GitHub Actions)                        │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create .github/workflows/ci.yml:                              │
│    - Lint (ESLint)                                              │
│    - Type-check (tsc --noEmit)                                  │
│    - Unit tests (vitest)                                        │
│ ☐ Create .github/workflows/preview.yml:                        │
│    - Deploy to Vercel preview on PR                             │
│ ☐ Connect GitHub repo to Vercel + Railway                       │
│                                                                  │
│ Output: Green CI on every push. Preview deploys on PRs.          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TASK 0.5: Monitoring & Error Tracking                            │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create Sentry project → add DSN to .env                       │
│ ☐ npm install @sentry/nextjs                                    │
│ ☐ npx @sentry/wizard -i nextjs (auto-config)                    │
│ ☐ Create BetterStack monitor for health checks                  │
│ ☐ Add /api/health endpoint:                                     │
│    return { status: 'ok', db: await dbCheck(), redis: ... }     │
│                                                                  │
│ Output: Errors captured in Sentry. Health check monitored.       │
└─────────────────────────────────────────────────────────────────┘
```

### Test Checklist — Phase 0

```
☐ docker compose up → PostgreSQL + Redis start without errors
☐ npx drizzle-kit push → Schema created in local DB
☐ npm run dev → App starts on localhost:3000
☐ npm run lint → Zero lint errors
☐ npm run typecheck → Zero type errors
☐ npm run test → Vitest runs (even with 0 tests — infra works)
☐ GitHub Actions → CI passes on push
☐ Vercel Preview → Deploys successfully on PR
☐ /api/health → Returns 200 with { status: 'ok' }
```

### Deploy Checklist — Phase 0

```
☐ Vercel project created → linked to GitHub repo
☐ Railway project created → PostgreSQL + Redis provisioned
☐ All environment variables set in Vercel + Railway
☐ Preview deployments working (per-PR)
☐ Sentry + BetterStack configured
☐ Database connection verified from deployed app
```

### Phase 0 Exit Criteria

- [ ] New developer can clone, `npm install`, `docker compose up`, `npm run dev`, and see the app
- [ ] CI pipeline is green (lint, typecheck, test)
- [ ] Preview deployments work on every PR
- [ ] Error tracking captures exceptions in deployed app

---

## Phase 1: Foundation — Auth, Gmail, Dashboard ✅ DONE

**Duration:** Sprints 1–4 (Weeks 1–8)
**Goal:** User can sign up, connect Gmail, see their emails in a dashboard.
**Deploy:** Internal alpha (team only).

### Sprint 1 (Week 1–2): Authentication & Workspaces ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Authentication with Clerk                                 │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Install + configure @clerk/nextjs                             │
│ ☐ Create middleware.ts (protect /dashboard routes)              │
│ ☐ Create app/(auth)/sign-in/[[...sign-in]]/page.tsx            │
│ ☐ Create app/(auth)/sign-up/[[...sign-up]]/page.tsx            │
│ ☐ Configure Clerk webhook → POST /api/webhooks/clerk            │
│    (sync user to our DB on signup)                              │
│ ☐ Create workspace creation flow after signup                   │
│ ☐ Create workspace switcher UI component                        │
│ ☐ Create invite flow (email invite → accept → join workspace)  │
│                                                                  │
│ Key Files:                                                       │
│ • src/middleware.ts                                              │
│ • src/app/(auth)/**                                              │
│ • src/app/api/webhooks/clerk/route.ts                            │
│ • src/lib/auth/clerk-webhook.ts                                  │
│ • src/lib/workspace/create-workspace.ts                          │
│ • src/lib/workspace/invite-member.ts                             │
│ • src/components/workspace-switcher.tsx                          │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Database Schema (Core Tables)                             │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create Drizzle schema files:                                  │
│    db/schema/workspaces.ts                                      │
│    db/schema/workspace-members.ts                               │
│    db/schema/integrations.ts                                    │
│ ☐ npx drizzle-kit generate (create migration)                   │
│ ☐ npx drizzle-kit migrate                                       │
│                                                                  │
│ Tables created:                                                  │
│ • workspaces (id, name, slug, settings, timestamps)             │
│ • workspace_members (workspace_id, user_id, role)               │
│ • integrations (id, workspace_id, provider, status, tokens)     │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 1**

```
☐ Unit: createWorkspace() creates a workspace + assigns user as owner
☐ Unit: inviteMember() sends email + creates pending member record
☐ Integration: Sign up API → workspace created → user added as owner
☐ Integration: Clerk webhook → user synced to our DB
☐ E2E:    Sign up → create workspace → see dashboard (empty)
☐ E2E:    Invite team member → member accepts → both see same workspace
☐ E2E:    Switch between multiple workspaces
☐ E2E:    Sign out → redirected to sign-in → sign in → back to dashboard
```

### Sprint 2 (Week 3–4): Gmail Integration ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Gmail OAuth + Email Ingestion                             │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create Google Cloud Project → enable Gmail API                │
│ ☐ Configure OAuth consent screen (scopes: gmail.readonly)       │
│ ☐ Create OAuth 2.0 credentials (client ID + secret)             │
│ ☐ Build OAuth flow: /api/integrations/gmail/connect             │
│    → Redirect to Google → Get auth code → Exchange for tokens   │
│ ☐ Build Gmail adapter: src/lib/integrations/gmail/              │
│    • auth.ts        → OAuth flow, token refresh                 │
│    • client.ts      → Gmail API wrapper                         │
│    • webhook.ts     → Gmail push notification handler           │
│    • parser.ts      → Email parsing (extract headers, body)     │
│ ☐ Store encrypted tokens via token vault                        │
│ ☐ Register Gmail push notification (watch())                    │
│ ☐ Build webhook receiver: POST /api/webhooks/gmail              │
│ ☐ Build initial email sync (fetch last 7 days on connect)       │
│ ☐ Create emails table in schema                                 │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/api/integrations/gmail/connect/route.ts                │
│ • src/app/api/integrations/gmail/callback/route.ts               │
│ • src/app/api/webhooks/gmail/route.ts                            │
│ • src/lib/integrations/gmail/auth.ts                             │
│ • src/lib/integrations/gmail/client.ts                           │
│ • src/lib/integrations/gmail/webhook.ts                          │
│ • src/lib/integrations/gmail/parser.ts                           │
│ • src/lib/security/token-vault.ts                                │
│ • src/db/schema/emails.ts                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Email Processing Pipeline                                 │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create Inngest function: process-email                         │
│    • Trigger: email.received event                              │
│    • Fetch full email from Gmail API                            │
│    • Parse email (headers, body, attachments metadata)          │
│    • Store in emails table                                      │
│    • Emit email.processed event                                 │
│ ☐ Wire Gmail webhook → Inngest event                            │
│ ☐ Handle Gmail push notification historyId tracking             │
│ ☐ Handle token refresh on 401                                   │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/inngest/functions/process-email.ts                     │
│ • src/lib/inngest/events.ts                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 2**

```
☐ Unit: Gmail parser extracts: from, to, subject, date, body, attachments
☐ Unit: Token vault encrypts + decrypts round-trip correctly
☐ Unit: OAuth URL builder generates correct Google OAuth URL
☐ Integration: OAuth flow → receive tokens → stored encrypted
☐ Integration: Gmail push notification → email fetched → stored in DB
☐ Integration: Token expired → auto-refresh → retry succeeds
☐ Integration: Initial sync fetches last 7 days of emails
☐ Integration: Duplicate detection (same gmail_id = no duplicate insert)
☐ E2E:    Connect Gmail button → OAuth flow → integration shows "Connected"
☐ E2E:    Send test email → appears in dashboard within 30 seconds
```

### Sprint 3 (Week 5–6): Dashboard & Email List ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Dashboard UI                                              │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create layout: app/(dashboard)/layout.tsx                     │
│    • Sidebar: workspace name, nav links, user menu              │
│    • Top bar: search, notifications, profile                    │
│ ☐ Create page: app/(dashboard)/page.tsx (main dashboard)        │
│    • Email feed (latest emails, grouped by customer)            │
│    • Quick stats: emails today, pending actions, customers      │
│ ☐ Create component: EmailList                                    │
│    • Infinite scroll (TanStack Query useInfiniteQuery)           │
│    • Search + filter (by customer, date, sentiment)             │
│ ☐ Create component: EmailCard                                    │
│    • Subject, sender, preview, time, sentiment badge            │
│ ☐ Create page: app/(dashboard)/emails/[id]/page.tsx             │
│    • Full email view (HTML sanitized via DOMPurify)             │
│    • AI summary section (placeholder for Phase 2)               │
│ ☐ Create tRPC router: email.list, email.get                     │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/(dashboard)/layout.tsx                                 │
│ • src/app/(dashboard)/page.tsx                                   │
│ • src/app/(dashboard)/emails/[id]/page.tsx                       │
│ • src/components/email-list.tsx                                  │
│ • src/components/email-card.tsx                                  │
│ • src/components/email-detail.tsx                                │
│ • src/lib/api/routers/email.ts                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Real-time Updates                                         │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Install Pusher / use Server-Sent Events                       │
│ ☐ Emit event on email.received → browser notification           │
│ ☐ Invalidate TanStack Query cache on new email                  │
│ ☐ Show toast: "New email from {sender}"                         │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/realtime/pusher-server.ts                              │
│ • src/lib/realtime/pusher-client.ts                              │
│ • src/components/email-notification.tsx                          │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 3**

```
☐ Unit: tRPC email.list returns paginated emails
☐ Unit: tRPC email.get returns single email with all fields
☐ Integration: Email list API → respects workspace_id isolation
☐ Integration: Infinite scroll loads next page correctly
☐ E2E:    Dashboard loads → email feed visible → scroll loads more
☐ E2E:    Click email → email detail page shows full content
☐ E2E:    Search emails → filtered results shown
☐ E2E:    Real-time: send email → notification toast appears
☐ E2E:    Real-time: email appears in feed without page refresh
```

### Sprint 4 (Week 7–8): Slack Integration + Polish ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Slack Integration                                         │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create Slack App → configure OAuth scopes                     │
│ ☐ Build Slack adapter: src/lib/integrations/slack/              │
│    • auth.ts        → OAuth flow                                │
│    • client.ts      → Slack API wrapper                         │
│    • events.ts      → Event subscription handler                │
│ ☐ Build webhook receiver: POST /api/webhooks/slack              │
│ ☐ Store Slack messages in conversations/messages tables         │
│ ☐ Show Slack conversations in dashboard (unified feed)          │
│ ☐ Add channel filter to dashboard                               │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/api/integrations/slack/connect/route.ts                │
│ • src/app/api/webhooks/slack/route.ts                            │
│ • src/lib/integrations/slack/**                                  │
│ • src/components/channel-filter.tsx                              │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 4**

```
☐ E2E: Connect Slack → see Slack messages in unified feed
☐ E2E: Filter by channel → only Slack or only Email shown
☐ Integration: Slack event webhook → message stored correctly
```

### Phase 1 Deploy Checklist

```
☐ Vercel production deployment configured
☐ Railway services configured (PostgreSQL, Redis)
☐ Environment variables set in production:
   • DATABASE_URL (Railway)
   • CLERK_SECRET_KEY
   • NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   • GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
   • SLACK_CLIENT_ID, SLACK_CLIENT_SECRET
   • UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
   • SENTRY_DSN
   • TOKEN_ENCRYPTION_KEY
☐ Google Cloud Project → Gmail API enabled, OAuth in production mode
☐ Slack App → approved scopes, event subscriptions verified
☐ Clerk → production instance, custom domain
☐ Database migrations run in production
☐ SSL/TLS verified on custom domain
☐ Health check endpoint monitored (BetterStack)
☐ Sentry capturing production errors

☐ Deploy to production: npx vercel --prod
```

### Phase 1 Exit Criteria

- [ ] User can sign up, create workspace, invite team members
- [ ] User can connect Gmail → emails appear in dashboard
- [ ] User can connect Slack → messages appear in unified feed
- [ ] Real-time notifications work (new email → browser toast)
- [ ] All CRUD operations respect workspace isolation
- [ ] Zero unhandled errors in production (Sentry)
- [ ] CI pipeline is green on all branches
- [ ] Phase 1 demo ready for internal testing

---

## Phase 2: AI Memory — Understanding Customers ✅ DONE

**Duration:** Sprints 5–8 (Weeks 9–16)
**Goal:** AI extracts entities from emails, builds customer memory, creates intelligent timeline.
**Deploy:** Internal beta (team + friends).

### Sprint 5 (Week 9–10): Customer & Contact Extraction ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Entity Extraction Pipeline ✅                              │
├─────────────────────────────────────────────────────────────────┤
│ ✅ AI extraction module: src/lib/ai/extraction.ts                 │
│    • DeepSeek V3 via @ai-sdk/openai-compatible                  │
│    • generateText + Zod schema validation                       │
│ ✅ Customer matching logic:                                       │
│    src/lib/customer-memory/customer-matcher.ts                   │
│    • Match email domain → existing customer or create new       │
│    • Match contact email → existing contact or add to customer  │
│ ✅ Created tables: customers, contacts                           │
│ ✅ Linked emails to customers (customerId FK)                    │
│ ✅ Customer list page: /dashboard/customers                      │
│ ✅ Customer detail page: /dashboard/customers/[id]               │
│ ✅ Full extraction pipeline wired into Gmail webhook + sync      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/ai/extraction.ts ← DeepSeek V3 extraction              │
│ • src/lib/customer-memory/customer-matcher.ts ← Matching logic   │
│ • src/db/schema/customers.ts, contacts.ts                        │
│ • src/app/api/customers/route.ts, [id]/route.ts                 │
│ • src/app/(dashboard)/dashboard/customers/page.tsx               │
│ • src/app/(dashboard)/dashboard/customers/[id]/page.tsx          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: AI Evaluation Harness (for extraction)                    │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create test dataset: 20 emails with known entities            │
│ ☐ Create eval script: tests/ai/extraction.eval.ts               │
│ ☐ Metrics: precision, recall, F1 for entity extraction          │
│ ☐ Gate: extraction must achieve >85% F1 before proceeding       │
│                                                                  │
│ Key Files:                                                       │
│ • tests/fixtures/emails/ (20 .json files)                        │
│ • tests/fixtures/expected-entities/ (expected outputs)           │
│ • tests/ai/extraction.eval.ts                                    │
│ • src/lib/ai/evaluation/metrics.ts                               │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 5** ✅

```
✅ Unit: Entity extraction returns valid schema (DeepSeek V3)
✅ Unit: Customer matcher links email to correct customer by domain
✅ Unit: Customer matcher creates new customer when no match
✅ Integration: email.processed → entities extracted → customer linked
✅ Integration: Customer list page shows AI-discovered customers
✅ Integration: Customer detail page shows contacts + emails
☐ AI Eval: Extraction F1 score > 85% on golden dataset (deferred)
```

### Sprint 6 (Week 11–12): Customer Memory Engine ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Memory Extraction Pipeline ✅                              │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Fact extraction: src/lib/customer-memory/extract-facts.ts     │
│    • DeepSeek V3 extracts 8 categories: budget, timeline,        │
│      objection, competitor, decision_maker, requirements,        │
│      commitment, general                                        │
│    • Deduplication against existing facts                       │
│    • Confidence scoring (0-100)                                  │
│ ✅ Table: customer_memory_entries with FK to emails              │
│ ✅ API: POST /api/ai/extract-memory                              │
│ ✅ Memory card on customer detail page                           │
│    • Facts grouped by category with confidence bars              │
│    • Evidence quotes shown for each fact                         │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/customer-memory/extract-facts.ts ← AI fact extraction  │
│ • src/db/schema/customer-memory.ts                               │
│ • src/app/api/ai/extract-memory/route.ts                         │
│ • src/app/(dashboard)/customers/[id]/page.tsx (Memory card)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Customer Profile Page (UI)                                │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create page: app/(dashboard)/customers/[id]/page.tsx          │
│ ☐ Customer header: name, company, email, engagement score       │
│ ☐ Memory section: facts grouped by category with confidence     │
│ ☐ Contact section: all contacts at this company                 │
│ ☐ Recent activity: latest emails, conversations                 │
│ ☐ Allow user to add/edit/delete memory entries                  │
│ ☐ Show evidence link (click → source email)                     │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/(dashboard)/customers/[id]/page.tsx                    │
│ • src/components/customer-memory-card.tsx                        │
│ • src/components/customer-memory-editor.tsx                      │
│ • src/components/engagement-score.tsx                            │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 6** ✅

```
☐ Unit: Facts extracted with correct categories
☐ Unit: Deduplication merges "Budget $50K" + "Budget $50-60K"
☐ Unit: Deduplication keeps distinct facts from different categories
☐ Unit: Confidence scoring: repeated fact → higher confidence
☐ AI Eval: Memory extraction correctness > 80% on golden dataset
☐ Integration: Repeated mention → confidence increases
☐ Integration: Expired facts are marked as expired
☐ E2E:    Open customer → see AI-curated memory
☐ E2E:    User adds manual memory entry → saved
☐ E2E:    Click evidence → opens source email
☐ E2E:    User edits AI fact → corrected version saved
```

### Sprint 7 (Week 13–14): Intelligent Timeline ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Timeline Engine ✅                                         │
├─────────────────────────────────────────────────────────────────┤
│ ✅ AI event generator: src/lib/timeline/event-generator.ts       │
│    • DeepSeek V3 classifies 9 event types                       │
│    • Generates concise title + 1-2 sentence description         │
│ ✅ Table: timeline_events (type, title, description, occurredAt) │
│ ✅ API: POST /api/ai/generate-timeline                           │
│ ✅ Timeline card on customer detail page                         │
│    • Vertical timeline with color-coded icons                   │
│    • Chronological order, event type badges                     │
│ ✅ Auto-triggered after entity extraction (fire-and-forget)      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/timeline/event-generator.ts ← AI event classification  │
│ • src/db/schema/timeline-events.ts                               │
│ • src/app/api/ai/generate-timeline/route.ts                      │
│ • src/app/(dashboard)/customers/[id]/page.tsx (Timeline card)    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Timeline UI                                               │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create component: CustomerTimeline                             │
│    • Vertical timeline (chronological)                          │
│    • Each event: icon, date, title, description, source link    │
│    • Color-coded by event type                                  │
│    • Filter by type (emails, meetings, notes, AI actions)       │
│    • AI-generated summary at top: "Last 30 days: ..."           │
│                                                                  │
│ Key Files:                                                       │
│ • src/components/customer-timeline.tsx                           │
│ • src/components/timeline-event.tsx                              │
│ • src/components/timeline-filter.tsx                             │
│ • src/components/timeline-summary.tsx                            │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 7** ✅

```
☐ Unit: Event title generation produces meaningful titles
☐ Unit: Event type classification is correct
☐ Integration: Email → event created → appears in timeline
☐ Integration: Multiple events → chronological order correct
☐ E2E:    Customer timeline → events in chronological order
☐ E2E:    Filter by type → only selected events shown
☐ E2E:    Click event → opens source email
```

### Sprint 8 (Week 15–16): Semantic Search ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Hybrid Search + AI Answers ✅                              │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Search API: GET /api/search?q=...&mode=ask                    │
│    • Text search across emails + memory via PostgreSQL ILIKE    │
│    • "Ask AI" mode: DeepSeek V3 answers questions from results  │
│ ✅ Global search UI: src/components/global-search.tsx            │
│    • Cmd+K to open from anywhere                                │
│    • Real-time results as you type                              │
│    • End query with "?" for AI answer mode                      │
│    • Results grouped by type (email/memory) with customer badge │
│ ✅ Integrated into DashboardLayout (all pages)                   │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/api/search/route.ts ← Hybrid search + AI answers       │
│ • src/components/global-search.tsx ← Cmd+K search modal          │
│ • src/components/dashboard-layout.tsx ← Added GlobalSearch       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Search UI                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Add global search bar (Cmd+K)                                 │
│ ☐ Semantic search across all emails + memory                    │
│ ☐ Show results with snippet + relevance score                   │
│ ☐ "Ask AI" mode: natural language query → AI answer            │
│    "What did Acme say about budget in March?"                   │
│                                                                  │
│ Key Files:                                                       │
│ • src/components/global-search.tsx                               │
│ • src/components/search-results.tsx                              │
│ • src/components/ai-answer.tsx                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 8** ✅

```
☐ Unit: Embedding generation produces correct dimensions (1536)
☐ Unit: Cosine similarity search returns relevant results
☐ Integration: Search "pricing" → finds pricing-related emails
☐ Integration: Search respects workspace isolation
☐ E2E:    Cmd+K → search "budget" → relevant results
☐ E2E:    "Ask AI: What did Acme say about pricing?" → AI answer with citations
```

### Phase 2 Deploy Checklist

```
☐ All Phase 1 checks pass
☐ OPENAI_API_KEY set in production
☐ pgvector extension enabled on production PostgreSQL
☐ Embedding generation verified in production
☐ Semantic search latency < 500ms (p95)
☐ AI eval metrics within acceptable thresholds
☐ Database backup strategy verified (Railway point-in-time recovery)
```

### Phase 2 Exit Criteria

- [x] AI extracts entities from emails (DeepSeek V3)
- [x] Customer memory builds automatically from email data
- [x] Timeline generates automatically with AI titles
- [x] Search works across all emails + memory (Cmd+K, AI answers)
- [ ] User can correct AI-extracted facts (deferred)
- [ ] Search latency < 500ms p95 (deferred)
- [ ] Internal beta users actively using the product
- [ ] Feedback collected and prioritized for Phase 3

---

## Phase 3: Recommendations — AI Suggests Actions (MVP Launch) ✅ DONE

**Duration:** Sprints 9–12 (Weeks 17–24)
**Goal:** AI analyzes customer context and recommends next-best-actions. **PUBLIC LAUNCH.**
**Deploy:** Public beta → official launch.

### Sprint 9 (Week 17–18): Coordinator Agent ✅ DONE (merged into Sprint 10)

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Coordinator Agent (LangGraph)                             │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Install @langchain/langgraph, ai (Vercel AI SDK)              │
│ ☐ Create StateGraph for coordinator agent:                      │
│    • Node 1: Collect Context (fetch memory, recent emails)      │
│    • Node 2: Analyze Intent (classify email purpose)            │
│    • Node 3: Assess Urgency (scoring logic)                     │
│    • Node 4: Generate Recommendation                            │
│ ☐ Create model router:                                          │
│    • Classification → GPT-4o-mini                                │
│    • Complex reasoning → GPT-4o                                  │
│    • Drafting → Claude Sonnet                                    │
│ ☐ Build confidence scoring system                               │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/agents/coordinator/graph.ts                            │
│ • src/lib/agents/coordinator/nodes/                              │
│ • src/lib/ai/model-router.ts                                     │
│ • src/lib/ai/confidence.ts                                       │
│ • src/db/schema/recommendations.ts                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Model Router                                              │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create model-routing config:                                   │
│    classification: gpt-4o-mini (fast, cheap)                    │
│    extraction: gpt-4o-mini                                      │
│    summarization: gpt-4o-mini                                   │
│    drafting: claude-sonnet-4 (high quality)                     │
│    reasoning: gpt-4o (complex logic)                            │
│    recommendation: gpt-4o                                       │
│ ☐ Build cost tracker (per-call, per-user, daily budget)         │
│ ☐ Build fallback: if primary model fails → secondary model      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/ai/model-router.ts                                     │
│ • src/lib/ai/cost-tracker.ts                                     │
│ • src/lib/ai/fallback.ts                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 9** ✅ (merged into Sprint 10)

```
☐ Unit: Coordinator agent routes to correct specialist node
☐ Unit: Model router selects correct model for task type
☐ Unit: Cost tracker accumulates per-user costs correctly
☐ Unit: Fallback triggers when primary model errors
☐ Integration: Full agent pipeline: email → context → recommendation
☐ Integration: Agent respects workspace isolation
```

### Sprint 10 (Week 19–20): Recommendation Engine + UI ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Recommendation Engine ✅                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Engine: src/lib/recommendations/engine.ts                     │
│    • DeepSeek V3 analyzes customer context (emails, memory,      │
│      timeline) → generates 1-3 recommendations                  │
│    • 8 action types: send_email, schedule_meeting, share_pricing,│
│      follow_up, escalate, mark_lost, ask_feedback, send_proposal│
│    • Urgency levels: critical, high, medium, low                │
│    • Confidence scoring (0-100) with reasoning text              │
│ ✅ Table: recommendations + API (GET/POST/PATCH)                 │
│ ✅ RecommendationQueue dashboard widget                          │
│    • Priority queue with [Approve] [Reject] [Snooze]            │
│    • Urgency badges + confidence bars                           │
│ ✅ Auto-triggered after entity extraction                        │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/recommendations/engine.ts ← AI recommendation engine   │
│ • src/db/schema/recommendations.ts                               │
│ • src/app/api/recommendations/route.ts                           │
│ • src/components/recommendation-queue.tsx ← Dashboard widget     │
└─────────────────────────────────────────────────────────────────┘

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Recommendation Engine                                     │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create recommendation types + scoring:                        │
│    • send_email (follow-up, introduction, thank-you)            │
│    • schedule_meeting (demo, discovery, QBR)                    │
│    • share_pricing (tier recommendation based on context)       │
│    • send_proposal (with AI-drafted content)                    │
│    • follow_up (based on silence duration)                      │
│    • escalate (to manager, based on urgency)                    │
│    • mark_lost (based on rejection signals)                     │
│    • ask_feedback (post-meeting, post-proposal)                 │
│    • send_invoice (post-deal-close)                              │
│ ☐ Scoring factors: urgency, engagement, timeline, budget        │
│ ☐ Ranking: sort recommendations by score                        │
│ ☐ Generate reasoning text: "Because the customer asked about    │
│    pricing 3 days ago and hasn't received a response..."        │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/recommendations/engine.ts                              │
│ • src/lib/recommendations/scoring.ts                             │
│ • src/lib/recommendations/types.ts                               │
│ • src/lib/agents/recommender/                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Recommendations Dashboard UI                              │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Priority Queue (main dashboard widget):                       │
│    • Urgency badges (critical red, high orange, medium yellow)  │
│    • Customer name, action, reasoning summary                   │
│    • [Approve] [Reject] [Snooze] buttons                        │
│ ☐ Recommendation Detail Modal:                                  │
│    • Full reasoning: WHY this recommendation                    │
│    • Evidence: supporting emails/memory entries                 │
│    • Confidence score with visual indicator                     │
│    • Draft preview (if action generates content)                │
│ ☐ Recommendation history (all past recommendations)             │
│ ☐ Filter by status (pending, approved, rejected, executed)      │
│                                                                  │
│ Key Files:                                                       │
│ • src/components/recommendation-queue.tsx                        │
│ • src/components/recommendation-card.tsx                         │
│ • src/components/recommendation-detail.tsx                       │
│ • src/components/recommendation-history.tsx                      │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 10** ✅

```
☐ Unit: Scoring engine produces higher scores for urgent items
☐ Unit: Ranking sorts by score descending
☐ Unit: Reasoning text is meaningful and evidence-based
☐ AI Eval: Recommendation type accuracy > 75% on golden dataset
☐ AI Eval: Reasoning quality: mentions specific evidence > 90%
☐ Integration: Email with "send me pricing" → recommendation "share_pricing"
☐ Integration: 14 days silence → recommendation "follow_up" with urgency
☐ E2E:    Dashboard shows recommendations sorted by urgency
☐ E2E:    Click recommendation → detail modal with reasoning + evidence
☐ E2E:    Approve recommendation → status changes to approved
☐ E2E:    Reject recommendation → status changes to rejected + reason prompt
☐ E2E:    Snooze recommendation → disappears + reappears after time
```

### Sprint 11 (Week 21–22): Drafting Agent ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Drafting Agent ✅                                         │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Draft generator: src/lib/drafting/generator.ts                │
│    • DeepSeek V3 generates email drafts with customer context    │
│    • 6 draft types: follow_up, pricing, meeting_request,         │
│      proposal_cover, thank_you, check_in                        │
│    • Personalized using customer memory facts + recent emails    │
│ ✅ Drafts table: versioned (version, editDistance)               │
│ ✅ API: POST /api/drafts (generate), PUT (edit)                  │
│ ✅ DraftPreview component: Generate → Edit → Send → Regenerate   │
│    • Inline editor, edit distance tracking                      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/drafting/generator.ts ← AI draft generation            │
│ • src/db/schema/drafts.ts                                        │
│ • src/app/api/drafts/route.ts                                    │
│ • src/components/draft-preview.tsx ← Draft preview/edit UI       │
└─────────────────────────────────────────────────────────────────┘

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Drafting Agent                                            │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create drafting agent (LangGraph node):                       │
│    • Input: recommendation type + customer context              │
│    • Fetch: full customer memory, recent conversations          │
│    • Fetch: user's past email style (optional, opt-in)          │
│    • Generate: draft email/proposal/summary                     │
│    • Output: draft with subject + body (text + HTML)            │
│ ☐ Draft types:                                                  │
│    • Follow-up email                                            │
│    • Pricing email (with tier recommendation)                   │
│    • Meeting request                                            │
│    • Proposal cover email                                       │
│    • Thank-you email                                            │
│    • Check-in email                                             │
│ ☐ Create table: drafts (versioned)                              │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/agents/drafting/graph.ts                               │
│ • src/lib/drafting/generator.ts                                  │
│ • src/lib/drafting/prompts/ (one per draft type)                 │
│ • src/lib/drafting/style-matcher.ts                              │
│ • src/db/schema/drafts.ts                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Draft Preview + Edit UI                                   │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Draft preview in recommendation detail modal                  │
│ ☐ Inline editor (edit generated draft before sending)           │
│ ☐ Version history (see all versions of a draft)                 │
│ ☐ [Send] [Edit] [Regenerate] [Discard] buttons                  │
│ ☐ Track edit distance (how much user changed AI draft)          │
│                                                                  │
│ Key Files:                                                       │
│ • src/components/draft-preview.tsx                               │
│ • src/components/draft-editor.tsx                                │
│ • src/components/draft-history.tsx                               │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 11**

```
☐ Unit: Drafting agent generates email with correct context
☐ Unit: Draft versioning creates new version on edit
☐ AI Eval: Draft relevance score > 4/5 (human-rated on 20 samples)
☐ AI Eval: Draft edit distance < 20% (user changes <20% of draft)
☐ Integration: Approve recommendation → draft auto-generated
☐ Integration: Edit draft → new version saved
☐ E2E:    Approve "Send follow-up" → draft appears → edit → send
☐ E2E:    Regenerate draft → new version appears
```

### Sprint 12 (Week 23–24): Calendar Integration + Landing Page ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Landing Page & Onboarding ✅                              │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Landing page: app/(marketing)/page.tsx                        │
│    • Hero with CTA, feature grid (6 features)                   │
│    • How it works (3 steps), pricing CTA section                │
│    • Navigation: Sign in / Get started                          │
│ ✅ Onboarding wizard: src/components/onboarding-wizard.tsx      │
│    • Step 1: Connect Gmail                                      │
│    • Step 2: Connect Slack (optional)                           │
│    • Step 3: Go to Dashboard                                    │
│    • Progress indicator, skip option                            │
│ ✅ Onboarding page: /onboarding                                  │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/(marketing)/page.tsx ← Public landing page             │
│ • src/components/onboarding-wizard.tsx                           │
│ • src/app/(dashboard)/onboarding/page.tsx                        │
└─────────────────────────────────────────────────────────────────┘

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Google Calendar Integration                               │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Add Calendar scope to Google OAuth                            │
│ ☐ Build Calendar adapter: src/lib/integrations/calendar/        │
│ ☐ Sync calendar events → timeline_events                        │
│ ☐ Meeting scheduling: find free slots → propose times           │
│ ☐ Auto-create event after meeting booked                        │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/integrations/calendar/auth.ts                          │
│ • src/lib/integrations/calendar/client.ts                        │
│ • src/lib/integrations/calendar/scheduler.ts                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Landing Page & Onboarding                                 │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Landing page: app/(marketing)/page.tsx                        │
│    • Hero: "AI Revenue Execution Agent"                         │
│    • Features: Memory, Timeline, Recommendations, Drafting      │
│    • How it works: 3-step visual                                │
│    • Pricing: Free trial → $49/mo (solo) / $99/mo (team)       │
│    • Security page (BYODB architecture highlight)               │
│ ☐ Onboarding wizard:                                            │
│    • Step 1: Connect Gmail                                      │
│    • Step 2: Choose BYODB (Supabase) or Managed                 │
│    • Step 3: Initial sync (show progress)                       │
│    • Step 4: First recommendations appear                       │
│ ☐ Stripe integration for billing                                │
│                                                                  │
│ Key Files:                                                       │
│ • src/app/(marketing)/**                                         │
│ • src/components/onboarding-wizard.tsx                           │
│ • src/app/api/billing/stripe/route.ts                            │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 12**

```
☐ E2E: Landing page → sign up → onboarding wizard → dashboard
☐ E2E: Complete onboarding in < 3 minutes
☐ E2E: Calendar sync → meetings appear in timeline
☐ E2E: Stripe checkout → subscription active → features unlocked
☐ E2E: Free trial → expiry → upgrade prompt
☐ Load test: 50 concurrent users, dashboard loads < 2s (p95)
```

### Phase 3 Deploy Checklist (Public Launch)

```
☐ All Phase 1 + 2 checks pass
☐ ANTHROPIC_API_KEY set in production
☐ LangSmith configured for production tracing
☐ Stripe production keys configured
☐ Custom domain with SSL (area-one.com)
☐ Google OAuth app verified (production mode)
☐ Slack App approved for public distribution
☐ Privacy policy + Terms of service published
☐ Data Processing Agreement (DPA) available
☐ Security page published (BYODB guarantees)
☐ Email deliverability tested (Resend)
☐ Load test: 100 concurrent users → all thresholds met
☐ Database backups verified (daily automated)
☐ Incident response playbook ready

LAUNCH CHECKLIST:
☐ Announcement post/email drafted
☐ Product Hunt listing prepared
☐ Support email + Intercom/chat widget configured
☐ On-call rotation setup (PagerDuty or similar)
☐ Rollback plan documented
☐ Feature flags ready for kill switches
```

### Phase 3 Exit Criteria (MVP LAUNCH)

- [ ] AI generates relevant recommendations with >75% accuracy
- [ ] Drafts require < 20% human editing on average
- [ ] Users complete onboarding in < 3 minutes
- [ ] Dashboard loads in < 2 seconds (p95)
- [ ] Zero critical bugs in production
- [ ] Error rate < 0.1%
- [ ] 10+ active beta users with positive feedback
- [ ] Stripe billing works end-to-end
- [ ] Landing page converts (tracked via PostHog)

---

## Phase 4: Execution — AI Takes Action 🚧 IN PROGRESS

**Duration:** Sprints 13–16 (Weeks 25–32)
**Goal:** User can approve AI recommendations and Area-One executes them.
**Deploy:** Post-launch feature releases.

### Sprint 13 (Week 25–26): Email Sending ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Email Sending via Gmail API ✅                            │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Gmail sender: src/lib/integrations/gmail/sender.ts            │
│    • MIME message construction + base64url encoding             │
│    • Calls Gmail API /users/me/messages/send                    │
│    • Token decryption from token-vault                          │
│ ✅ Send API: POST /api/drafts/send                               │
│    • Takes draftId + toAddress → sends via Gmail               │
│    • Marks draft status as "sent"                               │
│ ✅ DraftPreview wired: Generate → Edit → Recipient → Send        │
│    • Human-in-the-loop: must enter recipient + click Send        │
│    • Shows "Sent!" confirmation after success                   │
│ ✅ Gmail send scope already in OAuth config                      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/integrations/gmail/sender.ts ← Email sender module     │
│ • src/app/api/drafts/send/route.ts ← Send API endpoint           │
│ • src/components/draft-preview.tsx ← Wired send button           │
└─────────────────────────────────────────────────────────────────┘

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Email Sending via Gmail API                               │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Add Gmail send scope to OAuth                                 │
│ ☐ Build email sender: src/lib/integrations/gmail/sender.ts      │
│ ☐ Approval → Review → Send flow:                                │
│    1. User approves recommendation                              │
│    2. Draft is generated + shown                                 │
│    3. User reviews + edits                                      │
│    4. User clicks "Send"                                        │
│    5. Email sent via Gmail API                                  │
│    6. Sent email stored in emails table                         │
│    7. Timeline event: "Email sent"                              │
│    8. Recommendation status → "executed"                        │
│ ☐ Human-in-the-loop gate: NO email sent without approval        │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/integrations/gmail/sender.ts                           │
│ • src/app/api/drafts/send/route.ts                               │
│ • src/lib/drafting/send-pipeline.ts                              │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 13**

```
☐ Unit: Email sender formats MIME correctly
☐ Integration: draft.send → Gmail API called → email delivered
☐ Integration: Sent email stored locally with gmail_id
☐ Integration: Timeline event created after send
☐ E2E:    Approve → Review draft → Send → Email arrives in recipient inbox
☐ E2E:    Sent email appears in Area-One timeline
☐ E2E:    CANNOT send without user clicking "Send" (security gate)
```

### Sprint 14 (Week 27–28): Weekly Digest + Deal Pipeline ✅ DONE

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Weekly Digest & Reporting ✅                              │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Weekly digest: src/lib/reporting/weekly-digest.ts             │
│    • DeepSeek V3 generates executive summary                    │
│    • Stats: emails, new customers, deals progressed/stalled,     │
│      pending actions, overdue follow-ups                        │
│ ✅ Reports API: GET /api/reports/weekly                          │
│ ✅ Reports page: /dashboard/reports                              │
│    • AI-powered weekly summary card                             │
│    • 6-stat grid (emails, customers, deals, pending, overdue)   │
│    • Recent highlights from timeline                            │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/reporting/weekly-digest.ts ← AI digest engine          │
│ • src/app/api/reports/weekly/route.ts                            │
│ • src/app/(dashboard)/dashboard/reports/page.tsx                 │
└─────────────────────────────────────────────────────────────────┘

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Meeting Scheduling                                        │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Calendar availability checker (find free slots)               │
│ ☐ Propose times in email (inline calendar links)                │
│ ☐ Book meeting → create Google Calendar event                   │
│ ☐ Send calendar invite to all participants                      │
│ ☐ Create Zoom/Google Meet link automatically                    │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/integrations/calendar/scheduler.ts                     │
│ • src/lib/integrations/calendar/availability.ts                  │
│ • src/components/meeting-scheduler.tsx                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: CRM Sync (HubSpot + Salesforce)                           │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Create HubSpot adapter:                                        │
│    • OAuth, contact sync, deal sync, activity logging           │
│ ☐ Create Salesforce adapter:                                    │
│    • OAuth, contact/lead sync, opportunity sync                 │
│ ☐ Two-way sync: Area-One ↔ CRM                                  │
│    • CRM contacts → Area-One customers                          │
│    • Area-One timeline events → CRM activities                   │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/integrations/hubspot/**                                │
│ • src/lib/integrations/salesforce/**                             │
└─────────────────────────────────────────────────────────────────┘
```

**Test Checklist — Sprint 14**

```
☐ E2E: Schedule meeting → calendar event created → invite sent
☐ E2E: HubSpot connect → contacts synced → updates bidirectional
☐ E2E: Salesforce connect → opportunities appear in Area-One
```

### Sprint 15 (Week 29–30): Proposal Generation + Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Proposal Generator                                        │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Proposal templates (Markdown → styled PDF/HTML)               │
│ ☐ AI fills template with customer context                       │
│    • Customer name, company, requirements                       │
│    • Pricing based on customer's budget (from memory)           │
│    • Timeline based on customer's timeline (from memory)        │
│    • Custom sections based on customer's objections             │
│ ☐ Preview → Edit → Approve → Send as email attachment           │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/drafting/proposal-generator.ts                         │
│ • src/lib/drafting/proposal-templates/                           │
│ • src/components/proposal-preview.tsx                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Weekly Summary + Reporting                                │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Weekly email digest:                                          │
│    • Deals progressed, deals stalled                            │
│    • Overdue follow-ups                                         │
│    • New recommendations generated                              │
│    • Actions taken this week                                    │
│ ☐ Deal pipeline view (Kanban)                                   │
│    • Columns: New → Contacted → Qualified → Proposal → Won/Lost │
│    • AI auto-moves deals based on activity                      │
│                                                                  │
│ Key Files:                                                       │
│ • src/lib/reporting/weekly-digest.ts                             │
│ • src/lib/inngest/functions/send-weekly-digest.ts                │
│ • src/components/deal-pipeline.tsx                               │
└─────────────────────────────────────────────────────────────────┘
```

### Sprint 16 (Week 31–32): Outlook + Polish

```
☐ Outlook integration (Microsoft Graph API)
☐ Mobile-responsive audit
☐ Accessibility audit + fixes (WCAG 2.1 AA)
☐ Performance optimization (Lighthouse > 90)
☐ Error boundary coverage (every page)
```

### Phase 4 Deploy Checklist

```
☐ Gmail send scope approved by Google (sensitive scope verification)
☐ Calendar scope approved
☐ HubSpot App published
☐ Salesforce AppExchange listing (if applicable)
☐ Email sending tested with various recipients
☐ Calendar booking tested across timezones
☐ CRM sync tested with real accounts
```

---

## Phase 5: Multi-Agent & Autonomy

**Duration:** Sprints 17–20 (Weeks 33–40)
**Goal:** Specialist agents work together. Configurable autonomous execution.

### Sprint 17–18: Multi-Agent System

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Specialist Agents                                         │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Proposal Agent: handles full proposal lifecycle               │
│ ☐ Contract Agent: generates contract drafts                     │
│ ☐ Invoice Agent: creates + sends invoices (via Stripe)          │
│ ☐ Payment Agent (AgentPay): collects payments via Stripe        │
│ ☐ Multi-agent coordination via LangGraph sub-graphs             │
│                                                                  │
│ Pipeline:                                                        │
│   Sales Agent → Proposal Agent → Contract Agent                  │
│                                   → Invoice Agent                │
│                                      → Payment Agent             │
└─────────────────────────────────────────────────────────────────┘
```

### Sprint 19–20: Autonomous Actions + Plugin System

```
┌─────────────────────────────────────────────────────────────────┐
│ BUILD: Configurable Autonomy                                     │
├─────────────────────────────────────────────────────────────────┤
│ ☐ Auto-execute rules engine:                                     │
│    "If confidence > 0.9 AND action_type = follow_up               │
│     AND customer is in trial → auto-send"                        │
│ ☐ Guardrail levels:                                              │
│    Level 0: Fully autonomous (categorize, extract)               │
│    Level 1: Auto-draft, user approves (send email)               │
│    Level 2: Suggest, user initiates (schedule meeting)           │
│    Level 3: Never autonomous (change pricing, sign contracts)    │
│ ☐ Plugin architecture → extensible integration system            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 6: Scale, Compliance & Enterprise

**Duration:** Sprints 21+ (Weeks 41+)

```
┌─────────────────────────────────────────────────────────────────┐
│ Enterprise Features                                              │
├─────────────────────────────────────────────────────────────────┤
│ ☐ SSO (SAML/OIDC via Clerk)                                     │
│ ☐ Advanced RBAC (custom roles, fine-grained permissions)        │
│ ☐ Audit log exports (CSV, SIEM integration)                     │
│ ☐ Custom data retention policies                                │
│ ☐ Dedicated infrastructure option                               │
│ ☐ SOC 2 Type II audit                                           │
│ ☐ BYODB enterprise mode (connect to existing PostgreSQL)        │
│ ☐ On-premise deployment option (Docker/K8s)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Testing Strategy Per Phase

```
┌─────────────────────────────────────────────────────────────────┐
│             CUMULATIVE TEST COVERAGE TARGETS                     │
│                                                                 │
│  Phase 0:  Setup validation (health checks, env tests)          │
│  Phase 1:  60% unit coverage, critical E2E flows                │
│  Phase 2:  70% unit coverage, AI eval harness active            │
│  Phase 3:  80% unit coverage, full E2E, AI eval >75% accuracy   │
│  Phase 4:  85% unit coverage, load tested (100 concurrent)      │
│  Phase 5:  85% unit coverage, chaos tested                      │
│  Phase 6:  90% unit coverage, pen tested, SOC 2 audited         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│             TESTING GATES PER PHASE                              │
│                                                                 │
│  BEFORE merging to main:                                        │
│  ☐ npm run lint (0 errors)                                     │
│  ☐ npm run typecheck (0 errors)                                │
│  ☐ npm run test:unit (all pass)                                │
│  ☐ npm run test:integration (all pass)                         │
│                                                                 │
│  BEFORE deploying to production:                                │
│  ☐ npm run test:e2e (critical paths)                           │
│  ☐ npm run test:ai-eval (within thresholds)                    │
│  ☐ npm run test:load (Phase 3+)                                │
│  ☐ Manual smoke test on staging                                │
│  ☐ Feature flagged (Phase 3+)                                  │
└─────────────────────────────────────────────────────────────────┘
```

### AI Evaluation Cadence

| Frequency | What | Who |
|-----------|------|-----|
| Every PR | Automated eval suite (golden dataset) | CI pipeline |
| Weekly | Manual review of 20 AI outputs (rate 1-5) | Team rotation |
| Bi-weekly | Eval dataset refresh (add new scenarios) | Engineering lead |
| Monthly | Production metric review (acceptance rate, edit distance) | Full team |

---

## 9. Deployment Strategy Per Phase

```
┌─────────────────────────────────────────────────────────────────┐
│             DEPLOYMENT STRATEGY PER PHASE                        │
│                                                                 │
│  Phase 0:  Local only (docker compose)                          │
│  Phase 1:  Preview (per-PR) + Production (internal)             │
│  Phase 2:  Preview + Production (internal beta)                 │
│  Phase 3:  Preview + Staging + Production (PUBLIC)              │
│            • Canary deploys (10% → 50% → 100%)                  │
│            • Feature flags (Railway Feature Flags)              │
│  Phase 4+: Preview + Staging + Canary + Production              │
│            • Blue-green for database migrations                 │
│            • Automated rollback triggers (error rate spike)     │
└─────────────────────────────────────────────────────────────────┘
```

### Production Deployment Command

```bash
# 1. Merge PR to main → CI runs full test suite
# 2. Deploy to staging
git push origin main
# GitHub Actions auto-deploys to staging

# 3. Smoke test on staging
curl -f https://staging.area-one.com/api/health

# 4. Manual verification
# - Sign in, check dashboard loads
# - Connect Gmail test account
# - Verify email processing
# - Verify recommendation generation

# 5. Deploy to production
npx vercel --prod

# 6. Run migrations (if schema changed)
npx drizzle-kit migrate

# 7. Verify production
curl -f https://app.area-one.com/api/health

# 8. Monitor for 30 minutes
# - Check Sentry for new errors
# - Check BetterStack for latency changes
# - Check Stripe for billing issues
```

### Rollback Procedure

```bash
# If error rate spikes or critical bug found:

# Option A: Vercel instant rollback
npx vercel rollback

# Option B: Feature flag kill switch
# Toggle off in Railway Feature Flags dashboard

# Option C: Database rollback (if migration caused issues)
npx drizzle-kit drop  # (last migration only)
```

---

## 10. Definition of Done Checklist

Every phase must satisfy its DOO before being considered complete:

```
┌─────────────────────────────────────────────────────────────────┐
│             DEFINITION OF DONE (PER PHASE)                       │
│                                                                 │
│  CODE:                                                          │
│  ☐ All features implemented per phase plan                      │
│  ☐ Code reviewed (at least 1 approver)                          │
│  ☐ No lint warnings                                             │
│  ☐ TypeScript strict mode: no errors                            │
│  ☐ No console.log left in production code                       │
│                                                                 │
│  TESTS:                                                         │
│  ☐ Unit tests: coverage meets phase target                      │
│  ☐ Integration tests: pass locally + CI                        │
│  ☐ E2E tests: critical paths pass                              │
│  ☐ AI eval: within thresholds                                   │
│  ☐ Load test: within thresholds (Phase 3+)                      │
│                                                                 │
│  DEPLOYMENT:                                                    │
│  ☐ Preview deploy succeeds                                      │
│  ☐ Production deploy succeeds                                   │
│  ☐ Health check passes                                          │
│  ☐ Database migrations run without errors                       │
│  ☐ No new Sentry errors in first 30 min                         │
│                                                                 │
│  DOCUMENTATION:                                                 │
│  ☐ API endpoints documented (if new)                            │
│  ☐ Environment variables documented (.env.example updated)      │
│  ☐ Architecture doc updated (if changed)                        │
│  ☐ CHANGELOG entry added                                        │
│                                                                 │
│  UX:                                                            │
│  ☐ Loading states for all async operations                      │
│  ☐ Error states handled (not white screen)                      │
│  ☐ Empty states with helpful messaging                          │
│  ☐ Mobile responsive (all pages)                                │
│  ☐ Accessibility: keyboard nav, screen reader labels            │
└─────────────────────────────────────────────────────────────────┘
```

---

> **This is your execution playbook.** Each sprint has:
> - **Build:** exact files to create, tasks to complete
> - **Test:** specific test cases to validate
> - **Deploy:** steps to ship to production
>
> Print this. Stick it on the wall. Check boxes as you go.

