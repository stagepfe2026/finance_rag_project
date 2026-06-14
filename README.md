# rag_finance Authentication Architecture

## Overview

This project now starts on a protected login flow and uses a simple, readable server-side session architecture designed to be easy to understand and extend.

### Frontend
- React + TypeScript
- `AuthContext` centralizes session loading, login, logout, refresh, and idle timeout handling
- React Router guards protect routes and redirect users by role
- Login page is the first entry point

### Backend
- FastAPI
- Layered auth module using:
  - controller
  - service
  - repository
  - middleware
  - model
  - schema
- MongoDB stores both users and sessions
- Session expiration is enforced centrally in middleware

## Auth Mode

### Local mode
- Works immediately with email/password
- Useful for development and internal rollout
- Frontend posts credentials to backend login endpoint
- Backend creates secure server-side session in MongoDB

## Login Flow

1. User opens the app.
2. Router redirects to `/login` if there is no authenticated session.
3. Login page submits credentials to `POST /api/auth/login`.
4. Backend verifies the user and creates a session in MongoDB.
5. Backend sets:
   - HttpOnly session cookie
   - readable CSRF cookie
6. Frontend stores only session state in memory and redirects by role.

## Session Storage in MongoDB

Sessions are stored in the `auth_sessions` collection with a structure similar to:

- `userId`
- `tokenHash`
- `csrfToken`
- `expiresAt`
- `refreshExpiresAt`
- `idleExpiresAt`
- `absoluteExpiresAt`
- `createdAt`
- `lastActivityAt`
- `closedAt`
- `closeReason`
- `closedBeforeExpiry`

## Expiration Rules

### Access token expiry
- Enforced at `15 minutes`
- Stored as `expiresAt`
- Refreshed server-side when the session is still valid

### Refresh token expiry
- Enforced at `8 hours`
- Stored as `refreshExpiresAt`
- If expired, the user must log in again

### Idle timeout
- Enforced at `30 minutes`
- Stored as `idleExpiresAt`
- Also mirrored client-side by the idle timer in `AuthContext`

### Absolute session timeout
- Enforced at `8 hours`
- Stored as `absoluteExpiresAt`
- Session is closed even if the user is active

## Role Redirects

- `ADMIN` -> `/admin/documents/import`
- `FINANCE_USER` -> `/user/accueil`

## Important Files

### Frontend
- `frontend/src/auth/AuthContext.tsx`
- `frontend/src/auth/guards.tsx`
- `frontend/src/router.tsx`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/services/auth.service.ts`

### Backend
- `backend/app/api/routers/auth_router.py`
- `backend/app/services/auth_service.py`
- `backend/app/middlewares/auth_session_middleware.py`
- `backend/app/repositories/users_repository.py`
- `backend/app/repositories/sessions_repository.py`
- `backend/app/models/user_model.py`
- `backend/app/models/session_model.py`
- `backend/app/core/security.py`

## Development Credentials

If `AUTH_SEED_DEFAULT_USERS=true`, startup seeds:

- Admin:
  - email: `admin@finance.local`
  - password: `Admin123!`
- User:
  - email: `user@finance.local`
  - password: `User123!`

## Run

### Backend
1. Copy `backend/.env.example` to `backend/.env`
2. Start MongoDB
3. Start the API

Example:
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env`
2. Start Vite

Example:
```bash
cd frontend
npm install
npm run dev
```

## Validation Performed

- Frontend: `npx tsc -b --pretty false`
- Backend: `python3 -m compileall app`
