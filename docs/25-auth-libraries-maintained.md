# 25: Auth Libraries - What's Currently Maintained

> **Goal:** Check which auth libraries are currently maintained, what they do/don't do, and when to build vs use a library.

## 1) Simple explanation (like I'm 7)

You can build a login system yourself to learn (like we're doing), or use a pre-made kit. But some kits are no longer maintained - like using old, broken tools. We need to pick tools that are still getting updates and fixes.

## 2) Real name (technical)

Before recommending libraries, check maintenance status:
- **Auth.js (formerly NextAuth.js)**: The project has announced it's now part of [Better Auth](https://better-auth.com/). Check current state - as of recent announcements, Auth.js is transitioning/joining Better Auth. Always verify current docs.
- **Better Auth**: A modern, framework-agnostic auth library gaining traction.
- **Lucia Auth**: Was popular but project direction changed over time - verify current status before using.
- **Passport.js**: Older middleware, still exists but many prefer modern alternatives.
- **Other options**: Framework-specific solutions vary.

> **Rule:** Never recommend unmaintained libraries. Always check official docs/changelogs/GitHub activity before recommending.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/25-auth-libs-check.ts
console.log("Maintenance check (as of knowledge):");
console.log("- Auth.js: now part of Better Auth (check https://authjs.dev/ for current status)");
console.log("- Better Auth: actively maintained modern alternative");
console.log("- Always verify: last release, security updates, issue activity");
console.log("\nWhat libraries do: session management, OAuth flows, adapters");
console.log("What they DON'T do: fix bad business logic, replace secure password storage practices");
```

## 4) What I should see

Awareness that Auth.js joined Better Auth - need to check current recommendations.

## 5) In a real multi-tenant e-commerce platform

If using a library, ensure it supports:
- Multiple auth systems/tenants
- Separate user types
- Custom session/cookie handling
- Extensibility for audit logs

## 6) When to use it and when NOT to

**Use:** When you need OAuth/OIDC quickly and library is well-maintained and extensible.
**Don't:** Blindly trust - understand what it does. For learning, build first (as we're doing).

## 7) Common mistakes

- Using unmaintained libraries
- Assuming library handles all security
- Not reading security docs

## 8) Try it yourself

**Exercise:** Check current Auth.js/Better Auth docs and note any migration guidance.

**Reset:** `rm auth-learn/api/src/25-auth-libs-check.ts`

**Next:** Batch 9 (26-28)
