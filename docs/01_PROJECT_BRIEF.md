# Orbit — Project Brief

| Metadata | Details |
| :--- | :--- |
| **Project Name** | **Orbit** — Intelligent Task Orchestrator for ADHD Minds |
| **Artifact Status** | Accepted |
| **Target Platform** | Mobile (iOS & Android via React Native / Expo) + Backend API (Spring Boot 3) |
| **Version** | 1.0.0 (Product Definition Phase) |

---

## 1. Problem Hypothesis

Individuals diagnosed with **ADHD (Attention Deficit Hyperactivity Disorder)** experience severe cognitive frictions in daily personal and professional task execution, stemming from core neurological differences:
- **Executive Dysfunction:** Difficulty initiating tasks, particularly when tasks appear ambiguous, overwhelming, or excessively large.
- **Time Blindness:** Impaired perception of future time horizons; tasks are cognitively categorized as either *"Now"* or *"Not Now"*, leading to missed deadlines and last-minute panic.
- **Analysis Paralysis:** Sensory and cognitive overload when confronted with extensive, unstructured to-do lists lacking clear contextual prioritization.
- **Dopamine Deficit:** Fast depletion of motivation and high abandonment rates when tools do not provide immediate positive feedback or a clear sense of progression.

Conventional project management tools (e.g., Jira, Trello, Notion, Todoist) are designed for *neurotypical* workflows, emphasizing multi-step manual data entry, complex custom tags, and team sprint metrics. These requirements generate significant **cognitive friction** for ADHD users.

**Orbit** is specifically engineered to mitigate cognitive load by:
- Enabling rapid **Instant Capture** (< 5 seconds).
- Dynamically ordering actionable tasks based on user cognitive energy rather than arbitrary deadlines alone.
- Leveraging AI to decompose intimidating tasks into actionable micro-steps (< 20 minutes each).
- Maintaining focus through a streamlined, fixed 4-lane Kanban workflow that strictly enforces work-in-progress (WIP) limits.

---

## 2. Primary User

Individuals diagnosed with ADHD (Inattentive, Hyperactive-Impulsive, or Combined presentation) who need an intuitive, low-friction tool to manage personal, academic, and professional daily workflows.

---

## 3. Desired Outcomes

Orbit enables users to:
1. **Prevent Task Omission:** Capture emerging tasks instantly before thoughts dissipate.
2. **Clarify the Next Action:** Instantly identify the single most appropriate task to tackle based on current cognitive energy.
3. **Overcome Activation Barriers:** Easily begin tasks via bite-sized micro-steps (< 15–20 minutes).
4. **Alleviate Guilt and Overload:** Maintain visual calm through a single-task focus mode with zero negative or punitive notifications.
5. **Sustain Momentum:** Receive immediate, dopamine-friendly reinforcement through gentle, non-punitive gamification.

---

## 4. Core Product Value

### 4.1. AI Task Decomposition
When a user inputs a large or ambiguous task (e.g., *"Prepare final presentation for Software Architecture"* or *"Clean bedroom"*):
- The AI engine analyzes the title and context to generate 3–5 concrete, actionable micro-steps with estimated completion times.
- A preview bottom sheet enables the user to inspect, edit, or deselect individual suggestions.
- **Subtasks are persisted only upon explicit human confirmation (Human-in-the-loop principle).**

### 4.2. AI Smart Prioritization
Orbit utilizes an adaptive multi-factor prioritization engine considering:
- Urgency (proximity to deadline).
- Importance (impact score).
- Complexity (cognitive effort required).
- **User's Current Cognitive Energy Level (Low: ☕, Medium: ⚡, High: 🔥).**

---

## 5. In-Scope Behavior (MVP)

### 5.1. Authentication & Profile
- Email and Password registration/login.
- One-tap Google OAuth2 login.
- Basic energy profile preferences.

### 5.2. Board Management
- Create, rename, archive, or delete personal boards (e.g., *Academic*, *Career*, *Personal*).
- Default limit of 3–5 active boards to prevent configuration paralysis.

### 5.3. Streamlined Kanban Workflow
- Fixed 4-status progression: **Backlog → Todo → Doing → Done**.
- Strict WIP (Work-In-Progress) limit on the **Doing** column (default: max 1 task).
- **Focus Mode:** Isolates the active in-progress task with a distraction-free Pomodoro timer.

### 5.4. Ticket Management
- Instant capture input bar for quick task creation with just a title.
- Optional deadline, energy estimate, and description.
- Interactive subtask checklist.

### 5.5. AI Assistance
- One-tap AI task breakdown.
- Energy-based task reordering in the Todo column.

### 5.6. Calendar & Gentle Gamification
- Two-way deadline sync with Google Calendar.
- Experience points (XP), encouraging badges, and streak tracking equipped with a *Streak Freeze* mechanism to prevent discouragement after missed days.

---

## 6. Explicit Exclusions (Out of Scope for MVP)

- **Team Collaboration & Chat:** No in-app direct messaging, task assignments, or team comment threads.
- **Enterprise Features:** No complex role-based access control (RBAC), multi-tenant organizational hierarchies, or timesheets.
- **Heavy Reporting & Analytics:** No burndown charts, velocity tracking, or complex KPI dashboards.

---

## 7. Product & Design Constraints

- **Cognitive Ergonomics:** High visual contrast (WCAG 2.1 AA compliant), clutter-free typography, no intrusive banner ads, and no high-stress red alert badges for overdue tasks.
- **Workflow Constraints:** Immutable 4-lane Kanban structure to eliminate setup procrastination.

---

## 8. AI Working Rules

1. **Human-in-the-Loop:** AI functions strictly in an advisory capacity; the system never mutates, moves, or creates tasks without explicit user approval.
2. **Transparency & Editability:** Every AI-generated decomposition must allow granular user edits prior to database persistence.
3. **Zero-Friction Dismissal:** Users can dismiss AI suggestions with a single tap without confirmation dialogs.

---

## 9. Decision Log

| ID | Decision | Rationale |
| :--- | :--- | :--- |
| **D1** | Product Name: Orbit | Symbolizes a steady, reassuring gravitational path keeping ADHD minds centered |
| **D2** | Target Users: ADHD individuals | Solves specific executive dysfunction bottlenecks instead of generic project management |
| **D3** | Tech Stack: React Native (Mobile) + Spring Boot 3 | Enables mobile instant capture on the go, backed by an enterprise-grade, secure API service |
| **D4** | Fixed 4-Lane Kanban | Eliminates tool customization procrastination |
| **D5** | Human-in-the-Loop AI | Ensures user autonomy and prevents feelings of computational micromanagement |
| **D6** | Gentle Gamification | Protects against Rejection Sensitive Dysphoria (RSD); rewards effort without punishing downtime |
| **D7** | AI Task Decomposition | Converts intimidating tasks into actionable micro-steps (< 20 mins) |
| **D8** | User Approval for Subtasks | Subtasks are created only after explicit preview acceptance |
| **D9** | Email/Password Auth | Standard authentication baseline |
| **D10** | Google OAuth2 Login | Reduces authentication friction to a single tap |
| **D11** | Google Calendar Sync | Mitigates time blindness through device-level calendar alerts |
| **D12** | Streak Freeze Feature | Prevents total motivation collapse if a user breaks a streak by one day |
| **D13** | Core Differentiation | Synergy between AI Decomposition + Energy-based Prioritization |

---

## 10. Open Assumptions

1. **Board Sharing:** Individual private boards are prioritized for MVP; multi-user board collaboration deferred to post-MVP.
2. **Energy Level Detection:** Manual 3-tier selection (☕ Low / ⚡ Medium / 🔥 High) evaluated for MVP; circadian rhythm inference deferred.
3. **Gamification Balance:** XP reward rates and streak freeze credit allocations calibrated through user testing.
4. **Calendar Sync Depth:** One-way deadline export prioritized initially; full bi-directional syncing scheduled for phase 2.
5. **AI Quality Metrics:** Acceptance rate of generated subtasks monitored as the primary metric of prompt efficacy.
