# 30-days-tracker

A lightweight demo for a 30-day task tracker with a Vue-powered static front-end and a Kotlin Spring Boot API scaffold.

## Frontend

- Lives in `frontend/` and uses Vue 3 from a CDN (no build tooling required).
- Open `frontend/index.html` in a browser to view the interactive calendar, daily task list, sidebar month tree, and stats.
- Tasks update live for the selected day and past days are locked to mirror the desired behavior.

## Backend (Spring Boot scaffold)

- Kotlin + Spring Boot starter located in `backend/`.
- Endpoints:
  - `GET /api/months/{year}/{month}` – returns a month summary with per-day statuses and stats.
  - `POST /api/tasks` – adds a new task (ID is generated server-side).
  - `POST /api/tasks/{taskId}/toggle` – toggles completion for a task (past-day tasks stay locked).
- The service seeds a small set of demo tasks for the current month.

> Note: Dependency installation from Maven Central/npm may be blocked in this environment; the code is structured to run with standard Spring Boot and Vue setups when dependencies are available.
