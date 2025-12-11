# Gorizont - Server proxy for protected CRUD

This small server proxies selected Parse (Back4App) REST endpoints so the REST API key remains on the server and isn't exposed to browser bundles.

Features:
- Proxy for Reviews (`/api/reviews`)
- Proxy for Appeals (`/api/appeals`)
- Audit log write/read (`/api/audit`)
- Admin-protected endpoints require `X-Admin-Secret` header equal to `ADMIN_SECRET`

Setup:
1. Copy `.env.example` to `.env` and fill values for `PARSE_APP_ID`, `PARSE_REST_KEY`, and `ADMIN_SECRET`.
2. Install deps and run:

```powershell
cd server
npm install
npm run dev
```

By default the server listens on port defined in `.env` or `4000`.

Usage from frontend:
- The frontend now attempts to call `/api/reviews`, `/api/appeals` etc. first. If the server is running and configured, the call will be proxied through the backend using the secure REST key.
- Moderator actions (PUT/DELETE for reviews, PUT for appeals) require `X-Admin-Secret` header. From frontend, set this header only in trusted flows (e.g., server-to-server or admin tools).

Security notes:
- Keep `ADMIN_SECRET` and `PARSE_REST_KEY` secret and never commit them.
- For production, run this server behind HTTPS and restrict admin endpoints.
- Consider adding authentication middleware (JWT, sessions) for admin users instead of a static secret.
