# Roadmap: Authentication & Authorization (Beginner -> Advanced)

This roadmap is for learning safe auth/authorization patterns for a production multi-tenant e-commerce platform with three separate kinds of users (super admins, merchant users, customers), each with their own separate authentication system.

> **Approval required:** Please review this roadmap and approve before I continue to Step 3 (writing chapters one by one).

## Sources of truth
- [MDN Web Docs](https://developer.mozilla.org/) - Cookies, HTTP authentication
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) - Authentication, Session Management, Password Storage, JWT, CSRF, Access Control
- [RFC 7519 - JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)
- [OAuth 2.0 (RFC 6749)](https://www.rfc-editor.org/rfc/rfc6749)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- Library docs for any libraries actually used in `auth-learn/` (versions will be recorded in Step 1)

**Rule:** If sources disagree, we trust OWASP's current recommendations and call it out.

## Project layout (planned)
```
auth-learn/
├── api/        # TypeScript Node.js + Express API
├── web/        # Tiny Next.js frontend for login pages
├── infra/      # Docker compose for local throwaway PostgreSQL
├── docs/       # Learning chapters (one file per topic)
└── scripts/    # Helper scripts for demos
```

## Table of contents (ordered beginner -> advanced)

### Part 1: Foundations (Beginner)
1. [01-auth-vs-authz.md](01-auth-vs-authz.md) - Authentication vs Authorization, identity, credentials, factors
2. [02-identity-and-credentials.md](02-identity-and-credentials.md) - Principals, identifiers, credentials, factor types (knowledge/possession/inherence), MFA intro
3. [03-passwords-why-never-plaintext.md](03-passwords-why-never-plaintext.md) - Plaintext danger, hashing vs encryption, salt, pepper (concept)
4. [04-slow-hashes-and-demo.md](04-slow-hashes-and-demo.md) - Argon2id, bcrypt, scrypt; local demo of cracking speed on weak hashes; when to use each
5. [05-password-rules-and-breached-checks.md](05-password-rules-and-breached-checks.md) - Modern password rules (NIST-aligned), breached password checks (k-anonymity) safely
6. [06-sessions-intro.md](06-sessions-intro.md) - Server-side sessions, session IDs, entropy, storage considerations
7. [07-session-stores-expiry-rotation.md](07-session-stores-expiry-rotation.md) - DB vs Redis stores, absolute/idle expiry, rotation on login, logout
8. [08-cookies-in-depth.md](08-cookies-in-depth.md) - HttpOnly, Secure, SameSite, Domain, Path, `__Host-` prefix, why safer than localStorage for tokens
9. [09-sessions-vs-jwt-honest.md](09-sessions-vs-jwt-honest.md) - Honest comparison, trade-offs, when to use each

### Part 2: Tokens, Flows, Attacks (Intermediate)
10. [10-jwt-structure-and-claims.md](10-jwt-structure-and-claims.md) - Header/payload/signature, base64url, claims (`iss`, `aud`, `sub`, `exp`, `nbf`, `iat`, `jti`), validation
11. [11-jwt-signing-algorithms.md](11-jwt-signing-algorithms.md) - HS256 vs RS256/EdDSA, key management, `alg: none` danger demo + fix
12. [12-access-refresh-tokens.md](12-access-refresh-tokens.md) - Short access, longer refresh, rotation, reuse detection, revocation problem
13. [13-registration-login-logout.md](13-registration-login-logout.md) - Registration, login, logout flows with correct order
14. [14-email-verification.md](14-email-verification.md) - Tokens, expiry, single-use, verification flow
15. [15-forgot-reset-password.md](15-forgot-reset-password.md) - Single-use expiring hashed reset tokens, preventing enumeration
16. [16-change-password-logout-everywhere.md](16-change-password-logout-everywhere.md) - Change password, invalidate sessions/tokens, "log out everywhere"
17. [17-brute-force-rate-limiting.md](17-brute-force-rate-limiting.md) - Brute force, credential stuffing, rate limiting, lockouts (careful), per-IP and per-account
18. [18-user-enumeration-timing.md](18-user-enumeration-timing.md) - User enumeration, constant-time comparisons, timing attack basics
19. [19-session-fixation-csrf.md](19-session-fixation-csrf.md) - Session fixation, CSRF, SameSite+CSRF tokens where needed
20. [20-token-theft-xss.md](20-token-theft-xss.md) - Token theft via XSS, HttpOnly cookies vs localStorage, CSP basics

### Part 3: MFA, OAuth/OIDC, Authorization (Advanced)
21. [21-mfa-totp-backup-codes.md](21-mfa-totp-backup-codes.md) - TOTP, secrets, backup codes, recovery
22. [22-passkeys-webauthn-intro.md](22-passkeys-webauthn-intro.md) - Passkeys/WebAuthn intro (conceptual + safe demo notes)
23. [23-oauth2-oidc-auth-code-pkce.md](23-oauth2-oidc-auth-code-pkce.md) - Authorization Code + PKCE, difference OAuth2 vs OIDC, claims/id_token
24. [24-login-with-google-concept.md](24-login-with-google-concept.md) - "Login with Google" in concept, state/nonce, redirect URIs
25. [25-auth-libraries-maintained.md](25-auth-libraries-maintained.md) - Check which libraries are currently maintained (e.g. Auth.js), what they do/don't do
26. [26-authorization-rbac-permissions.md](26-authorization-rbac-permissions.md) - RBAC, permissions, ownership checks, deny by default
27. [27-abac-policy-functions.md](27-abac-policy-functions.md) - ABAC intro, policy functions, attribute-based decisions
28. [28-guard-middleware-broken-access-idor.md](28-guard-middleware-broken-access-idor.md) - Guards, re-check in data layer, broken access control, IDOR

### Part 4: Multi-tenant, S2S, Next.js, Ops (Advanced+)
29. [29-multi-actor-separate-systems.md](29-multi-actor-separate-systems.md) - Three actor types in separate tables, separate secrets/audiences/cookie names/middleware; token isolation
30. [30-tenant-resolution-and-isolation.md](30-tenant-resolution-and-isolation.md) - Host/custom domain resolution, same email in different tenants, verify token tenantId vs request tenant
31. [31-super-admin-impersonation-audit.md](31-super-admin-impersonation-audit.md) - Safe impersonation, audit trail, scoping
32. [32-api-keys-service-to-service-webhooks.md](32-api-keys-service-to-service-webhooks.md) - API keys, S2S auth, webhook signature verification (HMAC)
33. [33-auth-in-nextjs.md](33-auth-in-nextjs.md) - Cookies in Server Components/Route Handlers, middleware protection (not enough alone), client guards UX only
34. [34-audit-logs-my-devices.md](34-audit-logs-my-devices.md) - Audit logs, security events, "my devices" session list with revoke
35. [35-real-world-patterns-pitfalls.md](35-real-world-patterns-pitfalls.md) - Customer per tenant, merchant dashboard with roles, super admin panel, password reset end-to-end + pitfalls

## Progress checklist (tick as you complete)
### Part 1
- [ ] 01-auth-vs-authz.md
- [ ] 02-identity-and-credentials.md
- [ ] 03-passwords-why-never-plaintext.md
- [ ] 04-slow-hashes-and-demo.md
- [ ] 05-password-rules-and-breached-checks.md
- [ ] 06-sessions-intro.md
- [ ] 07-session-stores-expiry-rotation.md
- [ ] 08-cookies-in-depth.md
- [ ] 09-sessions-vs-jwt-honest.md

### Part 2
- [ ] 10-jwt-structure-and-claims.md
- [ ] 11-jwt-signing-algorithms.md
- [ ] 12-access-refresh-tokens.md
- [ ] 13-registration-login-logout.md
- [ ] 14-email-verification.md
- [ ] 15-forgot-reset-password.md
- [ ] 16-change-password-logout-everywhere.md
- [ ] 17-brute-force-rate-limiting.md
- [ ] 18-user-enumeration-timing.md
- [ ] 19-session-fixation-csrf.md
- [ ] 20-token-theft-xss.md

### Part 3
- [ ] 21-mfa-totp-backup-codes.md
- [ ] 22-passkeys-webauthn-intro.md
- [ ] 23-oauth2-oidc-auth-code-pkce.md
- [ ] 24-login-with-google-concept.md
- [ ] 25-auth-libraries-maintained.md
- [ ] 26-authorization-rbac-permissions.md
- [ ] 27-abac-policy-functions.md
- [ ] 28-guard-middleware-broken-access-idor.md

### Part 4
- [ ] 29-multi-actor-separate-systems.md
- [ ] 30-tenant-resolution-and-isolation.md
- [ ] 31-super-admin-impersonation-audit.md
- [ ] 32-api-keys-service-to-service-webhooks.md
- [ ] 33-auth-in-nextjs.md
- [ ] 34-audit-logs-my-devices.md
- [ ] 35-real-world-patterns-pitfalls.md
