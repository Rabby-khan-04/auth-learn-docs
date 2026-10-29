# 27: ABAC and Policy Functions

> **Goal:** Intro to ABAC, policy functions, attribute-based decisions.

## 1) Simple explanation (like I'm 7)

RBAC is "based on your role". ABAC is "based on lots of facts" - like time of day, location, how much money, if it's your own stuff, etc. More flexible but more complex.

## 2) Real name (technical)

- **ABAC (Attribute-Based Access Control)**: Decisions based on attributes of user, resource, action, environment
- **Policy function**: Pure function that returns allow/deny based on context
- **PDP/PEP**: Policy Decision Point / Policy Enforcement Point (concepts)
- **Deny by default**: Always default deny

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/27-abac-policy.ts
type Context = { user: any; resource: any; action: string; env: any };

function canEditProduct(ctx: Context): boolean {
  // Deny by default
  if (!ctx.user) return false;
  // Owner can edit
  if (ctx.resource.ownerId === ctx.user.id) return true;
  // Merchant admin can edit in same tenant
  if (ctx.user.role === "merchant_admin" && ctx.resource.tenantId === ctx.user.tenantId) return true;
  return false;
}

console.log(canEditProduct({ user:{id:"1",role:"merchant"}, resource:{ownerId:"1",tenantId:"t1"}, action:"edit", env:{} }));
```

**Reset:** `rm auth-learn/api/src/27-abac-policy.ts`

**Next:** 28-guard-middleware-broken-access-idor.md
