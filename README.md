# Project Tracker

A fully-featured, role-based project and task management web application inspired by Trello and Asana. It features a beautiful, Apple-inspired premium "Glassmorphism" design with soft teal aesthetics.

## Features

- **User Authentication**: Secure JWT-based login and registration system.
- **Role-Based Access Control (RBAC)**:
  - **Admins**: Can create projects, add/remove members, manage all tasks, update project statuses, and extend deadlines.
  - **Members**: Can view assigned projects and update statuses for tasks specifically assigned to them.
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
- Node.js (v16+)

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

## Deployment

The project is structured as a monolith for easy deployment to platforms like **Railway** or **Render**. 
- In production, the Express backend serves the statically built React frontend from the `client/dist` folder.
- Ensure you set `NODE_ENV=production` and map your environment variables accordingly. 
- *Note*: For production environments, it is highly recommended to swap SQLite for a persistent database like PostgreSQL.
