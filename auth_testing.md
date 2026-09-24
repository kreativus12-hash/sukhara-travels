# Sukhara authentication testing

1. Log in with the seeded admin account at `/api/auth/login`.
2. Confirm the response sets httpOnly `access_token` and `refresh_token` cookies.
3. Call `/api/auth/me` with the session cookie and confirm the admin role.
4. Confirm `/api/admin/enquiries` returns 401 without a session and works with the admin session.
5. Confirm five failed attempts for one email/IP are rate limited.