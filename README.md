# 🌌 Orbit — Intelligent Task Orchestrator for ADHD Minds

<p align="center">
  <img src="https://img.shields.io/badge/Status-Scaffolding%20%26%20PRD%20Baseline-blue?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Architecture-Clean%20Architecture-brightgreen?style=for-the-badge" alt="Architecture" />
  <img src="https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot%203-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%2015-336791?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/AI-Gemini%201.5%20Flash-orange?style=for-the-badge&logo=google&logoColor=white" alt="AI" />
</p>

---

## 📌 Project Overview

**Orbit** is an intelligent task coordination and management system scientifically designed for individuals diagnosed with **ADHD (Attention Deficit Hyperactivity Disorder)** and those who experience severe executive dysfunction (*Time Blindness, Activation Paralysis, Analysis Overload*).

Unlike conventional project management tools (Jira, Trello) that impose multi-step manual data entry and visual clutter, **Orbit** reduces cognitive friction through:
* ⚡ **Instant Capture:** Log emerging tasks in under 5 seconds with zero required dropdowns.
* 🧩 **AI Task Decomposition:** Decompose overwhelming tasks into bite-sized micro-steps (< 20 minutes) with human-in-the-loop preview.
* 🧠 **Energy-Adaptive Prioritization:** Prioritize tasks matching the user's active cognitive energy (☕ Low / ⚡ Medium / 🔥 High).
* 🎯 **WIP Limits & Focus Mode:** Strict cap on in-progress tasks (max 1) and a dedicated distraction-free Pomodoro view.
* 🛡️ **Gentle Gamification:** Encouraging XP rewards and a *Streak Freeze* mechanism to protect motivation across off-days.

---

## 📚 Product Documentation (`docs/`)

All software engineering and product management artifacts are maintained in the [`docs/`](docs/) directory:

1. 📄 [**01. Project Brief**](docs/01_PROJECT_BRIEF.md): Core problem hypothesis, primary persona, MVP scope, explicit exclusions, and the decision log (D1–D13).
2. 📋 [**02. Product Requirements Document (PRD)**](docs/02_PRD.md): Comprehensive PRD covering ADHD psychological background, user personas, empathy mapping, customer journey, functional/non-functional requirements, and AI data contracts.
3. 🎯 [**03. User Stories & Acceptance Criteria**](docs/03_USER_STORIES_AC.md): MoSCoW-prioritized user stories accompanied by observable **Gherkin (`Given - When - Then`)** acceptance criteria.
4. 🏗️ [**04. System Architecture & Design**](docs/04_SYSTEM_ARCHITECTURE.md): 3-tier layered system design, Mermaid Database ERD, RESTful API endpoint specifications, and offline-first resilience strategy.

---

## 🏛️ System Architecture

```mermaid
graph LR
    subgraph Mobile ["📱 Mobile Client (React Native + Expo)"]
        A[UI Screens & Kanban] <--> B[Zustand & TanStack Query]
        B <--> C[Local Cache / SQLite]
    end

    subgraph Server ["☕ Backend (Spring Boot 3.x)"]
        D[REST Controllers] --> E[Service Layer]
        E --> F[Spring Data JPA]
        E --> G[Spring AI Engine]
    end

    subgraph Cloud ["☁️ Data & AI Services"]
        H[(PostgreSQL 15)]
        I[Google Gemini 1.5 Flash]
    end

    Mobile -- "HTTPS / JWT" --> D
    F --> H
    G -- "Prompt JSON Mode" --> I
```

---

## 📂 Repository Structure

```text
orbit_project/
├── .gitignore                      # Git exclusion rules (Node, Java, macOS, IDEs)
├── README.md                       # Project overview and development guidelines
├── docs/                           # Software Engineering & Product Documentation
│   ├── 01_PROJECT_BRIEF.md         # Initial project scope and decision log
│   ├── 02_PRD.md                   # Full Product Requirements Document (Chapter 3 aligned)
│   ├── 03_USER_STORIES_AC.md       # MoSCoW User Stories and Gherkin Acceptance Criteria
│   └── 04_SYSTEM_ARCHITECTURE.md   # Architectural design, ERD, and API contracts
├── mobile/                         # Mobile Client Scaffolding (React Native Expo)
│   ├── src/
│   │   ├── components/             # Reusable UI widgets
│   │   ├── screens/                # Application screens (BoardScreen, FocusScreen)
│   │   ├── services/               # Axios REST API Client
│   │   └── types/                  # TypeScript domain models
│   ├── app.json                    # Expo project configuration
│   ├── package.json                # Mobile dependencies
│   └── tsconfig.json               # Standalone TypeScript compiler options
└── backend/                        # Backend API Scaffolding (Spring Boot 3.x)
    ├── src/
    │   ├── main/
    │   │   ├── java/com/orbit/
    │   │   │   ├── controller/     # REST API Controllers (HealthController)
    │   │   │   ├── entity/         # JPA Entities (User, Task, Subtask)
    │   │   │   └── OrbitApplication.java
    │   │   └── resources/
    │   │       └── application.yml # Datasource, JWT, and AI configurations
    └── pom.xml                     # Maven build and dependency management
```

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Mobile Client** | **React Native (Expo SDK) + TypeScript** | Unified iOS & Android codebase enabling instant task capture on mobile devices anytime. |
| **Mobile State** | **Zustand + TanStack Query** | Lightweight state management with optimistic UI updates and robust offline caching. |
| **Backend API** | **Spring Boot 3.x (Java 17/21)** | Enterprise-grade reliability, strict layered separation, and comprehensive security standards. |
| **Security** | **Spring Security + JWT + OAuth2** | Stateless authentication with one-tap Google Identity sign-in. |
| **Database** | **PostgreSQL 15+** | Robust ACID relational persistence ensuring data integrity and fast indexed queries. |
| **AI Engine** | **Spring AI + Google Gemini 1.5 Flash** | Sub-3s structured JSON task decomposition with human-in-the-loop validation. |

---

## 🚦 Git Commit Guidelines (Conventional Commits)

This repository strictly follows the Conventional Commits specification:
* `docs:` Documentation additions or modifications (`PRD`, `Architecture`, `README`).
* `feat:` Introduction of a new functional capability.
* `fix:` Bug fixes or UI remediation.
* `refactor:` Code refactoring without behavioral alterations.
* `chore:` Build scripts, dependency updates, and environment configuration.
