# 🗺️ CODEBASE SUMMARY & SYSTEM ARCHITECTURE — ORBIT
## High-Level System Map & Architectural Identity

| Metadata | Details |
| :--- | :--- |
| **Product** | **Orbit** — Intelligent Task Orchestrator for ADHD Minds |
| **Backend Package** | `com.orbit` (Java 17/21, Spring Boot 3.3.x) |
| **Mobile Package** | `orbit-mobile` (React Native 0.74, Expo SDK 51, TypeScript 5.3) |
| **Database** | PostgreSQL 15 (ACID RDBMS) + Local AsyncStorage / SQLite Cache |
| **AI Engine** | Google Gemini 1.5 Flash via Spring AI (JSON Mode) |

---

## 1. REPOSITORY STRUCTURE & MODULE INVENTORY

```text
orbit_project/
├── AGENTS.md                                # Root Master Blueprint for AI Coding Agents
├── README.md                                # Project landing page, documentation index & build guide
├── .agents/                                 # Workspace Customization Root (Antigravity & Gemini IDE)
│   ├── rules/
│   │   ├── backend_clean_architecture.md    # Spring Boot 3 & Clean Architecture rules
│   │   └── adhd_cognitive_ux_rules.md       # ADHD ergonomics, WCAG 2.1 AA & Calm Dark rules
│   └── skills/
│       ├── ai-task-decomposer/              # Gemini 1.5 Flash structured task breakdown skill
│       ├── adhd-ui-evaluator/               # Automated WCAG 2.1 AA & haptics audit skill
│       └── orbit-feature-builder/           # End-to-end fullstack feature generation skill
├── docs/                                    # System Documentation & Specifications
│   ├── code-standards.md                    # Feature layout, clean architecture & coding standards
│   ├── codebase-summary.md                  # This file: system identity, state owners & endpoints
│   ├── prd/                                 # Product Requirements Document & Gherkin user stories
│   ├── architecture/                        # System architecture, database ERD & REST contracts
│   └── design/                              # Wireframes, Design Tokens, User Flows & AI review
├── backend/                                 # Backend Microservice (Spring Boot 3.x)
│   ├── src/main/java/com/orbit/             # Controller, Service, Repository, Entity, DTO
│   └── src/main/resources/application.yml   # Spring Datasource, JWT & Gemini AI configurations
└── mobile/                                  # Cross-platform Mobile Client (Expo React Native)
    ├── src/components/                      # Reusable UI widgets (TaskCard, QuickCapture, etc.)
    ├── src/screens/                         # Screen containers (BoardScreen, FocusScreen)
    ├── src/services/                        # Axios API integration
    └── src/types/                           # TypeScript domain models
```

---

## 2. REACTIVE STATE OWNERS & DATA BOUNDARIES

| State Owner | Managed Domain | Persistence Layer | Invariant Enforced |
| :--- | :--- | :--- | :--- |
| **`useTaskStore` (Zustand)** | Active Kanban columns (`BACKLOG`, `TODO`, `DOING`, `DONE`) | In-memory + AsyncStorage | **Doing WIP $\le 1$**; optimistic prepend for instant capture <5s. |
| **`TanStack Query`** | Remote task synchronizer & background cache | In-memory query cache | Automatic cache invalidation & offline request queueing. |
| **`FocusTimer`** | Active Pomodoro countdown (25:00) & elapsed seconds | Local component state | Distraction-free single task isolation; tick haptic pulse. |
| **`TaskService` (Spring Boot)** | Task entity persistence, state transitions, subtasks | PostgreSQL 15 | `@Transactional` consistency; validates UUID & ownership. |
| **`AIService` (Spring AI)** | Gemini 1.5 Flash subtask decomposition & fallback | Ephemeral AI response | Subtask $\le 20\text{m}$, step 1 $< 5\text{m}$, 3000ms timeout fallback. |

---

## 3. CORE API ENDPOINT REGISTRY

| Method | Endpoint Path | Description | Access / Security |
| :---: | :--- | :--- | :---: |
| `GET` | `/api/v1/health` | Healthcheck & system status probe | Public |
| `POST` | `/api/v1/auth/login` | User authentication & JWT issuance | Public |
| `GET` | `/api/v1/boards/{id}/tasks` | Retrieve tasks for Kanban board columns | Authenticated (JWT) |
| `POST` | `/api/v1/tasks` | Create new task (Instant Capture <5s) | Authenticated (JWT) |
| `PATCH` | `/api/v1/tasks/{id}/status` | Transition task column (`BACKLOG` $\to$ `TODO` $\to$ `DOING` $\to$ `DONE`) | Authenticated (WIP $\le 1$) |
| `POST` | `/api/v1/tasks/{id}/ai-decompose` | Request Gemini 1.5 Flash task breakdown | Authenticated (Timeout 3s) |
| `POST` | `/api/v1/tasks/{id}/subtasks/bulk` | Commit approved micro-steps to task | Authenticated (Bulk ACID) |

---

## 4. ADHD ERGONOMIC INVARIANTS MATRIX

| Vulnerability Targeted | Orbit Architectural Solution | Technical Enforcement |
| :--- | :--- | :--- |
| **Analysis Paralysis** | Dynamic Cognitive Energy Filtering (☕/⚡/🔥) | Low-energy tasks promoted to top; high-effort tasks dimmed to 35% opacity. |
| **Chronic Multitasking** | Single-Task WIP Limit = 1 | Client-side rollback physics + backend `409 Conflict` (`WipLimitExceededException`). |
| **Rejection Sensitive Dysphoria (RSD)** | Prohibition of Neon Red `#FF0000` & Guilt Language | UI tokens enforce Soft Coral `#F87171` & Sand Amber `#FBBF24`; non-punitive copy. |
| **Time Blindness & Drift** | Distraction-Free Focus Mode (25:00 Pomodoro) | Viewport strips 100% of non-essential UI chrome; locks attention to single active task. |
| **Motivation Collapse** | Gentle Streak Protection (`🛡️ 2 Freeze`) | Automatically consumes freeze credits when days are missed; preserves momentum. |
