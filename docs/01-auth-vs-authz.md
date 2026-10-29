# 01: Authentication vs Authorization, Identity, Credentials, Factors

> **Goal:** Understand the difference between "who are you?" (authentication) and "what can you do?" (authorization), plus identity, credentials, and factors.

## 1) Simple explanation (like I'm 7)

Imagine a club with a bouncer.

- **Authentication (AuthN)** is when the bouncer checks your ID card to figure out *who you are*. They want to confirm you are the person you say you are.
- **Authorization (AuthZ)** is when the bouncer checks the guest list/your wristband to figure out *what you're allowed to do*. Just because you are *identified* doesn't mean you can go backstage.
- **Identity** is "who" the person/system is (like "Alex").
- **Credentials** are the proof you present (like showing your ID card).
- **Factors** are *types* of proof (something you know, have, or are).

## 2) Real name (technical)

- **Authentication**: The process of verifying a principal's identity (proving the claim "I am user X").
- **Authorization**: The process of determining if an authenticated (or sometimes anonymous) principal is permitted to perform an action on a resource (access control).
- **Identity**: A set of attributes that uniquely describe a principal (user, service, device) within a system/domain.
- **Credentials**: Information presented to prove identity (password, token, certificate, etc.). Credentials can be secret or verifiable.
- **Authentication factors**: Categories of evidence - *knowledge* (something you know), *possession* (something you have), *inherence* (something you are). Multi-factor authentication (MFA) combines factors.

> **Note:** Authentication must usually happen before authorization in most flows, but the terms are different. Never confuse them.

## 3) Example: complete, runnable code with comments

We'll make a tiny, safe Express demo inside `auth-learn/api` to show AuthN vs AuthZ. This runs locally only.

### Setup (local)
```bash
cd auth-learn/api
cp .env.example .env  # already done
npm install  # if not installed
```

### Code
Create `src/01-authn-authz-demo.ts`:
```ts
// auth-learn/api/src/01-authn-authz-demo.ts
// DEMO: Authentication vs Authorization (local only)
// Comments on important lines.

import express from "express";

const app = express();
app.use(express.json());

// FAKE "user store" for demo only (never do this in prod)
// In reality identity/credentials live in DB with hashed passwords
type User = { id: string; username: string; role: "customer" | "merchant" | "super_admin" };
const users: User[] = [
  { id: "u1", username: "alice", role: "customer" },
  { id: "u2", username: "morgan", role: "merchant" },
  { id: "u3", username: "root", role: "super_admin" },
];

// (1) AUTHENTICATION: "who are you?"
// For demo, we pretend we verified identity by a header.
// In reality you'd verify credentials (password/session/token) securely.
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  // DANGER DEMO NOTE: checking a header is NOT secure auth - just to show separation
  const username = req.header("x-demo-username");
  if (!username) {
    return res.status(401).json({ error: "Unauthenticated: missing identity claim" });
  }
  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Unauthenticated: unknown identity" });
  }
  // Attach identity to request after "authenticating"
  (req as any).user = user;
  next();
}

// (2) AUTHORIZATION: "what can you do?"
// Deny by default - check role/permission before acting
function authorize(roles: Array<User["role"]>) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = (req as any).user as User | undefined;
    if (!user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: not allowed for this role" });
    }
    next();
  };
}

// Public endpoint - no auth needed
app.get("/public", (_req, res) => {
  res.json({ message: "Hello from public" });
});

// Authenticated only - need to prove identity
app.get("/me", authenticate, (req, res) => {
  res.json({ message: "Authenticated", user: (req as any).user });
});

// Authorized for merchant or super_admin only
app.get("/merchant-dashboard", authenticate, authorize(["merchant", "super_admin"]), (req, res) => {
  res.json({ message: "Welcome to merchant area", user: (req as any).user });
});

// Authorized for super_admin only
app.get("/admin", authenticate, authorize(["super_admin"]), (req, res) => {
  res.json({ message: "Welcome to super admin area", user: (req as any).user });
});

app.listen(4010, () => {
  console.log("Demo listening on http://localhost:4010");
});
```

Run it:
```bash
cd auth-learn/api
npx tsx src/01-authn-authz-demo.ts
```

### Test with curl (separate terminal)
```bash
# Public - works
curl -i "http://localhost:4010/public"

# Authenticated but no role check
curl -i -H "x-demo-username: alice" "http://localhost:4010/me"

# Try merchant dashboard as customer (authenticated but not authorized)
curl -i -H "x-demo-username: alice" "http://localhost:4010/merchant-dashboard"

# As merchant - authorized
curl -i -H "x-demo-username: morgan" "http://localhost:4010/merchant-dashboard"

# As super admin
curl -i -H "x-demo-username: root" "http://localhost:4010/admin"

# No identity - unauthenticated
curl -i "http://localhost:4010/me"
```

## 4) What I should see

- `/public` -> 200, no auth needed
- `/me` with `x-demo-username: alice` -> 200 with user info (authenticated)
- `/merchant-dashboard` as `alice` (customer) -> 401/403? With our code: after authenticate passes, authorize checks roles - `alice` has role `customer`, allowed roles are `["merchant", "super_admin"]` so it returns **403 Forbidden: not allowed for this role** (authenticated but not authorized)
- `/merchant-dashboard` as `morgan` -> 200 (authenticated and authorized)
- `/admin` as `root` -> 200, as `morgan` -> 403
- `/me` without header -> **401 Unauthenticated: missing identity claim**

This shows: AuthN = identity verified; AuthZ = permission/role checked.

## 5) In a real multi-tenant e-commerce platform: one concrete example

Imagine a multi-tenant marketplace:
- **Customer** logs into tenant `shoes.example.com` as `alice` - **AuthN** verifies it's really Alice for that tenant/customer auth system.
- **AuthZ** decides Alice can view her own orders, but she cannot view another customer's orders (ownership check) and cannot access the merchant dashboard.
- **Merchant user** `morgan` logs into the merchant auth system for tenant `shoes.example.com` - AuthN confirms identity in *merchant* user store (separate from customers). AuthZ allows managing products/prices for that merchant's shop in that tenant, but not accessing super admin functions.
- **Super admin** logs into super admin auth system - AuthN in separate system with separate secrets; AuthZ allows platform-wide operations with audit trail.

**Critical:** These must be *separate authentication systems* (separate tables, secrets, audiences, cookie names, middleware). A token/session from customer auth must never be accepted by merchant/super admin auth.

## 6) When to use it and when NOT to

**Use:**
- Always separate AuthN and AuthZ in your design (different concerns, different bugs)
- AuthN first to establish identity/principal
- AuthZ after with deny-by-default and least privilege
- Check authorization at the data layer too (not just UI/middleware)

**When NOT to:**
- Don't treat "logged in" as "can do everything" (that's AuthZ failure)
- Don't do authorization checks based on client-sent data without verifying identity
- Don't mix auth systems for different actor types

## 7) Common mistakes

- **Confusing the terms** - saying "auth" for both; be precise.
- **Authenticating after authorizing** - backwards.
- **Role-only checks without ownership** - e.g., "merchant" role can edit *any* merchant's product (IDOR).
- **Trusting headers/client** - in our demo header is fake; in reality verify tokens/sessions securely.
- **Single auth system for all actor types** - dangerous in multi-tenant with different privileges; better separate per actor type as required.
- **Authorizing in UI only** - must re-check on server/data layer.

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Add a new role `support` that can view `/me` and `/merchant-dashboard` but *not* `/admin`. Show AuthN still works, AuthZ blocks admin.

**Hint:**
1. Add `support` to the `role` union
2. Add a support user to `users` array
3. Update `authorize` calls - allow `support` for merchant-dashboard
4. Test with curl

**Reset steps:**
```bash
# Stop the demo (Ctrl+C) and remove it
rm auth-learn/api/src/01-authn-authz-demo.ts
```

## 9) Next

Next chapter: [02-identity-and-credentials.md](02-identity-and-credentials.md) - Principals, identifiers, credentials, factor types, and MFA intro.
