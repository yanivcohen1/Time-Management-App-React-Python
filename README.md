# React + FastAPI Full Stack Application

A modern full-stack web application built with React (Vite) for the frontend and FastAPI for the backend, using MongoDB as the database.

## 🏗 Architecture

- **Frontend**: React, TypeScript, Vite, Material UI
- **Backend**: Python, FastAPI, Motor (Async MongoDB), Beanie ODM
- **Database**: MongoDB

## ✨ Features

- **User Authentication**: Secure login and registration system.
- **Role-Based Access**: Support for different user roles (User, Admin).
- **Todo Management**: Full CRUD operations for managing tasks.
- **Task Duration**: Track the estimated or actual duration (in hours) for each task.
- **Agile Board**: Interactive Kanban-style board with drag-and-drop functionality.
- **Status Tracking**: Detailed table view for tracking task status and details.
- **Dashboard**: Visual statistics on task status and workload distribution.

## 🚀 Getting Started

### Prerequisites

- Node.js & pnpm
- Python 3.10+
- MongoDB running locally (default: `mongodb://localhost:27017`)

### Installation

1. **Clone the repository**

2. **Backend Setup**
   Navigate to the `server` directory and set up your Python environment.
   ```bash
   cd server
   python -m venv venv
   # Activate venv
   # Windows: .\venv\Scripts\activate
   # Unix: source venv/bin/activate
   
   # Install dependencies
   # Note: Ensure you have the necessary packages installed (fastapi, uvicorn, motor, beanie, pydantic, pyyaml, pytest)
   # pip install -r requirements.txt # (If requirements.txt is present)
   ```

3. **Frontend Setup**
   Navigate to the `client` directory and install dependencies.
   ```bash
   cd client
   pnpm install
   ```

## 🛠 Development

The project is designed to be run primarily from the `client` directory using `pnpm` scripts that orchestrate both frontend and backend tasks.

### Start the Application

1. **Start the Backend Server**
   ```bash
   cd client
   pnpm server
   ```
   Runs on `http://localhost:5000`.

2. **Start the Frontend Development Server**
   ```bash
   cd client
   pnpm dev
   ```
   Runs on `http://localhost:5173`.

### Database Seeding

To populate the database with initial data:
```bash
cd client
pnpm seed
```

## 🧪 Testing

- **Frontend Unit Tests**: `pnpm test`
- **Frontend E2E Tests**: `pnpm test:e2e` (Cypress)
- **Backend Tests**: `pnpm test:py`

## 📜 Available Scripts

All scripts are run from the `client` directory using `pnpm <script-name>`.

| Script | Description |
| :--- | :--- |
| `dev` | Starts the frontend development server (Vite). |
| `build` | Builds the frontend for production. |
| `preview` | Previews the production build locally. |
| `lint` | Lints the frontend code using ESLint. |
| `test` | Runs frontend unit tests (Vitest). |
| `test:watch` | Runs frontend unit tests in watch mode. |
| `coverage` | Runs frontend unit tests with coverage report. |
| `test:e2e` | Runs end-to-end tests (Cypress). |
| `test:e2e:report` | Runs E2E tests and generates a report. |
| `test:py` | Runs backend tests (Pytest). |
| `lint:py` | Lints the backend code using Pylint. |
| `seed` | Seeds the MongoDB database with initial data. |
| `serve` | Starts the backend server in development mode (with reload). |
| `serve:prod` | Starts the backend server in production mode. |

## 📁 Project Structure

```
├── client/                 # Frontend application
│   ├── cypress/           # E2E tests
│   │   ├── e2e/
│   │   │   ├── login.cy.ts
│   │   │   └── todo.cy.ts
│   │   └── ...
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── api/           # API integration
│   │   │   └── axios.ts
│   │   ├── assets/        # Source assets
│   │   ├── components/    # Reusable UI components
│   │   │   ├── CreateTodoModal.tsx
│   │   │   └── Layout.tsx
│   │   ├── context/       # React Context (State Management)
│   │   │   ├── AuthContext.tsx
│   │   │   └── ColorModeContext.tsx
│   │   ├── pages/         # Page components
│   │   │   ├── AgileBoard.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   └── TrackStatus.tsx
│   │   ├── App.tsx        # Main App component
│   │   ├── main.tsx       # Entry point
│   │   ├── theme.ts       # MUI Theme configuration
│   │   └── ...
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── server/                 # Backend application
│   ├── app/
│   │   ├── routes/        # API Routes
│   │   │   ├── auth.py
│   │   │   └── todos.py
│   │   ├── auth.py        # Auth utilities
│   │   ├── config.py      # Configuration loader
│   │   ├── database.py    # Database connection
│   │   ├── main.py        # FastAPI entry point
│   │   └── models.py      # Database models
│   ├── tests/             # Backend tests
│   │   ├── conftest.py
│   │   ├── test_api.py
│   │   ├── test_check_users.py
│   │   └── test_login.py
│   ├── config.dev.yaml    # Dev configuration
│   ├── config.prod.yaml   # Prod configuration
│   ├── seed.py            # Database seeder
│   └── ...
├── README.md
└── ...
```

## 📝 Configuration

- **Backend**: Configured via `server/config.dev.yaml` and `server/config.prod.yaml`.
- **Frontend**: Environment variables in `.env` (if applicable) and `vite.config.ts`.
