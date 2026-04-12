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

## Current Auth Modes

### Local mode
- Works immediately with email/password
- Useful for development and internal rollout
- Frontend posts credentials to backend login endpoint
- Backend creates secure server-side session in MongoDB

### OIDC-compatible mode
- Backend includes OIDC-compatible endpoints for:
  - login start
  - callback
  - logout redirect
- Intended for Keycloak or another enterprise identity provider
- Configure with backend environment variables

## Login Flow

### Local login flow
1. User opens the app.
2. Router redirects to `/login` if there is no authenticated session.
3. Login page submits credentials to `POST /api/v1/auth/login`.
4. Backend verifies the user and creates a session in MongoDB.
5. Backend sets:
   - HttpOnly session cookie
   - readable CSRF cookie
6. Frontend stores only session state in memory and redirects by role.

### OIDC flow
1. Frontend triggers `GET /api/v1/auth/oidc/login`.
2. Backend builds the authorization URL and stores transient state in a cookie.
3. User authenticates with the identity provider.
4. Provider redirects to backend callback.
5. Backend exchanges the code for tokens, loads user info, creates a local session, and redirects to the frontend.

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
- `backend/app/api/v1/controllers/auth_controller.py`
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

## Notes for Real Keycloak Integration

To connect a real provider:
- set `AUTH_MODE=oidc`
- set issuer URL, client ID, client secret, redirect URI
- ensure the provider sends role information in claims or userinfo
- switch the UI to trigger OIDC login as the main method if you do not want local password login anymore

## Validation Performed

- Frontend: `npx tsc -b --pretty false`
- Backend: `python3 -m compileall app`
