# Chapter 4: Wireframing & Design System Specification — ORBIT

| Metadata | Details |
| :--- | :--- |
| **Project** | **Orbit** – Intelligent Task Orchestrator for ADHD Minds |
| **Document Stage** | 4.2 Bố cục Khung (Wireframing) & 4.3 Bản mẫu (Prototyping) |
| **Design Standards** | WCAG 2.1 AA Compliance & ADHD Cognitive Ergonomics |
| **Author** | Orbit Engineering & Product Team |

---

## 1. ADHD Cognitive Design System (Design Tokens)

Traditional productivity interfaces flood the user with high-saturation alerts, microscopic buttons, and dense dropdowns that induce anxiety and sensory exhaustion. Orbit's design system adheres to strict cognitive calming rules:

### 1.1. Color Palette (Calm Dark Scheme)

| Token Name | Hex Code | Purpose & Cognitive Rationale |
| :--- | :--- | :--- |
| `background.canvas` | `#0F172A` | Deep slate canvas that reduces glare and eye strain during extended use. |
| `surface.card` | `#1E293B` | High-contrast card surface providing clear visual separation of tasks. |
| `surface.subtle` | `#334155` | Borders and dividers ensuring structural boundaries without visual clutter. |
| `text.primary` | `#F8FAFC` | Bright, accessible foreground text achieving $> 12:1$ contrast ratio. |
| `text.secondary` | `#94A3B8` | Subtext and time estimates that fade back gracefully to prevent distraction. |
| `accent.primary` | `#38BDF8` | Sky Blue accent stimulating dopamine and focus without the panic of harsh reds. |
| `energy.low` | `#94A3B8` | ☕ Low Energy: Soft neutral slate indicating easy, low-strain routine items. |
| `energy.medium` | `#FBBF24` | ⚡ Medium Energy: Warm amber indicating standard focus-required tasks. |
| `energy.high` | `#F87171` | 🔥 High Energy: Soft coral (not alarm red) reserved for deep focus work. |
| `status.done` | `#34D399` | Mint emerald celebrating completion with positive reinforcement. |

---

### 1.2. Cognitive Ergonomics & Spatial Rules

* **Minimum Touch Target:** $\ge 44 \times 44\,\text{px}$ for all interactive buttons and checkboxes, accommodating users experiencing motor restlessness or tapping quickly.
* **Generous Card Padding:** $16\,\text{px}$ internal padding and $12\,\text{px}$ separation to eliminate visual density anxiety.
* **Prohibition of High-Stress Alerts:** Red overdue notifications are strictly forbidden; time proximity is indicated via calm badges (e.g., *"Due today"*).
* **Single-Task Prominence:** In the Kanban view, the `Doing` lane visually highlights the single active task while maintaining a strict WIP limit of 1.

---

## 2. ASCII Wireframe Layouts

### 2.1. Main Screen: Kanban Board View (`BoardScreen`)

```text
+-------------------------------------------------------------+
|  🌌 ORBIT                    Energy: [ ⚡ Medium ]  [⚙️]   |
|  Calm workspace for ADHD                                    |
+-------------------------------------------------------------+
|  [ Backlog (3) ]  [ Todo (2) ]  [ Doing (1/1) ]  [ Done (4) ]|
+-------------------------------------------------------------+
|                                                             |
|  +-------------------------------------------------------+  |
|  | 🃏 Prepare Software Architecture Slides               |  |
|  | ☕ 25 mins   ⚡ Med Energy   📋 2/4 steps completed   |  |
|  |                                                       |  |
|  | [ ✨ AI Breakdown ]               [ Move to Todo -> ] |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  +-------------------------------------------------------+  |
|  | 🃏 Read 10 pages of Cognitive Science textbook       |  |
|  | ☕ 15 mins   ☕ Low Energy   📋 0/0 steps             |  |
|  |                                                       |  |
|  | [ ✨ AI Breakdown ]               [ Move to Todo -> ] |  |
|  +-------------------------------------------------------+  |
|                                                             |
+-------------------------------------------------------------+
| [⚡] [ Thêm nhanh việc mới vào Backlog...         ] [ + Thêm ]|
+-------------------------------------------------------------+
```

---

### 2.2. Modal View: AI Task Decomposition (`AIDecomposeModal`)

```text
+-------------------------------------------------------------+
| ==================== [ PULL HANDLE ] ====================== |
| ✨ AI Task Breakdown: "Prepare Final Slides"                 |
| AI suggested 4 micro-steps under 20 mins. Edit or deselect: |
+-------------------------------------------------------------+
|                                                             |
| [✓] 1. [ Open Google Slides & pick dark template ]   (5m)  |
| [✓] 2. [ Outline 4 core chapter headings         ]  (10m)  |
| [✓] 3. [ Draft architecture sequence diagram     ]  (15m)  |
| [ ] 4. [ Practice 5-minute verbal walkthrough    ]  (15m)  |
|                                                             |
| Total Estimated Focus: 30 minutes                           |
|                                                             |
| [ Cancel ]                         [ Confirm & Apply (3) ]  |
+-------------------------------------------------------------+
```

---

## 3. Interaction & Animation Specs

* **Horizontal Lane Navigation:** Smooth swipeable paging between lanes with active indicator pills at the top.
* **Instant Capture Feedback:** When adding via the bottom bar, the new card slides into view from the top with an affirmative haptic pulse.
* **WIP Exceeded State:** If a user attempts to add a second task into `Doing`, a gentle warning toast slides down: *"Your mind excels at single-tasking. Complete or pause your current task first!"*
