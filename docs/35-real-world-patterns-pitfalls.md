# 35: Real-World Patterns and Pitfalls

> **Goal:** Put it together - customer per tenant, merchant dashboard with roles, super admin panel, password reset end-to-end, pitfalls.

## 1) Simple explanation (like I'm 7)

Time to see the whole picture with all three actor types in a multi-tenant shop.

## 2) Real name (technical)

### Pattern 1: Customer login per tenant
- Tenant resolved from host
- Customer auth system only
- Session cookie scoped to tenant
- Verify token tenantId matches request tenant

### Pattern 2: Merchant dashboard with roles
- Separate merchant auth system
- Roles/permissions (RBAC)
- Ownership checks (merchant can only manage their shop)
- Tenant scoped

### Pattern 3: Super admin panel
- Separate super admin auth system (separate secrets)
- Stricter MFA, shorter sessions
- Audit all actions
- Safe impersonation with trail

### Pattern 4: Password reset end-to-end
- Forgot password (generic response)
- Hashed single-use expiring token
- Reset password hashes with Argon2id
- Invalidate all sessions
- Check breached passwords

## 3) Common pitfalls checklist
- [ ] Using same auth system for all actors
- [ ] Storing passwords in plaintext
- [ ] JWT in localStorage
- [ ] No session rotation
- [ ] No CSRF protection where needed
- [ ] Trusting client for authorization
- [ ] Different error messages enabling enumeration
- [ ] Accepting alg:none
- [ ] No rate limiting
- [ ] Long-lived tokens without rotation
- [ ] Missing tenant isolation
- [ ] No audit trail for privileged actions

## 4) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/35-patterns-summary.ts
console.log("Multi-tenant 3-actor pattern:");
console.log("1. Customer auth: separate system, per-tenant, ownership checks");
console.log("2. Merchant auth: separate system, RBAC + ownership");
console.log("3. Super admin: separate system, MFA, audit, impersonation");
console.log("Always: deny by default, re-check in data layer, tenant isolation");
```

**Reset:** `rm auth-learn/api/src/35-patterns-summary.ts`

## 5) Next

All 35 chapters complete. Review the full docs/ and test examples as needed.
