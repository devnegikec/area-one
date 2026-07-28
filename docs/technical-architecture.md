# Area-One — Technical Architecture Document

> **Product:** AI Revenue Execution Agent
> **Team Size:** 2–5 engineers
> **Target:** $1M ARR SaaS
> **Document Version:** 1.0
> **Date:** July 2026

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [Technology Stack](#3-technology-stack)
4. [System Design](#4-system-design)
5. [Data Models](#5-data-models)
6. [API Design](#6-api-design)
7. [AI & Agent Architecture](#7-ai--agent-architecture)
8. [Testing Strategy](#8-testing-strategy)
9. [CI/CD & Deployment](#9-cicd--deployment)
10. [Data Security & Data Sovereignty](#10-data-security--data-sovereignty)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Cost Estimation](#12-cost-estimation)
13. [Development Phases & Milestones](#13-development-phases--milestones)
14. [Risk Mitigation](#14-risk-mitigation)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Next.js 15 (App Router) + React 19               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │   │
│  │  │ Dashboard │  │ Timeline │  │ AI Chat  │  │ Settings/    │  │   │
│  │  │           │  │          │  │ Interface│  │ Admin        │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API / BFF LAYER                              │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │        Next.js API Routes + tRPC / Server Actions            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │ REST/    │  │ WebSocket│  │ Webhook  │  │ Background │  │   │
│  │  │ GraphQL  │  │ (WS)     │  │ Receiver │  │ Jobs (IQ)  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE / DOMAIN LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Auth     │  │ Workspace│  │ Customer │  │ Integration      │   │
│  │ Service  │  │ Service  │  │ Memory   │  │ Hub              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Timeline │  │ Drafting │  │ Recom-   │  │ Notification     │   │
│  │ Service  │  │ Service  │  │ mendation │  │ Service          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AGENT ORCHESTRATION LAYER                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     LangGraph / Vercel AI SDK                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │Coordinator│  │ Email    │  │ Memory   │  │Recommender │  │   │
│  │  │ Agent    │  │ Agent    │  │ Agent    │  │ Agent      │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│  │  │Proposal  │  │Scheduler │  │Communication│ │Reporting  │  │   │
│  │  │ Agent    │  │ Agent    │  │ Agent    │  │ Agent      │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA / STORAGE LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │PostgreSQL│  │  Redis   │  │ pgvector │  │   S3 / R2        │   │
│  │(Primary) │  │ (Cache/  │  │(Embeddings│  │ (Documents/      │   │
│  │          │  │  Queue)  │  │ / Search)│  │  Attachments)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL / LLM LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │OpenAI    │  │Anthropic │  │Google    │  │                  │   │
│  │GPT-4o    │  │Claude    │  │Gemini    │  │  Gmail / Outlook │   │
│  └──────────┘  └──────────┘  └──────────┘  │  / Slack / Zoom  │   │
│                                             │  / Stripe / LinkedIn│ │
│                                             └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Pattern

### 2.1 Primary Pattern: Modular Monolith → Strangler Fig → Microservices

Given a **2–5 person team**, we start with a **modular monolith** and gradually extract services only when needed.

| Phase | Pattern | Rationale |
|-------|---------|-----------|
| **MVP (Months 1–4)** | Modular Monolith in Next.js | Single deployable, zero network latency between modules, simple debugging |
| **Growth (Months 5–8)** | Strangler Fig | Extract high-load or independent services (Agent Orchestrator, Webhook Processor) |
| **Scale (Months 9+)** | Event-Driven Microservices | Full separation when team grows, traffic demands it, or compliance requires isolation |

### 2.2 Module Boundaries (Inside the Monolith)

Each module is a self-contained directory with its own:

- **Domain logic** (`/lib/<module>/`) — pure functions, no framework dependency
- **Database access** (`/lib/<module>/repository.ts`) — Drizzle queries
- **API handlers** (`/app/api/<module>/`) — route handlers
- **Tests** (`/lib/<module>/__tests__/`) — unit + integration

```
src/
├── app/                        # Next.js App Router (presentation + API)
│   ├── (dashboard)/            # Authenticated dashboard routes
│   ├── (marketing)/            # Public landing pages
│   ├── api/                    # API routes
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── customers/
│   │   ├── timeline/
│   │   ├── recommendations/
│   │   ├── drafts/
│   │   ├── integrations/
│   │   └── webhooks/
│   └── layout.tsx
├── lib/                        # Domain logic (framework-agnostic)
│   ├── auth/                   # Authentication & authorization
│   ├── workspace/              # Multi-tenant workspace management
│   ├── customer-memory/        # Customer graph, timeline, memory
│   ├── recommendations/        # Next-best-action engine
│   ├── drafting/               # Email/proposal/content generation
│   ├── integrations/           # External service connectors
│   ├── agents/                 # AI agent definitions (LangGraph)
│   ├── ai/                     # LLM gateway, prompt templates
│   ├── queue/                  # Background job processing
│   └── shared/                 # Shared utilities, types, constants
├── db/                         # Drizzle ORM
│   ├── schema/                 # Database schema definitions
│   ├── migrations/             # Generated migrations
│   └── seed/                   # Seed data
├── emails/                     # React Email templates
└── tests/                      # E2E tests (Playwright)
```

### 2.3 Key Architectural Principles

1. **Domain-driven modules** — each module owns its data and logic; modules communicate through well-defined interfaces (never direct DB access across modules).
2. **Event-driven communication** — modules emit events (`CustomerCreated`, `EmailReceived`, `ActionApproved`) consumed by other modules via an in-process event bus (later: external message queue).
3. **Ports & Adapters (Hexagonal)** — integration code (Gmail API, Slack API) lives in adapter files; domain logic never imports third-party SDKs directly.
4. **CQRS-lite for AI workloads** — reads (dashboard, timeline) are optimized separately from writes (agent actions); read models are pre-computed materialized views.

---

## 3. Technology Stack

### 3.1 Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) + React 19 | Hybrid rendering (RSC for fast loads, client components for interactivity), built-in API routes |
| **Language** | TypeScript (strict mode) | End-to-end type safety from DB to UI |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, accessible components, design system built-in |
| **State Management** | Zustand + TanStack Query | Lightweight client state, server-state caching with auto-invalidation |
| **Forms** | React Hook Form + Zod | Type-safe form validation, schema sharing with API layer |

### 3.2 Backend / API

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **API Style** | tRPC + Server Actions | End-to-end types, no code generation, perfect for monolith |
| **Real-time** | WebSockets (via PartyKit / Pusher) | Live dashboard updates, agent status streaming |
| **Background Jobs** | Inngest | Durable execution, built-in retry, event-driven, no infrastructure to manage |
| **Webhooks** | Next.js Route Handlers + Inngest | Receive external events (Gmail push, Slack events), enqueue for processing |

### 3.3 Database & Storage

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Primary DB** | PostgreSQL (Railway) | Relational data, JSONB for flexible schemas, full-text search |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great migration DX, SQL-like syntax |
| **Vector DB** | pgvector (PostgreSQL extension) | Embedding storage for semantic search, no separate service |
| **Cache** | Redis (Railway) | Session store, rate limiting, real-time presence, job queues (via Inngest) |
| **Object Storage** | Cloudflare R2 (or S3) | Document attachments, email exports, audit logs; no egress fees |
| **Full-text Search** | PostgreSQL `tsvector` (MVP) → Meilisearch (scale) | Built-in first, dedicated search later |

### 3.4 AI / LLM Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Agent Framework** | Vercel AI SDK + LangGraph | Vercel AI SDK for streaming/text generation; LangGraph for multi-step agent workflows |
| **LLM Gateway** | Vercel AI SDK (unified provider) | Single interface for OpenAI, Anthropic, Google — swap providers without code changes |
| **Primary Models** | GPT-4o (complex), GPT-4o-mini (classification), Claude Sonnet 4 (drafting) | Model routing based on task complexity and cost |
| **Embeddings** | `text-embedding-3-small` (OpenAI) | 1536-dim embeddings for semantic search |
| **Prompt Management** | LangSmith / Agenta | Prompt versioning, A/B testing, evaluation |
| **RAG Pipeline** | Custom (pgvector + LangChain) | Retrieve relevant customer context before LLM calls |

### 3.5 Authentication & Multi-tenancy

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Auth Provider** | Clerk | Managed auth, social logins, MFA, organizations API for multi-tenancy |
| **Session Management** | Clerk + Redis | Server-side session validation, fast revocation |

### 3.6 DevOps & Infrastructure

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Hosting** | Railway (primary) + Vercel (frontend CDN) | Railway for backend/services/db; Vercel for optimized Next.js edge delivery |
| **CI/CD** | GitHub Actions | Lint → Type-check → Test → Deploy pipeline |
| **Container Registry** | Railway built-in / GitHub Container Registry | Automatic builds from GitHub |
| **Monitoring** | Sentry (errors) + BetterStack (uptime/logs) | Error tracking, log aggregation, status pages |
| **Analytics** | PostHog (product) + Plausible (website) | Self-hostable product analytics, privacy-friendly |
| **Feature Flags** | Railway Feature Flags | Gradual rollouts, kill switches for AI features |

### 3.7 Testing Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Unit Tests** | Vitest | Fast, Vite-native, compatible with Jest ecosystem |
| **Integration Tests** | Vitest + Testcontainers | Spin up real PG/Redis for integration tests |
| **E2E Tests** | Playwright | Cross-browser, trace viewer, API mocking |
| **API Testing** | Vitest + MSW (Mock Service Worker) | Mock external APIs in tests |
| **AI Evaluation** | LangSmith / Custom eval harness | Compare LLM outputs against golden datasets |
| **Load Testing** | k6 | Scriptable, CI-friendly, realistic user scenarios |
| **Accessibility** | axe-core + Playwright | Automated a11y checks in CI |

---

## 4. System Design

### 4.1 Request Flow: Email Processing

This is the **core loop** of Area-One — the flow when an email arrives and the AI processes it.

```mermaid
sequenceDiagram
    participant Gmail as Gmail
    participant Webhook as Webhook Receiver
    participant Inngest as Inngest (Queue)
    participant ETL as Email Processor
    participant PG as PostgreSQL
    participant Agent as Coordinator Agent
    participant LLM as LLM Gateway
    participant User as User (Dashboard)

    Gmail->>Webhook: Push notification (new email)
    Webhook->>Inngest: Enqueue "email.received" event
    Inngest->>ETL: Process email (with retry)
    ETL->>Gmail: Fetch full email content
    ETL->>ETL: Parse, clean, extract entities
    ETL->>PG: Store raw email
    ETL->>PG: Update customer timeline
    ETL->>Inngest: Emit "email.processed" event

    Inngest->>Agent: Trigger coordinator agent
    Agent->>PG: Fetch customer memory + recent context
    Agent->>LLM: Analyze intent, urgency, sentiment
    LLM-->>Agent: Intent: "pricing inquiry", Urgency: HIGH
    Agent->>PG: Update customer memory
    Agent->>LLM: Generate next-best-action recommendation
    LLM-->>Agent: "Recommend: Send pricing proposal"
    Agent->>PG: Store recommendation
    Agent->>Inngest: Emit "recommendation.created" event

    Inngest->>User: Push notification (WebSocket)
    User->>User: Review recommendation in dashboard
```

### 4.2 Request Flow: User Approves Action

```mermaid
sequenceDiagram
    participant User as User
    participant API as Next.js API
    participant Auth as Clerk
    participant Agent as Drafting Agent
    participant LLM as LLM
    participant Gmail as Gmail API
    participant PG as PostgreSQL

    User->>API: Approve "Send pricing proposal"
    API->>Auth: Validate session + permissions
    API->>PG: Log approval + audit trail
    API->>Agent: Generate draft
    Agent->>PG: Fetch customer memory, past emails, pricing
    Agent->>LLM: Draft email with context
    LLM-->>Agent: Draft email content
    Agent-->>API: Return draft for preview
    API-->>User: Show draft
    User->>API: Confirm & send
    API->>Gmail: Send email via Gmail API
    API->>PG: Store sent email + update timeline
    API-->>User: Confirmation
```

### 4.3 Agent Orchestration Architecture

```
                     ┌─────────────────────────┐
                     │    Coordinator Agent     │
                     │  (LangGraph StateGraph)  │
                     │                         │
                     │ • Routes to specialists │
                     │ • Aggregates results     │
                     │ • Maintains session      │
                     └───────────┬─────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │  Email Agent   │  │  Memory Agent  │  │ Recommender    │
   │                │  │                │  │ Agent          │
   │ • Classify     │  │ • Extract      │  │ • Score        │
   │ • Summarize    │  │   entities     │  │   actions      │
   │ • Extract      │  │ • Deduplicate  │  │ • Rank         │
   │   action items │  │ • Link         │  │ • Explain      │
   └────────────────┘  └────────────────┘  └────────────────┘

   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
   │  Drafting      │  │  Scheduler     │  │  Communication │
   │  Agent         │  │  Agent         │  │  Agent         │
   │                │  │                │  │                │
   │ • Emails       │  │ • Find slots   │  │ • Format for   │
   │ • Proposals    │  │ • Book/update  │  │   channel      │
   │ • Summaries    │  │ • Send invites │  │ • Send         │
   │ • CRM updates  │  │ • Handle       │  │   notifications│
   └────────────────┘  │   conflicts    │  └────────────────┘
                       └────────────────┘
```

Each agent is a **LangGraph node** with:
- **System prompt** defining its role and constraints
- **Tools** (functions it can call — fetch from DB, call external API)
- **Memory** access (scoped to the customer/workspace)
- **Confidence threshold** (below threshold → escalate to user)

### 4.4 Multi-Tenancy Model

- **Organization** → Workspace (Clerk Organizations)
- **Workspace** → Has many Users, Customers, Integrations
- **Data isolation** at the database row level (every table has `workspace_id`)
- **RLS (Row Level Security)** enforced in PostgreSQL via Drizzle where clauses (not native RLS — simpler debugging for a small team)

---

## 5. Data Models

### 5.1 Core Schema (Drizzle ORM)

```typescript
// === Workspace & Users ===

workspaces {
  id            uuid PK
  name          text
  slug          text UNIQUE
  settings      jsonb         // AI preferences, notification settings
  created_at    timestamp
}

workspace_members {
  workspace_id  uuid FK
  user_id       text          // Clerk user ID
  role          enum('owner', 'admin', 'member')
}

// === Customers ===

customers {
  id            uuid PK
  workspace_id  uuid FK
  external_id   text          // Optional: CRM ID
  name          text
  company       text
  email         text
  phone         text
  linkedin_url  text
  metadata      jsonb         // Flexible: industry, size, tags
  engagement_score  float
  is_active     boolean
  created_at    timestamp
  updated_at    timestamp
}

// === Customer Memory (AI-curated facts) ===

customer_memory_entries {
  id            uuid PK
  workspace_id  uuid FK
  customer_id   uuid FK
  category      enum('budget', 'timeline', 'objection',
                     'competitor', 'decision_maker',
                     'requirements', 'commitment', 'general')
  fact          text          // The extracted fact
  evidence      text          // Source: email ID, meeting transcript ID
  confidence    float         // AI confidence score
  source        enum('ai_extracted', 'user_added')
  created_at    timestamp
  expires_at    timestamp     // Optional: facts can age out
}

// === Timeline Events ===

timeline_events {
  id            uuid PK
  workspace_id  uuid FK
  customer_id   uuid FK
  event_type    enum('email_received', 'email_sent', 'meeting_scheduled',
                     'meeting_completed', 'proposal_sent', 'deal_won',
                     'deal_lost', 'note_added', 'ai_recommendation',
                     'action_taken', 'integration_event')
  title         text
  description   text
  source_ref    text          // Reference to source: email_id, meeting_id
  metadata      jsonb
  occurred_at   timestamp     // When the event actually happened
  created_at    timestamp
}

// === Conversations & Messages ===

conversations {
  id            uuid PK
  workspace_id  uuid FK
  customer_id   uuid FK
  channel       enum('email', 'slack', 'linkedin', 'meeting',
                     'phone', 'whatsapp')
  external_id   text          // Gmail thread ID, Slack channel ID
  subject       text
  summary       text          // AI-generated summary
  sentiment     enum('positive', 'neutral', 'negative')
  created_at    timestamp
}

messages {
  id            uuid PK
  conversation_id uuid FK
  direction     enum('inbound', 'outbound')
  sender_email  text
  recipient_email text
  subject       text
  body          text
  body_html     text
  attachments   jsonb         // [{ name, url, type, size }]
  ai_summary    text          // AI-summarized version
  ai_intent     text          // Classified intent
  ai_action_items jsonb       // Extracted action items
  sent_at       timestamp
}

// === AI Recommendations ===

recommendations {
  id            uuid PK
  workspace_id  uuid FK
  customer_id   uuid FK
  action_type   enum('send_email', 'schedule_meeting', 'share_pricing',
                     'send_proposal', 'follow_up', 'escalate',
                     'mark_lost', 'ask_feedback', 'send_invoice')
  title         text
  description   text
  reasoning     text          // "Why" — human-readable AI reasoning
  evidence      jsonb         // Supporting evidence references
  confidence    float
  urgency       enum('low', 'medium', 'high', 'critical')
  status        enum('pending', 'approved', 'rejected', 'executed',
                     'expired', 'dismissed')
  drafted_content text        // AI-generated draft if applicable
  approved_by   text          // Clerk user ID
  approved_at   timestamp
  executed_at   timestamp
  created_at    timestamp
  expires_at    timestamp
}

// === Integrations ===

integrations {
  id            uuid PK
  workspace_id  uuid FK
  provider      enum('gmail', 'outlook', 'slack', 'google_calendar',
                     'zoom', 'hubspot', 'salesforce', 'stripe',
                     'linkedin', 'whatsapp')
  status        enum('active', 'expired', 'error', 'disconnected')
  credentials   text          // Encrypted token reference (never the token itself)
  settings      jsonb         // Provider-specific configuration
  last_sync_at  timestamp
  sync_status   enum('idle', 'syncing', 'error')
  created_at    timestamp
}

// === Audit Log ===

audit_logs {
  id            uuid PK
  workspace_id  uuid FK
  actor_id      text          // Clerk user ID or 'system/ai'
  action        text          // e.g., 'recommendation.approved'
  resource_type text          // e.g., 'recommendation', 'customer'
  resource_id   uuid
  details       jsonb
  ip_address    text
  user_agent    text
  created_at    timestamp
}

// === Drafts ===

drafts {
  id            uuid PK
  workspace_id  uuid FK
  customer_id   uuid FK
  recommendation_id uuid FK  // Optional — link to the recommendation
  type          enum('email', 'proposal', 'summary', 'crm_update',
                     'slack_message')
  subject       text
  content       text
  content_html  text
  status        enum('draft', 'reviewed', 'approved', 'rejected', 'sent')
  version       integer
  created_at    timestamp
  updated_at    timestamp
}
```

### 5.2 Vector Embeddings (pgvector)

```sql
-- For semantic search over customer interactions
CREATE TABLE message_embeddings (
    id            uuid PK,
    message_id    uuid FK REFERENCES messages(id),
    embedding     vector(1536),         -- text-embedding-3-small
    chunk_index   integer,              -- For long messages split into chunks
    created_at    timestamp
);

CREATE INDEX ON message_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## 6. API Design

### 6.1 API Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js App Router              │
│                                                 │
│  ┌──────────────────┐  ┌────────────────────┐   │
│  │   Server Actions  │  │   tRPC Procedures   │   │
│  │   (Mutations)     │  │   (Queries + Mutations)│  │
│  │                  │  │                     │   │
│  │ createDraft()    │  │ customer.list()     │   │
│  │ approveAction()  │  │ timeline.get()      │   │
│  │ sendEmail()      │  │ recommendations     │   │
│  │ updateSettings() │  │   .pending()        │   │
│  └──────────────────┘  └────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │           WebSocket (Pusher/PartyKit)     │   │
│  │  • recommendation.created                 │   │
│  │  • email.received                         │   │
│  │  • agent.status.changed                   │   │
│  │  • timeline.updated                       │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 6.2 Key API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trpc/customer.list` | GET | List customers with filters, search, pagination |
| `/api/trpc/customer.get` | GET | Single customer with full memory + timeline |
| `/api/trpc/timeline.get` | GET | Customer timeline (paginated, filterable by event type) |
| `/api/trpc/recommendations.pending` | GET | All pending recommendations (dashboard priority queue) |
| `/api/trpc/recommendations.approve` | POST | Approve a recommendation, trigger drafting |
| `/api/trpc/drafts.generate` | POST | Generate a draft (email, proposal, summary) |
| `/api/trpc/drafts.send` | POST | Send approved draft via integration |
| `/api/trpc/integrations.connect` | POST | Initiate OAuth flow for a provider |
| `/api/webhooks/gmail` | POST | Receive Gmail push notifications |
| `/api/webhooks/slack` | POST | Receive Slack events |
| `/api/webhooks/clerk` | POST | Clerk user/organization events |

### 6.3 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `recommendation.created` | Server → Client | `{ id, title, urgency, customerName }` |
| `recommendation.updated` | Server → Client | `{ id, status, ... }` |
| `email.received` | Server → Client | `{ customerId, subject, from }` |
| `agent.status` | Server → Client | `{ agentId, status: 'thinking' | 'done' | 'error' }` |
| `timeline.new_event` | Server → Client | `{ event }` |

---

## 7. AI & Agent Architecture

### 7.1 LLM Gateway (Model Router)

```typescript
// lib/ai/gateway.ts
const MODEL_ROUTING = {
  // Fast + cheap → classification, extraction, summarization
  classification: { model: 'gpt-4o-mini', maxTokens: 500, temp: 0.1 },
  extraction:     { model: 'gpt-4o-mini', maxTokens: 1000, temp: 0.0 },
  summarization:  { model: 'gpt-4o-mini', maxTokens: 500, temp: 0.2 },

  // High quality → drafting, reasoning, recommendations
  drafting:       { model: 'claude-sonnet-4-20250514', maxTokens: 4000, temp: 0.7 },
  reasoning:      { model: 'gpt-4o', maxTokens: 2000, temp: 0.3 },
  recommendation: { model: 'gpt-4o', maxTokens: 1500, temp: 0.4 },
};
```

This strategy keeps **~80% of calls on cheap models** and **~20% on expensive models**, dramatically reducing costs.

### 7.2 RAG Pipeline (Retrieval-Augmented Generation)

Before every agent runs, we construct context:

```
┌──────────────────────────────────────────────────┐
│                   RAG Pipeline                     │
│                                                   │
│  1. Fetch customer memory entries                 │
│     (budget, timeline, objections, competitors)   │
│                                                   │
│  2. Fetch recent conversation summaries            │
│     (last 30 days of emails, meetings)            │
│                                                   │
│  3. Semantic search via pgvector                  │
│     ("pricing questions", "security concerns")    │
│                                                   │
│  4. Fetch pending recommendations                 │
│     (what's already been suggested)               │
│                                                   │
│  5. Assemble into structured context              │
│     ↓                                             │
│  6. Inject into agent's system prompt             │
└──────────────────────────────────────────────────┘
```

### 7.3 Agent Confidence & Guardrails

Every agent output includes a **confidence score**:

| Confidence | Behavior |
|------------|----------|
| ≥ 0.9 | Auto-classify, show recommendation (low friction) |
| 0.7–0.9 | Show recommendation with explanation |
| 0.5–0.7 | Show as "Low confidence — review carefully" |
| < 0.5 | Do not show; log for improvement |

**Guardrail levels:**

| Level | Actions | Examples |
|-------|---------|----------|
| **Autonomous** | No user approval needed | Categorize emails, update customer memory, extract entities |
| **Approval Required** | User must approve | Send emails, schedule meetings, update CRM |
| **Never Autonomous** | AI cannot initiate | Change pricing, sign contracts, send invoices, delete data |

### 7.4 Prompt Strategy

```
┌──────────────────────────────────────────────┐
│              Prompt Composition               │
│                                              │
│  [System Prompt] — Role, constraints, tone   │
│  [Workspace Context] — Company info, style   │
│  [Customer Memory] — Facts, history, notes   │
│  [Recent Context] — Last N interactions      │
│  [Current Task] — What to do now             │
│  [Output Format] — Structured JSON schema    │
│  [Confidence Request] — Always return score  │
└──────────────────────────────────────────────┘
```

All prompts are version-controlled as template files (`/lib/ai/prompts/`), not hardcoded strings.

---

## 8. Testing Strategy

### 8.1 Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  Playwright
                    │  ~50    │  Critical user journeys
                    ├─────────┤
                    │Integration│ Vitest + Testcontainers
                    │  ~200   │  API + DB + Agent flows
                    ├─────────┤
                    │  Unit   │  Vitest
                    │  ~500+  │  Domain logic, utilities
                    └─────────┘

              ┌─────────────────────┐
              │   AI Evaluation     │  LangSmith / Custom
              │   ~100 test cases   │  Golden dataset + metrics
              └─────────────────────┘
```

### 8.2 Unit Tests

**What we test:**
- Domain logic (customer scoring, recommendation ranking, deduplication)
- Utility functions (email parsing, entity extraction regex, date handling)
- tRPC procedure logic (mocked DB)
- Agent tool functions (mocked LLM)

```typescript
// Example: lib/customer-memory/__tests__/deduplication.test.ts
import { describe, it, expect } from 'vitest';
import { deduplicateFacts } from '../deduplication';

describe('deduplicateFacts', () => {
  it('merges facts about the same topic with higher confidence', () => {
    const existing = [
      { fact: 'Budget is $50K', confidence: 0.7, category: 'budget' }
    ];
    const incoming = [
      { fact: 'Budget is $50K-60K', confidence: 0.9, category: 'budget' }
    ];
    const result = deduplicateFacts(existing, incoming);
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe(0.9);
  });

  it('keeps distinct facts from different categories', () => {
    const existing = [{ fact: 'Uses Salesforce', category: 'competitor' }];
    const incoming = [{ fact: 'Decision by Q3', category: 'timeline' }];
    const result = deduplicateFacts(existing, incoming);
    expect(result).toHaveLength(2);
  });
});
```

### 8.3 Integration Tests

**What we test:**
- API endpoints with real PostgreSQL (Testcontainers)
- Agent execution pipelines (mock external APIs, real LLM calls in CI with cost cap)
- Background job processing (Inngest with test mode)
- OAuth flow simulation

```typescript
// Example: lib/recommendations/__tests__/pipeline.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { createRecommendationPipeline } from '../pipeline';

describe('Recommendation Pipeline (Integration)', () => {
  let pgContainer: PostgreSqlContainer;
  let db: PostgresJsDatabase;

  beforeAll(async () => {
    pgContainer = await new PostgreSqlContainer().start();
    db = createTestDb(pgContainer.getConnectionUri());
    await migrate(db);
  });

  afterAll(async () => {
    await pgContainer.stop();
  });

  it('generates recommendation when email indicates buying intent', async () => {
    // Seed: create customer with memory
    // Trigger: process email with "send me pricing" content
    // Assert: recommendation created with action_type = 'share_pricing'
    // Assert: confidence > 0.7
    // Assert: reasoning is non-empty
  });
});
```

### 8.4 End-to-End Tests (Playwright)

**Critical user journeys we test:**

| Journey | Description |
|---------|-------------|
| **Onboarding** | Sign up → Connect Gmail → First dashboard load |
| **Email Processing** | Email arrives → AI recommendation appears → User approves → Draft generated → Email sent |
| **Customer Timeline** | Open customer → See chronological timeline → Filter by event type |
| **Integration Connection** | Connect Slack → See Slack conversations in timeline |
| **Workspace Management** | Invite team member → Member accepts → Both see same dashboard |

```typescript
// Example: tests/e2e/email-processing.spec.ts
import { test, expect } from '@playwright/test';

test('AI processes incoming email and generates recommendation', async ({ page }) => {
  await page.goto('/dashboard');
  // Wait for recommendation to appear (simulated via test helper)
  await expect(page.getByText('Share pricing with Acme')).toBeVisible();
  await page.click('[data-testid="approve-recommendation"]');
  await expect(page.getByText('Draft generated')).toBeVisible();
  await page.click('[data-testid="send-email"]');
  await expect(page.getByText('Email sent')).toBeVisible();
});
```

### 8.5 AI Evaluation Pipeline

This is **critical** — we must measure AI quality systematically.

```
┌─────────────────────────────────────────────────────────┐
│                 AI Evaluation Framework                   │
│                                                         │
│  1. Golden Dataset                                       │
│     └─ 50+ real-world scenarios with expected outputs    │
│                                                         │
│  2. Automated Metrics (per prompt template)              │
│     ├─ Exact match (classification tasks)                │
│     ├─ Semantic similarity (drafts, summaries)           │
│     ├─ JSON schema compliance (structured outputs)       │
│     └─ Confidence calibration (is score meaningful?)     │
│                                                         │
│  3. Human Review (weekly)                                │
│     └─ Sample 20 AI outputs, rate 1-5                    │
│                                                         │
│  4. Production Monitoring                                │
│     ├─ Draft acceptance rate (user approves AI draft?)   │
│     ├─ Recommendation acceptance rate                     │
│     └─ User edit distance (how much does user change?)   │
└─────────────────────────────────────────────────────────┘
```

```typescript
// Example: tests/ai/recommendation.eval.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateRecommendation } from '@/lib/ai/evaluation';

describe('AI: Recommendation Quality', () => {
  const scenarios = [
    {
      name: 'Pricing request from qualified lead',
      context: { /* customer memory, recent emails */ },
      expected: {
        action_type: 'share_pricing',
        minConfidence: 0.7,
        mustMentionKeywords: ['pricing', 'tier', 'plan'],
      }
    },
    {
      name: 'Ghosted after demo — no response for 14 days',
      context: { /* ... */ },
      expected: {
        action_type: 'follow_up',
        minConfidence: 0.6,
      }
    },
    // ... 50+ scenarios
  ];

  for (const scenario of scenarios) {
    it(scenario.name, async () => {
      const result = await evaluateRecommendation(scenario.context);
      expect(result.action_type).toBe(scenario.expected.action_type);
      expect(result.confidence).toBeGreaterThan(scenario.expected.minConfidence);
      if (scenario.expected.mustMentionKeywords) {
        for (const keyword of scenario.expected.mustMentionKeywords) {
          expect(result.reasoning.toLowerCase()).toContain(keyword);
        }
      }
    });
  }
});
```

### 8.6 Performance Testing (k6)

```javascript
// tests/load/dashboard.smoke.test.js
import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20
    { duration: '30s', target: 50 },   // Ramp to 50
    { duration: '1m', target: 50 },    // Stay at 50
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% requests under 2s
    http_req_failed: ['rate<0.01'],     // <1% error rate
  },
};

export default function () {
  const res = http.get('https://app.area-one.com/api/trpc/dashboard.summary');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
```

### 8.7 Testing in CI

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  lint-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit -- --coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  ai-evaluation:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:ai-eval
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

## 9. CI/CD & Deployment

### 9.1 Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    GitHub Repository                       │
│                         │                                 │
│                    GitHub Actions                          │
│                 (Test → Build → Deploy)                    │
│                         │                                 │
│          ┌──────────────┼──────────────┐                  │
│          │              │              │                  │
│          ▼              ▼              ▼                  │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│    │ Railway   │  │  Vercel  │  │ Cloudflare│             │
│    │           │  │          │  │           │             │
│    │ • Backend │  │ • Next.js│  │ • R2      │             │
│    │ • Postgres│  │   Frontend│ │ • Images  │             │
│    │ • Redis   │  │ • Edge   │  │ • Domain  │             │
│    │ • Inngest │  │   CDN    │  │   DNS    │             │
│    └──────────┘  └──────────┘  └──────────┘              │
└──────────────────────────────────────────────────────────┘
```

### 9.2 Environment Strategy

| Environment | Purpose | Branch | DB |
|-------------|---------|--------|----|
| **Local** | Development | `feature/*` | Docker (pgvector + Redis) |
| **Preview** | PR review | All PRs | Railway ephemeral (branch DB) |
| **Staging** | Pre-release validation | `main` | Railway (production-schema, anonymized data) |
| **Production** | Live | `main` (tagged releases) | Railway (full backups, point-in-time recovery) |

### 9.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    # ... (tests from section 8.7)

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Preview
        run: npx railway up --service area-one --environment preview

  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy Production
        run: npx railway up --service area-one --environment production
      - name: Run DB Migrations
        run: npx railway run --service area-one -- npm run db:migrate
      - name: Smoke Test
        run: |
          curl -f https://app.area-one.com/api/health || exit 1
      - name: Notify
        uses: slackapi/slack-github-action@v1
        with:
          payload: '{"text": "✅ Deployed to production: ${{ github.sha }}"}'
```

---

## 10. Data Security & Data Sovereignty

> **Core Philosophy:** Area-One should be the most trusted AI product on the market.
> Our approach: **Give customers ownership, not just promises.**
> The best way to prove data is secure is to let the customer hold it themselves.

---

### 10.1 The Trust Problem

When a founder or sales professional connects their Gmail, Slack, and calendar to an AI tool, they are handing over:

- Every email they've ever sent or received
- Customer pricing discussions and negotiation history
- Legal and contract conversations
- Internal team discussions
- Calendar details (who they meet, when, why)
- Customer contact lists

**The fundamental question every customer asks before signing up:**

> *"How do I know you won't read my emails? How do I know you won't train on my data? How do I know my competitors won't see my pipeline?"*

Traditional SaaS answers this with policies, certifications, and legal agreements. **But policies don't prove safety — architecture does.**

---

### 10.2 Architecture Option A: Centralized (Standard SaaS)

This is what the original Section 10 described — the industry standard:

```
┌─────────────────────────────────────────────────────────┐
│                  Area-One Infrastructure                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Railway)                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │    │
│  │  │ Workspace│ │ Workspace│ │ Workspace        │ │    │
│  │  │ A Data   │ │ B Data   │ │ C Data           │ │    │
│  │  │          │ │          │ │                  │ │    │
│  │  │ Emails   │ │ Emails   │ │ Emails           │ │    │
│  │  │ Contacts │ │ Contacts │ │ Contacts         │ │    │
│  │  │ Timeline │ │ Timeline │ │ Timeline         │ │    │
│  │  │ Memory   │ │ Memory   │ │ Memory           │ │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  RISK: One breach = ALL customer data exposed           │
│  TRUST MODEL: "Trust us, we promise"                    │
└─────────────────────────────────────────────────────────┘
```

**Pros:**
- Simple to build
- Fast queries (single DB)
- Easy to operate

**Cons:**
- Central **honey pot** — a single breach exposes all customers
- Customer must **trust that you're telling the truth** about not reading data
- High compliance burden (you hold PII for all customers)
- Expensive to achieve SOC 2 / ISO 27001 with customer data
- **"Trust us" is not a strong sales argument for email access**

---

### 10.3 Architecture Option B: Bring Your Own Database (BYODB) — **RECOMMENDED**

> **Revolutionary idea:** The customer's data never lives on Area-One servers. Period.

Each customer brings their **own Supabase (or Firebase) free tier account**. Area-One connects to it as a **stateless processing layer** — we process data, but we never store it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Area-One (Processing Layer)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  AI Processing Engine (Stateless)                            │  │
│  │  • Fetches data from customer's DB                           │  │
│  │  • Processes with LLM                                       │  │
│  │  • Writes results back to customer's DB                     │  │
│  │  • DOES NOT PERSIST customer data                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Area-One Central (Minimal)                                  │  │
│  │  • User auth (Clerk)                                        │  │
│  │  • Subscription/billing (Stripe)                            │  │
│  │  • DB connection config (encrypted)                          │  │
│  │  • Anonymized AI model intelligence (NOT customer data)     │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
        │                        │                        │
        │ PostgreSQL             │ PostgreSQL             │ PostgreSQL
        │ connection             │ connection             │ connection
        ▼                        ▼                        ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ Customer A's      │  │ Customer B's      │  │ Customer C's      │
│ Supabase (Free)   │  │ Supabase (Free)   │  │ Firebase (Spark)  │
│                   │  │                   │  │                   │
│ • Emails          │  │ • Emails          │  │ • Emails          │
│ • Contacts        │  │ • Contacts        │  │ • Contacts        │
│ • Timeline        │  │ • Timeline        │  │ • Timeline        │
│ • Memory          │  │ • Memory          │  │ • Memory          │
│ • Embeddings      │  │ • Embeddings      │  │ • Embeddings      │
│                   │  │                   │  │                   │
│ OWNED BY: Alice   │  │ OWNED BY: Bob     │  │ OWNED BY: Carol   │
└───────────────────┘  └───────────────────┘  └───────────────────┘

TRUST MODEL: "You hold your own data. We don't have it to lose."
```

#### How the Supabase Free Tier Fits

Supabase's free tier is **generous enough for a single user/small team**:

| Supabase Free Tier Limit | What It Means for Area-One |
|--------------------------|---------------------------|
| 500 MB database | ~500K–1M emails (plenty for years) |
| 2 GB bandwidth | More than enough for API calls |
| 50,000 monthly active users | Not relevant (single-tenant) |
| 1 GB file storage | Attachments, proposals, exports |
| pgvector included | Embeddings storage — no extra service needed |
| Community support | Sufficient for self-managed |

**Firebase Spark (free) tier** is also viable:

| Firebase Spark Limit | What It Means |
|---------------------|---------------|
| 1 GiB Firestore | Document-based storage for timeline/memory |
| 5 GB Cloud Storage | Attachments |
| 50K reads/day | Sufficient for individual use |

#### What Area-One Central Stores (The Thin Layer)

Even in BYODB, Area-One needs a minimal central database for:

| Data | Purpose | Can Customer See It? |
|------|---------|---------------------|
| Clerk user ID → DB connection string (encrypted) | Routing: which DB belongs to which user | Yes (it's their connection) |
| Subscription status (Stripe) | Billing | Yes |
| Anonymized usage metrics | Product improvement | Yes (aggregated) |
| AI model routing intelligence | "User X's emails respond best to Claude drafts" | Yes (it's derived from their data) |
| Feature flags | Gradual rollouts | No (internal) |

**Critical principle:** Area-One central DB **never** stores raw customer data — no emails, no contacts, no timeline events, no customer memory.

#### What the Customer's Supabase Stores

```
┌─────────────────────────────────────────────────────┐
│           Customer's Supabase Project               │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  emails                                      │   │
│  │  • raw_email_id, from, to, subject, body     │   │
│  │  • html_body, attachments_metadata           │   │
│  │  • received_at, processed_at                 │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  customer_memory                             │   │
│  │  • customer_id, fact, evidence, confidence   │   │
│  │  • category (budget, timeline, objection)    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  timeline_events                             │   │
│  │  • event_type, title, description, metadata  │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  conversations, messages, recommendations    │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  message_embeddings (pgvector)               │   │
│  │  • Vector embeddings for semantic search     │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Customer has full database access:                 │
│  • Direct SQL queries via Supabase dashboard        │
│  • Export all data as CSV/JSON anytime              │
│  • Delete anything, anytime                         │
│  • Revoke Area-One's access token → instant kill    │
│  • Set Row Level Security (RLS) themselves          │
└─────────────────────────────────────────────────────┘
```

---

### 10.4 Data Flow: How AI Processing Works in BYODB

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: Incoming Email (Gmail → Processing)                     │
│                                                                  │
│  Gmail Push Notification                                         │
│         │                                                        │
│         ▼                                                        │
│  Area-One Webhook Receiver (stateless function)                  │
│         │                                                        │
│         ▼                                                        │
│  Fetch email from Gmail API                                      │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────┐                 │
│  │  WRITE: email → Customer's Supabase         │  ← Data lands  │
│  └─────────────────────────────────────────────┘    in customer │
│         │                                           DB ONLY      │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────┐                 │
│  │  FETCH from Customer's Supabase:            │                 │
│  │  • Recent emails for context                │                 │
│  │  • Customer memory entries                  │                 │
│  │  • Embedding search results                 │                 │
│  └─────────────────────────────────────────────┘                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────┐                 │
│  │  AI Processing (in memory, ephemeral):      │                 │
│  │  • LLM analyzes email + context             │                 │
│  │  • Generates summary, intent, sentiment     │                 │
│  │  • Extracts entities (budget, timeline)     │                 │
│  │  • Generates next-best-action               │                 │
│  │  • ALL DATA DISCARDED FROM MEMORY AFTER     │                 │
│  └─────────────────────────────────────────────┘                 │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────┐                 │
│  │  WRITE RESULTS: Customer's Supabase         │                 │
│  │  • AI summary → messages table              │                 │
│  │  • Memory update → customer_memory table    │                 │
│  │  • Event → timeline_events table            │                 │
│  │  • Recommendation → recommendations table   │                 │
│  │  • Embedding → message_embeddings table     │                 │
│  └─────────────────────────────────────────────┘                 │
│                                                                  │
│  RESULT: Raw email + AI insights ALL in customer's DB.           │
│  Area-One holds NOTHING.                                         │
└──────────────────────────────────────────────────────────────────┘
```

#### Ephemeral Processing Guarantee

```typescript
// lib/ai/ephemeral-processor.ts

/**
 * Every AI processing run follows this invariant:
 *
 * 1. FETCH data from customer's DB (read-only for context)
 * 2. PROCESS in memory (no disk writes, no logging of raw data)
 * 3. WRITE results back to customer's DB
 * 4. PURGE all in-memory data (explicit nullification)
 *
 * Area-One central DB NEVER touched during this flow.
 */
export async function processEmail(
  customerDb: SupabaseClient,  // Customer's own Supabase
  emailId: string
): Promise<void> {
  // Step 1: Fetch from CUSTOMER's DB
  const email = await customerDb.from('emails').select('*').eq('id', emailId).single();
  const memory = await customerDb.from('customer_memory').select('*');
  const recentEmails = await customerDb.from('emails').select('*')
    .order('received_at', { ascending: false }).limit(20);

  // Step 2: Process with LLM (in memory, ephemeral)
  const context = buildContext(email, memory, recentEmails);
  const result = await analyzeWithLLM(context);

  // Step 3: Write results back to CUSTOMER's DB
  await customerDb.from('messages').update({ ai_summary: result.summary }).eq('id', emailId);
  await customerDb.from('customer_memory').insert(result.extractedFacts);
  await customerDb.from('timeline_events').insert(result.timelineEvent);
  await customerDb.from('recommendations').insert(result.recommendation);

  // Step 4: Purge (function scope ends, GC collects)
  // No data written to Area-One infrastructure
}
```

---

### 10.5 Setup Flow: Customer Connects Their Own Supabase

```
┌─────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                              │
│                                                                 │
│  STEP 1: User signs up on Area-One                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  "Welcome! Area-One needs a database to store YOUR data.  │ │
│  │   You have two options:"                                  │ │
│  │                                                           │ │
│  │   [RECOMMENDED] 🟢 Create a FREE Supabase account         │ │
│  │       • Takes 60 seconds                                  │ │
│  │       • You own 100% of your data                         │ │
│  │       • We never store your emails on our servers         │ │
│  │       • Cancel anytime — your data stays with you         │ │
│  │                                                           │ │
│  │   [ADVANCED] 🔵 Bring your own PostgreSQL connection      │ │
│  │       • Self-hosted or any cloud provider                 │ │
│  │                                                           │ │
│  │   [MANAGED] 🟡 Let us host your data (SOC 2 compliant)    │ │
│  │       • We host and protect your data                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  STEP 2: One-click Supabase project creation                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  We redirect to Supabase OAuth → User authorizes →        │ │
│  │  New project auto-created → Schema auto-migrated →        │ │
│  │  Connection string stored (encrypted) in Area-One         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  STEP 3: Done. From this point:                                 │
│  • All emails, contacts, timeline live in customer's Supabase   │
│  • Area-One acts as a stateless AI processing layer             │
│  • Customer can view their data anytime at supabase.com         │
└─────────────────────────────────────────────────────────────────┘
```

#### Auto-Setup Script (What Area-One Does on Supabase Project Creation)

```sql
-- Automatically run when customer creates their Supabase project
-- This is the FULL schema that lives in THEIR database

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Core tables (same schema as Section 5, but in customer's DB)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  -- ... (full schema from Section 5)
);

CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id TEXT UNIQUE,
  thread_id TEXT,
  from_address TEXT NOT NULL,
  to_addresses TEXT[] NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  ai_summary TEXT,
  ai_intent TEXT,
  ai_sentiment TEXT,
  ai_action_items JSONB,
  received_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
);

-- ... (all tables from Section 5: customer_memory, timeline_events,
--      conversations, messages, recommendations, message_embeddings)

-- Row Level Security (customer controls this)
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memory ENABLE ROW LEVEL SECURITY;
-- Customer can add their own RLS policies
```

---

### 10.6 Comparison: Centralized vs BYODB

| Dimension | Centralized | BYODB (Recommended) |
|-----------|-------------|---------------------|
| **Data location** | Area-One servers | Customer's Supabase/Firebase |
| **Breach impact** | ALL customers exposed | SINGLE customer exposed |
| **Compliance burden** | Area-One carries GDPR/SOC 2 for ALL data | Customer carries own compliance |
| **Trust argument** | "We promise not to look" | "We CAN'T look — you hold the data" |
| **Customer data access** | Must request export | Direct SQL access anytime |
| **Cancellation** | Must request deletion | Revoke token → instant kill |
| **AI training risk** | Customer fears we train on data | Customer sees we never stored data |
| **Infrastructure cost** | High (central DB scales with all users) | Near zero (each user has free Supabase) |
| **Query performance** | Fast (local DB) | Slightly slower (network hop) |
| **Setup friction** | Zero (automatic) | 60-second Supabase signup |
| **Embedding search** | Shared pgvector | Per-customer pgvector (better isolation!) |
| **Enterprise sales** | Harder (security questionnaire nightmare) | Easier ("Your data, your infrastructure") |

---

### 10.7 What About Embeddings and AI Intelligence?

A legitimate concern: "If all data is in the customer's DB, how does Area-One's AI improve over time?"

#### Tiered Intelligence Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI INTELLIGENCE LAYERS                       │
│                                                                 │
│  LAYER 1: Per-Customer Intelligence (Customer's DB)             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • Email classification patterns learned from THEIR data  │ │
│  │  • Drafting style matching THEIR tone                     │ │
│  │  • Recommendation rules from THEIR history                │ │
│  │  • Embeddings of THEIR conversations                      │ │
│  │                                                           │ │
│  │  STORED IN: Customer's Supabase (pgvector)                │ │
│  │  OWNED BY: Customer                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LAYER 2: Global Intelligence (Area-One Central, Anonymized)    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  • "Emails with 'pricing' + 'timeline' = high urgency"    │ │
│  │  • "Follow-up after 7 days of silence recovers 40% deals" │ │
│  │  • "Decision makers respond better to Claude drafts"      │ │
│  │  • "Insurance advisors need different templates than SaaS" │ │
│  │                                                           │ │
│  │  THESE ARE STATISTICAL PATTERNS, NOT CUSTOMER DATA.       │ │
│  │  Derived from ANONYMIZED aggregates across all users.     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LAYER 3: Base Models (Third-party)                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  GPT-4o, Claude, Gemini (never trained on customer data)  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**How global intelligence is built without seeing customer data:**

```typescript
// lib/ai/global-intelligence.ts

/**
 * Area-One collects ANONYMIZED patterns, not raw data.
 *
 * What we COLLECT (sent to Area-One central):
 * - "User completed action: send_email, confidence: 0.92, industry: SaaS"
 * - "Draft edit distance: 12% (user changed 12% of AI draft)"
 * - "Recommendation type: follow_up, accepted: true, delay: 3 days"
 *
 * What we NEVER collect:
 * - Email content, subject lines, recipient addresses
 * - Customer names, company names
 * - Actual memory facts
 * - Any PII or business-sensitive information
 */

interface AnonymizedPattern {
  eventType: 'recommendation_accepted' | 'draft_edited' | 'email_classified';
  metadata: {
    actionType?: string;       // 'send_email', 'schedule_meeting' (enum, not content)
    confidence?: number;       // 0.0–1.0 (float, not content)
    editDistance?: number;     // percentage (float, not content)
    industry?: string;         // self-reported by user
    responseTime?: number;     // hours (number, not content)
  };
  // NO raw data. NO email text. NO customer names.
}
```

---

### 10.8 Security Guarantees (What We Put in Writing)

This is what goes into your security page, enterprise sales deck, and DPA (Data Processing Agreement):

#### Guarantee 1: Data Never Touches Our Servers (BYODB Mode)

> *"In BYODB mode, Area-One functions as a stateless processing layer. Your emails, contacts, customer memory, and timeline events are written directly to YOUR Supabase or Firebase project. Area-One's infrastructure never persists your raw data. We fetch it transiently for AI processing, and it is purged from memory immediately after the operation completes."*

#### Guarantee 2: Zero AI Training on Customer Data

> *"We contractually and technically guarantee that no customer data is used to train foundation models. All LLM API calls include the `do_not_train` flag. This is enforced in code, not just policy — our LLM gateway rejects any provider configuration that lacks this guarantee."*

#### Guarantee 3: You Hold the Keys

> *"In BYODB mode, you can revoke Area-One's database access token at any time from your Supabase/Firebase dashboard. This instantly stops all processing. Your data remains in your account, accessible only to you. There is no 'deletion request' process — you already own your data."*

#### Guarantee 4: Per-Workspace Physical Isolation

> *"Customer data is never co-mingled. In centralized mode, strict workspace_id partitioning ensures zero cross-tenant data access. In BYODB mode, isolation is physical — each customer has their own database instance."*

#### Guarantee 5: Audit Trail You Can Verify

> *"Every AI action is logged with: who triggered it, what it recommended, what evidence it used, and what the outcome was. In BYODB mode, these logs live in your database — you can query them directly."*

#### Guarantee 6: Encryption at Every Boundary

> *"All data in transit is encrypted via TLS 1.3. All data at rest is encrypted via AES-256. Integration tokens (Gmail, Slack OAuth) are encrypted with AES-256-GCM before storage, using keys that Area-One employees cannot access."*

---

### 10.9 Encryption Deep Dive

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENCRYPTION BOUNDARIES                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CUSTOMER BROWSER ───────── TLS 1.3 ────────── VERCEL   │   │
│  │  (HTTPS, HSTS, secure cookies)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  VERCEL EDGE ─────────── TLS 1.3 ───────── RAILWAY     │   │
│  │  (Internal VPC / private networking)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  RAILWAY ── TLS 1.3 ── CUSTOMER'S SUPABASE (BYODB)     │   │
│  │  (Supabase enforces TLS on all connections)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AT REST:                                               │   │
│  │  • Customer's Supabase: AES-256 (Supabase managed)      │   │
│  │  • Area-One Central DB: AES-256 (Railway TDE)           │   │
│  │  • Integration tokens: AES-256-GCM (app-layer encrypt)  │   │
│  │  • Backups: AES-256 encrypted snapshots                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  IN MEMORY (during processing):                         │   │
│  │  • Data held in RAM during AI processing                │   │
│  │  • Explicitly nullified after processing                │   │
│  │  • No swap/logging of raw data to disk                  │   │
│  │  • V8 GC + explicit purge pattern                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Token Vault (Integration Credentials)

```typescript
// lib/security/token-vault.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Integration tokens (Gmail, Slack, Outlook OAuth tokens) are encrypted
 * with AES-256-GCM BEFORE storage. The encryption key lives in Railway
 * secrets and is NEVER logged, displayed, or accessible via API.
 *
 * Even if Area-One's database is breached, tokens are ciphertext.
 */

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32-byte hex, Railway secret

export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY!, 'hex'), iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return { encrypted, iv: iv.toString('hex'), tag };
}

export function decryptToken(
  encrypted: string,
  iv: string,
  tag: string
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(KEY!, 'hex'),
    Buffer.from(iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * In BYODB mode, integration tokens are stored in:
 * - Customer's Supabase (for self-sovereignty)
 * - Encrypted with a key that only Area-One holds
 *
 * This means: even the customer can't see their own Gmail token raw.
 * If the customer revokes Area-One's access, they just change their
 * Gmail password or revoke the OAuth app — token becomes useless.
 */
```

#### Database Connection String Encryption

```typescript
// lib/security/connection-vault.ts

/**
 * In BYODB mode, we store the customer's Supabase connection string
 * encrypted in Area-One's central DB. This is the ONLY piece of
 * customer-specific configuration we hold.
 *
 * If this is breached:
 * - Attacker gets encrypted connection string (ciphertext)
 * - Even if decrypted, customer can revoke Supabase access token
 * - Customer rotates their Supabase JWT anytime
 */

export async function storeConnectionConfig(
  workspaceId: string,
  provider: 'supabase' | 'firebase' | 'postgres',
  connectionString: string,
  anonKey?: string
): Promise<void> {
  const encrypted = encryptToken(JSON.stringify({
    provider,
    connectionString,
    anonKey,
    createdAt: new Date().toISOString(),
  }));

  await db.insert(workspaceConnections).values({
    workspaceId,
    provider,
    encryptedConfig: encrypted.encrypted,
    iv: encrypted.iv,
    tag: encrypted.tag,
    status: 'active',
  });
}
```

---

### 10.10 AI Privacy Guarantees

#### LLM API Configuration

```typescript
// lib/ai/providers.ts

/**
 * Every LLM call includes these privacy guarantees.
 * We REJECT any provider that doesn't support them.
 */

// OpenAI
const openaiConfig = {
  model: 'gpt-4o',
  // CRITICAL: Never train on our data
  // (OpenAI API enterprise policy — API data is not used for training by default,
  //  but we explicitly set this for defense in depth)
};

// Anthropic
const anthropicConfig = {
  model: 'claude-sonnet-4-20250514',
  // Anthropic does not train on API data (documented policy)
};

// For any provider that doesn't guarantee zero-training: REJECT
const ALLOWED_PROVIDERS = ['openai', 'anthropic', 'google'];
const ZERO_TRAINING_PROVIDERS = new Set(ALLOWED_PROVIDERS);

export function validateProvider(provider: string): void {
  if (!ZERO_TRAINING_PROVIDERS.has(provider)) {
    throw new Error(
      `Provider '${provider}' does not guarantee zero-training on API data. ` +
      `Allowed providers: ${ALLOWED_PROVIDERS.join(', ')}`
    );
  }
}
```

#### Data Isolation Guarantee

```typescript
// lib/ai/context-builder.ts

/**
 * When building AI context, we NEVER mix data from different workspaces.
 * Each context is built from a SINGLE customer's data source.
 *
 * This is enforced at the TYPE LEVEL — the function signature
 * accepts a single DB client, not an array.
 */
export async function buildAIContext(
  customerDb: CustomerDatabase,  // Single customer's DB connection
  emailId: string
): Promise<AIContext> {
  // Fetch from ONE customer's database only
  const email = await customerDb.emails.findById(emailId);
  const memory = await customerDb.memory.getForCustomer(email.customerId);
  const recentContext = await customerDb.emails.getRecent(email.customerId, 20);

  return {
    currentEmail: sanitizeForLLM(email),
    customerMemory: memory.map(sanitizeForLLM),
    recentHistory: recentContext.map(sanitizeForLLM),
  };
  // CRITICAL: This function has NO access to other customers' data.
  // The customerDb parameter is bound to a single workspace.
}
```

---

### 10.11 How to Convince Customers: The Security Battlecard

This is what you send to prospects who ask about security:

#### One-Pager: Area-One Security & Data Sovereignty

```
╔═══════════════════════════════════════════════════════════════╗
║              AREA-ONE SECURITY GUARANTEES                      ║
║              How We Protect Your Revenue Data                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  🏠 YOUR DATA, YOUR DATABASE                                  ║
║  ─────────────────────────────────────────────────────────    ║
║  Unlike every other AI sales tool, Area-One does NOT store    ║
║  your emails on our servers. You connect your own FREE        ║
║  Supabase database (takes 60 seconds to set up). All your     ║
║  emails, contacts, and AI memory live in YOUR account.        ║
║                                                               ║
║  We are a processing layer. We don't hold your data.          ║
║                                                               ║
║  🔒 ENCRYPTION EVERYWHERE                                     ║
║  ─────────────────────────────────────────────────────────    ║
║  • TLS 1.3 for all data in transit                            ║
║  • AES-256 at rest (your Supabase + our infrastructure)       ║
║  • AES-256-GCM for all integration tokens                     ║
║                                                               ║
║  🤖 AI PRIVACY                                                ║
║  ─────────────────────────────────────────────────────────    ║
║  • Your data is NEVER used to train AI models                 ║
║  • All LLM calls are ephemeral — data processed, not stored   ║
║  • We only use providers that guarantee zero-training (OpenAI, ║
║    Anthropic, Google)                                         ║
║                                                               ║
║  🗝️  YOU HOLD THE KEYS                                        ║
║  ─────────────────────────────────────────────────────────    ║
║  • Revoke our database access anytime → instant kill switch   ║
║  • Export ALL your data as CSV/JSON directly from Supabase    ║
║  • Delete anything, anytime — no "deletion request" needed    ║
║                                                               ║
║  📋 COMPLIANCE                                                ║
║  ─────────────────────────────────────────────────────────    ║
║  • SOC 2 Type II (in progress)                                ║
║  • GDPR-ready architecture                                    ║
║  • Data Processing Agreement (DPA) available                   ║
║  • Full audit trail of every AI action                        ║
║                                                               ║
║  ❓ "What if Supabase goes down?"                              ║
║  ─────────────────────────────────────────────────────────    ║
║  Supabase runs on AWS, same infrastructure as Netflix.        ║
║  You can also bring your own PostgreSQL server if you         ║
║  prefer full infrastructure control.                          ║
║                                                               ║
║  ❓ "Can I use my own database?"                               ║
║  ─────────────────────────────────────────────────────────    ║
║  Yes. Any PostgreSQL-compatible database works: Supabase,     ║
║  Firebase (Firestore), Neon, AWS RDS, or self-hosted.         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

#### Enterprise Security Questionnaire (Pre-filled Answers)

| Question | Area-One Answer |
|----------|----------------|
| Where is customer data stored? | In customer's own Supabase/Firebase project (BYODB) or our SOC 2-compliant Railway PostgreSQL (managed mode) |
| Do you train AI on our data? | **No.** Contractually and technically enforced. All LLM calls use zero-training providers. |
| Who has access to our data? | In BYODB mode: YOU control access via Supabase. In managed mode: only authorized Area-One engineers with audit trail. |
| How do you handle data deletion? | BYODB: You own the database — delete directly. Managed: One-click deletion with 30-day soft-delete. |
| Is data encrypted at rest? | Yes. AES-256 via Supabase/Railway TDE + application-layer encryption for tokens. |
| Is data encrypted in transit? | Yes. TLS 1.3 for all communications. |
| Do you support SSO? | Yes, via Clerk (SAML/OIDC). |
| Do you have a DPA? | Yes, available on request. |
| Are you SOC 2 certified? | Type II in progress. Architecture is SOC 2-ready from day one. |
| What happens if you go out of business? | In BYODB mode: Your data is in YOUR Supabase account — nothing is lost. Our code is escrowed. |
| Can we audit your security? | Yes. We provide audit logs, penetration test reports, and architecture documentation. |
| Where are your servers? | Processing: US (Railway). Your data (BYODB): wherever your Supabase project is (you choose the region). |

---

### 10.12 Handling the Objections

#### "This sounds complicated. Why shouldn't I just use a normal SaaS?"

> **Answer:** "It's actually simpler: you click one button, a free Supabase account is created for you, and we connect to it. From that point, you use Area-One exactly like any other SaaS. The difference is that *behind the scenes*, your data is yours — not ours. You never have to worry about a breach on our side exposing your emails, because your emails aren't on our side."

#### "I don't want to manage a database."

> **Answer:** "You don't have to. Supabase manages it — automatic backups, scaling, and security patches. It's like having a Gmail account: you don't manage the servers, Google does. The difference is that unlike Gmail, *you* own the account and can take your data anywhere. If you prefer zero setup, we also offer a managed mode where we host your data in our SOC 2-compliant infrastructure."

#### "Won't this be slower than a normal app?"

> **Answer:** "The network hop to your Supabase database adds ~10-30ms of latency compared to a centralized database. This is imperceptible in normal usage. AI processing takes 2-5 seconds regardless — the database location doesn't affect it. Dashboard queries are pre-cached and feel instant."

#### "What if Supabase has a breach?"

> **Answer:** "Supabase runs on AWS with enterprise-grade security (SOC 2, ISO 27001, HIPAA). But more importantly: a Supabase breach is a *single-tenant breach* — only your project is exposed. Compare this to a centralized SaaS breach where ALL customers are exposed at once. BYODB turns a catastrophic risk (mass breach) into an isolated one."

#### "What about the AI models? Don't they see my data?"

> **Answer:** "Yes, the LLM sees your data during processing — that's how it generates recommendations. But: (1) the data is ephemeral (in-memory, not stored), (2) we only use providers that contractually guarantee they never train on API data, and (3) you can verify this because we publish our LLM gateway code. We're working toward local-model processing (running Llama/Mistral on your own infrastructure) as a future option for maximum privacy."

---

### 10.13 Physical Architecture: What Runs Where (BYODB Mode)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CUSTOMER'S INFRASTRUCTURE           AREA-ONE INFRASTRUCTURE    │
│   (Customer owns & controls)          (Area-One operates)        │
│                                                                 │
│  ┌──────────────────────────┐       ┌──────────────────────────┐│
│  │  Supabase Project        │       │  Vercel + Railway        ││
│  │  (Free Tier)             │       │                          ││
│  │                          │       │  ┌───────────────────┐   ││
│  │  ┌────────────────────┐  │       │  │ Next.js Frontend  │   ││
│  │  │ PostgreSQL         │  │◄──────┤  │ (React + UI)      │   ││
│  │  │ • Emails           │  │  API  │  └───────────────────┘   ││
│  │  │ • Contacts         │  │ calls │                          ││
│  │  │ • Timeline         │  │       │  ┌───────────────────┐   ││
│  │  │ • Memory           │  │       │  │ API Routes        │   ││
│  │  │ • Embeddings       │  │       │  │ • Auth (Clerk)    │   ││
│  │  │ • Recommendations  │  │       │  │ • Routing logic   │   ││
│  │  └────────────────────┘  │       │  │ • Webhook receiver│   ││
│  │                          │       │  └───────────────────┘   ││
│  │  ┌────────────────────┐  │       │                          ││
│  │  │ Supabase REST API  │  │       │  ┌───────────────────┐   ││
│  │  │ (Auto-generated)   │  │       │  │ AI Processing     │   ││
│  │  └────────────────────┘  │       │  │ (Stateless)       │   ││
│  │                          │       │  │ • LLM Gateway     │   ││
│  │  ┌────────────────────┐  │       │  │ • LangGraph       │   ││
│  │  │ Supabase Studio    │  │       │  │ • Ephemeral ctx   │   ││
│  │  │ (Customer's admin) │  │       │  └───────────────────┘   ││
│  │  └────────────────────┘  │       │                          ││
│  │                          │       │  ┌───────────────────┐   ││
│  │  Customer accesses       │       │  │ Central DB (thin) │   ││
│  │  their data directly     │       │  │ • User→DB mapping │   ││
│  │  via supabase.com        │       │  │ • Encrypted tokens│   ││
│  │                          │       │  │ • Billing (Stripe)│   ││
│  └──────────────────────────┘       │  │ • Anon analytics  │   ││
│                                      │  └───────────────────┘   ││
│  ┌──────────────────────────┐       │                          ││
│  │  Google APIs             │       │  ┌───────────────────┐   ││
│  │  • Gmail (OAuth)         │       │  │ Inngest Queue     │   ││
│  │  • Calendar (OAuth)      │       │  │ • Background jobs │   ││
│  │  • OAuth token stored    │       │  │ • Retries         │   ││
│  │    encrypted in          │       │  └───────────────────┘   ││
│  │    customer's Supabase   │       │                          ││
│  └──────────────────────────┘       └──────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 10.14 Compliance Roadmap

| Certification | Timeline | Scope | Strategy |
|--------------|----------|-------|----------|
| **GDPR-ready** | Day 1 | Architecture | BYODB makes this trivial — we don't hold PII. Managed mode: standard DPA, data export, right to deletion. |
| **SOC 2 Type I** | Month 6 | Area-One Central only | Describe our thin central layer controls. Customer data is NOT in scope (lives in their DB). This dramatically reduces audit scope. |
| **SOC 2 Type II** | Month 12 | Area-One Central only | Ongoing monitoring of controls. Again, reduced scope because we don't hold customer data. |
| **ISO 27001** | Month 18 | Full ISMS | BYODB architecture makes evidence collection easier — fewer systems in scope. |
| **HIPAA** | On demand | If healthcare vertical | Only if healthcare becomes a target. BYODB with BAA from Supabase makes this viable. |

**Why BYODB makes compliance 10x easier:**

A traditional SaaS with customer data needs:
- Evidence that no engineer read customer emails
- Evidence that backups are encrypted
- Evidence that deletion actually deletes
- Evidence that data is isolated between tenants
- Penetration tests covering the database layer
- Database access audit trails

With BYODB, you simply say: **"We don't hold the data. Here's the architecture proof."** The auditor's scope shrinks to your thin central layer.

---

### 10.15 Rate Limiting & Abuse Prevention

```typescript
// lib/security/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const apiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1m'), // 100 requests per minute
  analytics: true,
});

export const aiRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1m'),  // 20 AI calls per minute per user
  analytics: true,
});
```

---

### 10.16 Managed Mode (Fallback for Customers Who Don't Want BYODB)

For customers who don't want to manage even a free Supabase account:

```
┌─────────────────────────────────────────────────────────────┐
│                      MANAGED MODE                            │
│                                                             │
│  • Area-One hosts data in SOC 2-compliant Railway PostgreSQL│
│  • Data encrypted at rest (AES-256 TDE)                     │
│  • Workspace-level isolation (row-level partitioning)       │
│  • Nightly encrypted backups (30-day retention)             │
│  • One-click data export (CSV, JSON)                        │
│  • One-click account deletion (hard delete after 30 days)   │
│  • DPA available for enterprise customers                   │
│                                                             │
│  This is the "normal SaaS" mode for customers who prefer    │
│  it. But we always recommend BYODB as the default.          │
└─────────────────────────────────────────────────────────────┘
```

---

### 10.17 Migration Between Modes

```
┌──────────────────────────────────────────────────────────────┐
│                 MIGRATION PATHS                               │
│                                                              │
│  BYODB ───────────────────────────────► Managed              │
│  (Export Supabase → Import into Area-One managed DB)         │
│  (One-click migration tool provided)                         │
│                                                              │
│  Managed ────────────────────────────► BYODB                 │
│  (Export managed DB → Import into customer's Supabase)       │
│  (One-click migration tool provided)                         │
│                                                              │
│  Supabase ───────────────────────────► Firebase              │
│  (Schema mapping + data migration tool)                      │
│                                                              │
│  Any PostgreSQL ─────────────────────► Any PostgreSQL        │
│  (Standard pg_dump + pg_restore — we provide the script)     │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. Monitoring & Observability

### 11.1 Observability Stack

| Signal | Tool | What We Track |
|--------|------|--------------|
| **Errors** | Sentry | All unhandled exceptions, API errors, agent failures |
| **Logs** | BetterStack / Railway Logs | Structured JSON logs with trace IDs |
| **Uptime** | BetterStack | Health check every 30s from multiple regions |
| **Performance** | Vercel Analytics + Sentry Performance | Core Web Vitals, API latency p50/p95/p99 |
| **Business Metrics** | PostHog | DAU/WAU, feature adoption, recommendation acceptance rate |
| **AI Metrics** | Custom dashboard + LangSmith | LLM latency, cost per call, model mix, token usage |
| **Infrastructure** | Railway Metrics | CPU, memory, DB connections, Redis hit rate |

### 11.2 Structured Logging

```typescript
// lib/observability/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  mixin() {
    return { service: 'area-one', env: process.env.VERCEL_ENV };
  },
});
```

### 11.3 Key Alerts

| Alert | Condition | Severity | Channel |
|-------|-----------|----------|---------|
| API error rate > 1% | Last 5 minutes | Critical | PagerDuty / On-call |
| LLM latency > 10s | p95 over 5 min | Warning | Slack |
| Integration token expired | Any occurrence | Warning | Slack + Email |
| Database connection pool > 80% | 5 minutes | Warning | Slack |
| Failed background job | Inngest dead letter | Warning | Slack |
| User signup spike | > 50 in 1 hour | Info | Slack |

---

## 12. Cost Estimation

### 12.1 Infrastructure (100 Active Users)

| Service | Provider | Monthly Cost |
|---------|----------|-------------|
| Next.js Hosting | Vercel Pro | $20 |
| Backend + DB + Redis | Railway Pro | $40–80 |
| Object Storage (R2) | Cloudflare | $0–5 |
| Auth (Clerk) | Clerk Pro | $25 |
| Background Jobs | Inngest | $0 (generous free tier) |
| Error Tracking | Sentry | $0 (free tier) |
| Logs | BetterStack | $0–15 |
| Email Sending | Resend | $0–20 |
| **Infrastructure Total** | | **~$85–165/month** |

### 12.2 AI Costs (100 Active Users, 10 AI interactions/user/day)

| Task | Model | Calls/Day | Cost/Call | Daily Cost |
|------|-------|-----------|-----------|------------|
| Email classification | GPT-4o-mini | 500 | $0.0003 | $0.15 |
| Entity extraction | GPT-4o-mini | 500 | $0.0005 | $0.25 |
| Summarization | GPT-4o-mini | 300 | $0.0005 | $0.15 |
| Embeddings (search) | text-embedding-3-small | 500 | $0.00002 | $0.01 |
| Drafting (emails) | Claude Sonnet | 100 | $0.003 | $0.30 |
| Recommendations | GPT-4o | 50 | $0.005 | $0.25 |
| **AI Total** | | | | **~$33–50/day** |

**AI Monthly: ~$990–1,500/month**

This is the dominant cost — the model router (section 7.1) is essential to keep this under control.

### 12.3 Total Monthly Run Rate (100 Users)

| Category | Monthly |
|----------|---------|
| Infrastructure | $85–165 |
| AI Inference | $990–1,500 |
| Third-party SaaS | $100–200 |
| **Total** | **~$1,200–1,900/month** |

At $49–99/user/month, 100 users = $4,900–9,900 MRR → **strong gross margins (~75–85%)**.

---

## 13. Development Phases & Milestones

### Phase 1: Foundation (Months 1–2)

**Goal:** Auth, workspace, Gmail integration, basic dashboard.

| Milestone | Deliverables |
|-----------|-------------|
| Project scaffold | Next.js, Drizzle, Tailwind, shadcn/ui, Clerk |
| Auth system | Sign up, login, MFA, workspace creation, invite flow |
| Gmail integration | OAuth, email ingestion, webhook setup |
| Email processing | Store raw emails, basic timeline view |
| Dashboard | Deals needing attention, email list |

### Phase 2: AI Memory (Months 2–3)

**Goal:** AI understands customers.

| Milestone | Deliverables |
|-----------|-------------|
| Entity extraction | Extract companies, contacts, dates, amounts from emails |
| Customer memory | Store and display AI-curated facts per customer |
| Timeline v2 | Chronological view with AI-generated event titles |
| Semantic search | pgvector setup, search across all interactions |

### Phase 3: Recommendations (Months 3–4)

**Goal:** AI suggests what to do next. **This is the MVP launch point.**

| Milestone | Deliverables |
|-----------|-------------|
| Coordinator agent | LangGraph workflow, model router |
| Next-best-action engine | Analyze customer state → recommend action |
| Recommendation UI | Priority queue, approve/reject with reasoning |
| Drafting agent | Generate email drafts with customer context |
| Slack + Calendar | Integration and basic sync |

### Phase 4: Execution (Months 4–6)

**Goal:** AI takes action (with approval).

| Milestone | Deliverables |
|-----------|-------------|
| Send approved emails | Gmail/Outlook send via API |
| Meeting scheduling | Calendar availability + booking |
| CRM sync | HubSpot/Salesforce two-way sync |
| Proposal generation | Template-based proposals with AI customization |
| Reporting | Weekly summary emails, deal pipeline view |

### Phase 5: Autonomy & Scale (Months 6+)

**Goal:** Trusted autonomous agent + multi-agent system.

| Milestone | Deliverables |
|-----------|-------------|
| Autonomous actions | Configurable auto-execute rules |
| Multi-agent system | Specialist agents (Proposal, Contract, Invoice, Payment) |
| AgentPay | Stripe integration for invoicing and payments |
| Plugin system | Extensible integration architecture |
| Enterprise features | SOC 2, advanced RBAC, SSO, audit exports |

---

## 14. Risk Mitigation

### 14.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gmail API changes break integration | Medium | High | Abstract all integrations behind adapters; monitor API changelogs; have fallback (IMAP) |
| LLM cost spikes | Medium | High | Model router with cost caps; cache common LLM calls; use smaller models aggressively |
| AI hallucinates customer facts | High | Medium | Always show evidence; user can correct facts; confidence threshold; human-in-the-loop |
| User trust in autonomous actions | High | High | Start conservative (all actions need approval); transparent reasoning; gradual autonomy based on user behavior |
| Competitor (HubSpot AI, Salesforce Einstein) | Medium | Medium | Focus on cross-platform (works with any email/CRM); superior UX; faster iteration |
| Scaling bottlenecks in monolith | Low (early) | Medium | Module boundaries already drawn; extract to microservices when metrics show need |
| Token/credential theft | Low | Critical | Encrypted token vault; short-lived tokens with refresh; audit log for all credential access |

### 14.2 BYODB-Specific Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Customer accidentally deletes their Supabase project | Low | Critical | Daily automated backups in customer's Supabase (enabled by default); export reminder emails; "Are you sure?" guard in Supabase |
| Supabase free tier limits exceeded | Medium | Medium | Monitor usage; alert customer before limits hit; offer one-click upgrade to Supabase Pro ($25/month); offer managed mode migration |
| Customer revokes DB access token | Medium | High | Graceful degradation — dashboard shows "Reconnect your database" with one-click re-auth; data is safe in their account |
| Network latency impacts dashboard performance | Low | Low | Edge caching (Vercel) for dashboard queries; optimistic UI updates; WebSocket for real-time events |
| Customer doesn't want to manage a DB (adoption friction) | Medium | Medium | Offer managed mode as fallback; 60-second Supabase auto-setup; "It's like creating a Gmail account" messaging |
| Supabase/Firebase has an outage | Low | Medium | Both run on AWS/GCP with 99.9%+ uptime; show status banner in dashboard; queue writes during outage via Inngest retry |
| Customer uses unsupported database | Low | Low | Support matrix: Supabase (primary), Firebase (secondary), any PostgreSQL (bring your own); clear documentation |
| Schema migration across customer DBs | Medium | Medium | Version-tracked migrations; auto-migrate on connection; backward-compatible schema changes only; migration status dashboard |
| Customer data in BYODB, but embeddings needed for AI | Low | Medium | Embeddings are computed from customer data and stored in customer's own pgvector; no cross-customer embedding sharing |

### 14.3 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data breach of email content | **Low** (BYODB: near zero) | High | BYODB: data not on our servers. Managed: encryption at rest + transit; SOC 2; minimal retention; never train on customer data |
| Enterprise buyers demand centralized hosting | Medium | Medium | Offer managed mode as option; SOC 2 certification; DPA; custom deployment options |
| BYODB perceived as "too technical" by non-technical users | Medium | High | Frictionless setup ("one click, done"); managed mode default for non-technical users; don't lead with architecture in marketing |
| Customer fears LLM providers see their data | Medium | Medium | Education: LLM sees data ephemerally (in RAM), never persists; zero-training guarantees; roadmap: local model option |

---

> **Next Steps:**
> 1. Set up the Next.js + Drizzle + Clerk scaffold
> 2. Implement Gmail OAuth and webhook ingestion
> 3. Build the customer timeline as the first visible feature
> 4. Add AI memory extraction once data flows
>
> This document should be treated as a **living artifact** — update it as decisions change, constraints shift, and the product evolves.

