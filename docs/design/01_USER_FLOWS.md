# Chapter 4: User Flows Specification — ORBIT

| Metadata | Details |
| :--- | :--- |
| **Project** | **Orbit** – Intelligent Task Orchestrator for ADHD Minds |
| **Document Stage** | 4.1 Luồng Người dùng (User Flow) |
| **Target Audience** | UI/UX Designers & Frontend Mobile Engineers |
| **Author** | Orbit Engineering & Product Team |

---

## 1. Overview & Cognitive Flow Principles

Individuals with **ADHD** experience cognitive friction when user flows contain excessive steps, mandatory secondary inputs, or irreversible AI decisions. Orbit enforces three foundational flow principles:

1. **Sub-5-Second Capture:** Zero barrier between thought conception and system persistence.
2. **Human-in-the-Loop AI Collaboration:** AI acts as a cognitive scaffold, never an autonomous decision-maker. Users inspect, adjust, and approve AI breakdown steps before committing.
3. **Single-Task Focus & Frictionless Recovery:** Flow paths prioritize linear focus and provide immediate visual clarity.

---

## 2. Core User Flows (Part 1)

### 2.1. User Flow 1: Instant Task Capture (Ghi Nhận Việc Tức Thời)

This flow enables an ADHD user experiencing working memory decay to register a task immediately without confronting overwhelming forms.

```mermaid
flowchart TD
    Start([User opens Orbit App]) --> View[User views active Kanban Board]
    View --> TapInput[User taps bottom Quick Capture Bar]
    TapInput --> QuickType[User types Task Title]
    QuickType --> EnergyCheck{Optional: Set Energy Tag?}
    EnergyCheck -- Yes --> SelectEnergy[Tap ☕ Low / ⚡ Med / 🔥 High]
    EnergyCheck -- No (Default) --> DefaultEnergy[Defaults to ⚡ Med]
    SelectEnergy --> PressEnter[User taps '+ Add' or presses Enter]
    DefaultEnergy --> PressEnter
    
    PressEnter --> ClientOptimistic[Optimistic UI: Card prepended to 'Backlog']
    ClientOptimistic --> Haptic[Gentle Haptic Confirmation < 100ms]
    Haptic --> ClearBar[Input Bar resets for next thought]
    ClearBar --> End([Task Secured in Backlog])
```

#### Flow Attributes & Edge Cases:
* **Time to Complete:** $\le 5$ seconds.
* **Mandatory Fields:** `Title` only. Descriptions, deadlines, and tags are strictly optional.
* **Offline Handling:** If disconnected, the ticket is cached locally in SQLite/AsyncStorage with zero error modals.

---

### 2.2. User Flow 2: Human-in-the-Loop AI Task Breakdown (Chia Nhỏ Task Bằng AI)

When a task is large, ambiguous, or triggering *ADHD Task Paralysis*, the user activates the AI breakdown engine.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ADHD User
    participant Card as 🃏 TaskCard (Kanban)
    participant Modal as 🪟 AIDecomposeModal
    participant Backend as ☕ Spring Boot API
    participant AI as 🧠 Gemini 1.5 Flash

    User->>Card: Taps '✨ AI Breakdown'
    Card->>Modal: Open Bottom Sheet with Loading State
    Modal-->>User: 'Breaking down this challenge into micro-steps...'
    Modal->>Backend: POST /api/v1/tasks/{id}/ai-decompose
    Backend->>AI: Send prompt with JSON schema constraints (<20m per step)
    AI-->>Backend: Return JSON subtask proposals
    Backend-->>Modal: 200 OK (3-4 micro-steps)
    Modal-->>User: Render interactive checklist preview

    alt User accepts & edits
        User->>Modal: Deselects unneeded step OR edits wording
        User->>Modal: Taps 'Confirm & Apply'
        Modal->>Backend: POST /api/v1/tasks/{id}/subtasks/bulk
        Backend-->>Modal: 201 Created
        Modal->>Card: Update interactive checklist on card
        Modal-->>User: Toast: 'Micro-steps added! You got this.'
    else User cancels or dismisses
        User->>Modal: Taps 'Cancel' or swipes down
        Modal-->>User: Closes sheet immediately (Zero data changed)
    end
```

#### Cognitive Guarantees:
* **Micro-Step Limit:** Every generated step is strictly capped at $\le 20$ minutes.
* **Non-Destructive:** The parent task is never modified until the user taps **Confirm & Apply**.

---

## 3. Supplementary User Flows (Part 2 — Teammate Extension)

> [!NOTE]
> The following user flows are allocated to **Teammate (Part 2)** and will be expanded in the next implementation milestone:
> - **User Flow 3: Single-Task Focus Mode & Pomodoro Integration** (Doing Lane $\to$ Focus View $\to$ Timer Start $\to$ Step Checkoff $\to$ Completion).
> - **User Flow 4: Cognitive Energy-Based Task Filtering** (Energy Selector $\to$ Re-rank Todo Queue $\to$ Dim high-energy tasks during fatigue).
