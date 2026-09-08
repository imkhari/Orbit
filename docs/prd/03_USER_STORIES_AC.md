# User Stories & Acceptance Criteria Specification — ORBIT

| Document Metadata | Details |
| :--- | :--- |
| **Project** | **Orbit** — Intelligent Task Orchestrator for ADHD Minds |
| **Methodology** | Agile / Scrum — Prioritized via MoSCoW Framework |
| **Specification Syntax** | Connextra Format (`As a... I want to... So that...`) & Gherkin (`Given - When - Then`) |

---

## 1. Master User Story Register (MoSCoW Matrix)

| Story ID | Domain | User Story | Priority |
| :--- | :--- | :--- | :--- |
| **US-01** | **Authentication** | As a new user, I want to register and sign in seamlessly with Google or Email/Password, so that my personal boards and progress are securely persisted. | **Must Have** |
| **US-02** | **Board Management** | As an individual managing separate life facets, I want to maintain 3 to 5 isolated boards (e.g., Study, Career, Personal), so that contexts do not collide. | **Must Have** |
| **US-03** | **Instant Capture** | As a user prone to working memory decay, I want to capture a task title in under 5 seconds with a single input action, so that ideas are secured before they vanish. | **Must Have** |
| **US-04** | **4-Lane Kanban** | As a visual thinker requiring structured boundaries, I want to track work through 4 immutable lanes (Backlog → Todo → Doing → Done), so that status is immediately legible. | **Must Have** |
| **US-05** | **AI Decomposition** | As a user overwhelmed by large assignments, I want AI to decompose tasks into actionable micro-steps under 20 minutes, so that I can initiate action without paralysis. | **Must Have** |
| **US-06** | **Human-in-the-Loop** | As an autonomous user, I want to inspect, edit, or reject AI-generated subtasks before persistence, so that I retain full ownership of my commitments. | **Must Have** |
| **US-07** | **Energy Filtering** | As a user with fluctuating cognitive energy, I want to filter for low-effort tasks when exhausted, so that I maintain momentum without inducing burnout. | **Should Have** |
| **US-08** | **WIP Enforcement** | As a user vulnerable to fragmented multitasking, I want the system to restrict the Doing lane to 1 item, so that I focus on sequential completion. | **Should Have** |
| **US-09** | **Focus Mode** | As a user sensitive to visual clutter, I want to hide all surrounding boards and display only the active task with a Pomodoro timer, so that distractions are eliminated. | **Should Have** |
| **US-10** | **Gentle Gamification** | As a user motivated by positive feedback loops, I want to earn XP on task completion and protect streaks via a Streak Freeze, so that missed days do not trigger despair. | **Could Have** |
| **US-11** | **Calendar Sync** | As a user experiencing time blindness, I want ticket deadlines to synchronize with Google Calendar, so that system notifications prompt me on time. | **Could Have** |

---

## 2. Detailed Acceptance Criteria (Gherkin Scenarios)

### 2.1. Authentication & Security Domain

#### US-01.1: Safe Authentication Error Handling
```gherkin
Feature: Safe User Sign-In
  Scenario: Invalid credentials submitted
    Given An unauthenticated user on the Sign-In screen
    When The user submits an incorrect password for an existing account
    Then The system displays a generic error: "Invalid email or password"
    And Does NOT reveal whether the email exists in the database
    And Retains the entered email in the form field for convenient re-entry
```

#### US-01.2: One-Tap Google OAuth2 Sign-In
```gherkin
Feature: Google OAuth2 Sign-In
  Scenario: Seamless authentication via Google identity
    Given An unauthenticated user on the Welcome screen
    When The user taps "Continue with Google" and approves OAuth2 permissions
    Then The backend securely verifies the token and retrieves user identity
    And Issues a 15-minute JWT Access Token and a secure HTTP-only Refresh Token
    And Navigates the user directly to their primary board within 1.5 seconds
```

---

### 2.2. Task Management & Instant Capture Domain

#### US-03.1: Zero-Friction Instant Capture
```gherkin
Feature: Instant Task Creation
  Scenario: Quick task capture from the persistent bottom bar
    Given The user is on any screen within the mobile application
    When The user taps the bottom quick-capture input field
    And Types "Submit AI Project Requirements Draft" and taps Submit
    Then A new ticket is immediately created at the top of the "Backlog" column
    And The ticket defaults to Medium energy requirement and unassigned deadline
    And The text input clears immediately to prepare for subsequent thoughts
    And A subtle haptic pulse confirms creation within 100ms
```

#### US-04.1: Kanban Card Movement & State Transition
```gherkin
Feature: Moving Tickets Across Kanban Columns
  Scenario: Dragging a completed ticket from Doing to Done
    Given A ticket titled "Implement HealthController" located in "Doing"
    When The user drags the ticket into the "Done" lane
    Then The ticket status transitions to "DONE" with a gentle confetti animation
    And The backend records the completion timestamp and awards +20 XP
    And The "Doing" lane is now empty, enabling the user to pull the next task
```

---

### 2.3. AI Assistance & Human-in-the-Loop Domain

#### US-05.1: AI Task Breakdown Request
```gherkin
Feature: AI-Assisted Task Decomposition
  Scenario: Requesting micro-steps for an intimidating task
    Given An active ticket titled "Prepare Software Architecture Final Slides"
    When The user taps "✨ AI Breakdown"
    Then The system displays a calm loading indicator: "Breaking down this challenge for you..."
    And The Spring Boot backend invokes the LLM using an ADHD-optimized prompt
    And Within 3.0 seconds, a preview bottom sheet presents 3 to 5 actionable subtasks
    And Every proposed subtask has an estimated duration <= 20 minutes
```

#### US-06.1: Granular Review and Persistence of AI Subtasks
```gherkin
Feature: Human-in-the-Loop Verification
  Scenario: User customizes and accepts proposed subtasks
    Given The preview bottom sheet is open with 4 suggested subtasks
    When The user deselects subtask 4 and edits subtask 1 title
    And Taps "Apply to Task"
    Then Exactly 3 subtasks are saved as checklist items under the parent ticket
    And The bottom sheet closes, displaying the updated checklist
    
  Scenario: User rejects AI proposal
    Given The preview bottom sheet is open with suggestions
    When The user taps "Cancel" or swipes down to dismiss
    Then Zero subtasks are written to the database
    And The parent ticket remains completely unaltered
```

---

### 2.4. Cognitive Ergonomics & WIP Enforcement Domain

#### US-08.1: Strict WIP Limit on In-Progress Work
```gherkin
Feature: Single-Tasking Enforcement
  Scenario: User attempts to exceed the Doing lane capacity
    Given The "Doing" lane already contains 1 active ticket
    When The user attempts to drag a second ticket from "Todo" into "Doing"
    Then The interface rejects the drop and animates the card back to "Todo"
    And Provides a gentle haptic buzz with an encouraging toast:
      "Your mind thrives when focusing on one thing. Finish or pause your current work first!"
```

#### US-09.1: Distraction-Free Focus Mode
```gherkin
Feature: Single-Task Focus Mode
  Scenario: Entering Focus Mode on an active ticket
    Given A ticket currently residing in the "Doing" lane
    When The user taps "Start Focus"
    Then All neighboring Kanban lanes and bottom navigation bars are hidden
    And The screen focuses exclusively on the ticket title and active checklist item
    And A minimalist 25-minute Pomodoro timer initiates in silent mode
```
