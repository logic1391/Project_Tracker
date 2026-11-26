# Project Tracker

A fully-featured, role-based project and task management web application inspired by Trello and Asana. It features a beautiful, Apple-inspired premium "Glassmorphism" design with soft teal aesthetics.

## Features

- **User Authentication**: Secure JWT-based login and registration system.
- **Role-Based Access Control (RBAC)**:
  - **Admins** (global): Can create and delete projects, manage every project's details, members and tasks, and promote or demote users from the **Team** page.
  - **Project Admins**: A member whose role on a project is `Admin` can edit that project, manage its members (and their project roles) and create, edit and delete its tasks.
  - **Members**: Can view the projects they belong to and update the status of tasks assigned to them.
  - The **first account** created becomes the global Admin; later sign-ups are Members. The last remaining Admin cannot be demoted.
- **Advanced Project Management**:
  - Track Project status (`Draft`, `Active`, `Completed`).
  - Manage project deadlines with visual overdue indicators.
  - "Manage Members" portal to add and remove users from projects.
- **Task Management**:
  - Assign tasks to team members.
  - Set priorities (Low, Medium, High).
  - Track task statuses (To Do, In Progress, Done).
- **Dashboard Analytics**: Real-time metrics for total tasks, project distribution, overdue warnings, and user workloads.

## Tech Stack

- **Frontend**: React (Vite), Lucide-React Icons, Vanilla CSS (Custom Glassmorphism Design System)
- **Backend**: Node.js, Express.js
- **Database**: SQLite with Sequelize ORM
- **Security**: bcrypt (password hashing), jsonwebtoken (JWT)

## Local Development

### Prerequisites
- Node.js 20.19+ (required by Vite 8 and sqlite3 6)

### Installation

1. Clone the repository and install dependencies in the root, `client`, and `server` folders:
```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

2. Start the development servers concurrently:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend will run on `http://localhost:5001`.


### Configuration

The server reads these optional environment variables (a `server/.env` file is supported):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5001` | API port |
| `JWT_SECRET` | development fallback | Secret used to sign JWTs. **Set this in production.** |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `DB_STORAGE` | `server/database.sqlite` | Path of the SQLite database file |

## API Overview

| Method & path | Who |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | Public |
| `GET /api/auth/me` | Any signed-in user (returns the current role) |
| `GET /api/users`, `PUT /api/users/:id/role` | Global Admin |
| `GET /api/projects`, `GET /api/projects/:id` | Admin, or project members |
| `POST /api/projects`, `DELETE /api/projects/:id` | Global Admin |
| `PUT /api/projects/:id`, `POST/PUT/DELETE /api/projects/:id/members[/:userId]` | Global Admin or project Admin |
| `GET /api/tasks` | Admin, or tasks in the user's projects |
| `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id` | Global Admin or project Admin |
| `PUT /api/tasks/:id/status` | Assignee, global Admin or project Admin |
| `GET /api/dashboard/metrics` | Any signed-in user (scoped to their projects) |
