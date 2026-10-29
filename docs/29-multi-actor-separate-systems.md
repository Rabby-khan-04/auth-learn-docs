# 29: Multi-Actor Auth - Three Separate Systems

> **Goal:** Design three separate auth systems for super admins, merchant users, customers with isolation.

## 1) Simple explanation (like I'm 7)

You need three different buildings with different keys:
- **Customer building**: Only customers can enter, different key
- **Merchant building**: Only merchants, different key
- **Super admin building**: Only super admins, different key

If someone tries to use a customer key at merchant door, it won't work.

## 2) Real name (technical)

Requirements:
- **Separate tables/stores** per actor type
- **Separate secrets** for signing/verifying
- **Separate audiences/issuers** in JWTs
- **Separate cookie names** (e.g., `__Host-cust_session`, `__Host-merc_session`, `__Host-sadmin_session`)
- **Separate middleware** per auth system
- **Token isolation** - tokens from one system never accepted by another

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/29-multi-actor-isolation.ts
// Concept: separate auth systems

const authSystems = {
  customer: { table: "customers", secret: "CUST_SECRET", cookie: "__Host-cust_session", aud: "customer-api" },
  merchant: { table: "merchants", secret: "MERC_SECRET", cookie: "__Host-merc_session", aud: "merchant-api" },
  super_admin: { table: "super_admins", secret: "SADMIN_SECRET", cookie: "__Host-sadmin_session", aud: "admin-api" }
};

// Middleware checks must verify correct system
function authCustomer(req:any,res:any,next:any){ /* verify with customer secret/aud */ next(); }
function authMerchant(req:any,res:any,next:any){ /* verify with merchant secret/aud */ next(); }
function authSuperAdmin(req:any,res:any,next:any){ /* verify with super_admin secret/aud */ next(); }

console.log(authSystems);
```

**Reset:** `rm auth-learn/api/src/29-multi-actor-isolation.ts`

**Next:** 30-tenant-resolution-and-isolation.md
