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

## 3. Supplementary User Flows (Part 2 — Focus Mode & Energy Filtering)

### 3.1. User Flow 3: Focus Mode Activation & Single-Task Pomodoro (Kích Hoạt Chế Độ Tập Trung)

When working on a critical task, individuals with ADHD frequently fall victim to visual distraction and peripheral task anxiety. Focus Mode strips away all surrounding Kanban columns and UI noise, locking the cognitive spotlight onto the single task currently in the `DOING` column with an integrated 25-minute Pomodoro timer and interactive micro-step checklist.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ADHD User
    participant Board as 📋 Kanban (DOING Lane)
    participant App as 📱 App Navigation
    participant Focus as 🎯 FocusScreen
    participant Timer as ⏱️ FocusTimer (25m)
    participant State as 💾 Local State

    User->>Board: Taps '🎯 Tập trung ngay' on active Doing task
    Board->>App: Trigger transition to Focus Mode
    App->>Focus: Mount FocusScreen (hide Kanban & QuickCapture)
    Focus-->>User: Display single task title + micro-steps checklist
    Focus->>Timer: Initialize Pomodoro countdown (25:00)
    
    User->>Timer: Taps '▶ Bắt đầu' (Start)
    Timer-->>User: Gentle countdown ticking (calm progress indicator)
    
    User->>Focus: Taps to complete micro-step 1
    Focus->>State: Mark subtask done (haptic cue, strikethrough)
    State-->>Focus: Micro-progress bar updates (e.g. 50%)
    
    alt Timer expires or task complete
        Timer-->>User: Calm chime + 'Pomodoro session completed! 🎉'
        User->>Focus: Taps 'Hoàn thành công việc' (Mark Done)
        Focus->>State: Transition task status to DONE
        State->>App: Return to Kanban Board
        App-->>User: Display updated Kanban with celebrate toast
    else User exits early
        User->>Focus: Taps 'Thoát chế độ tập trung' (Exit)
        Focus->>App: Preserve elapsed time & return to Kanban Board
        App-->>User: Re-render Kanban with task still in DOING
    end
```

#### Flow Attributes & Cognitive Guarantees:
* **Zero Cognitive Bleed:** All other columns (`BACKLOG`, `TODO`, `DONE`) and the Quick Capture bar are completely hidden from viewport.
* **Micro-Step Scaffolding:** Instead of confronting an intimidating macro-task, the user only interacts with bite-sized checkboxes ($\le 20$ min each).
* **Calm Timer Visuals:** Time display uses soothing cyan/emerald palettes rather than alarming bright red counters to prevent adrenaline-spike anxiety.

---

### 3.2. User Flow 4: Energy-Based Filtering & Dynamic Reranking (Lọc Năng Lượng Nhận Thức)

ADHD productivity heavily depends on fluctuating neurochemical energy (dopamine/norepinephrine levels). When users experience low cognitive energy (burnout, fatigue, brain fog), Orbit dynamically rearranges the task queue to surface gentle, low-friction tasks while dimming demanding tasks.

```mermaid
flowchart TD
    Start([User opens Orbit Kanban]) --> CheckEnergy[User assesses mental state: Tired / Brain Fog]
    CheckEnergy --> TapFilter[User taps '☕ Thấp' in EnergyFilterWidget]
    
    TapFilter --> EvalTasks[Orbit Engine evaluates tasks in current column]
    EvalTasks --> Partition{Evaluate Task Energy Required}
    
    Partition -- Energy == LOW --> PromoteTop[Promote to Top of List<br/>100% Opacity + Full Accent]
    Partition -- Energy == MEDIUM --> DemoteMid[Position in Middle<br/>60% Opacity]
    Partition -- Energy == HIGH --> DimBottom[Demote to Bottom<br/>35% Opacity + Dimmed Visuals]
    
    PromoteTop --> RenderList[Render Sorted & Filtered Board]
    DemoteMid --> RenderList
    DimBottom --> RenderList
    
    RenderList --> UserSelect[User picks a low-friction ☕ task effortlessly]
    UserSelect --> StartWork([Start Doing without Analysis Paralysis])
    
    style PromoteTop fill:#064E3B,stroke:#059669,stroke-width:2px,color:#ECFDF5
    style DimBottom fill:#1E293B,stroke:#475569,stroke-width:1px,stroke-dasharray: 5 5,color:#64748B
    style TapFilter fill:#1E3A8A,stroke:#3B82F6,stroke-width:2px,color:#DBEAFE
```

#### Cognitive Guarantees:
* **Eliminates Analysis Paralysis:** Eliminates the guilt of seeing high-effort tasks when mentally drained by visually demoting and fading them out.
* **Momentum Builder:** Encourages quick-win dopamine loops by highlighting 5-15 minute low-energy micro-tasks.
* **Streak Shield Visibility:** The accompanying streak widget constantly assures the user that their momentum is protected with a Freeze Shield (`🛡️ 1 Streak Freeze sẵn sàng`).

