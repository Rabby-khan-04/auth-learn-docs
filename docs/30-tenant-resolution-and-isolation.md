# 30: Tenant Resolution, Isolation, Same Email Across Tenants

> **Goal:** Resolve tenant from host/custom domain, allow same email in different tenants, verify token tenantId.

## 1) Simple explanation (like I'm 7)

In a shopping mall with many stores (tenants), store A and store B are separate. Same person might shop at both. We need to know "which store are you shopping at?" from the website address. And we must check your ticket is for THIS store.

## 2) Real name (technical)

- **Tenant resolution**: From hostname (subdomain/custom domain), headers, path, or token
- **Tenant isolation**: Data scoped by tenantId, auth scoped by tenant
- **Same email different tenants**: Email is unique per (tenant, actor type) not globally unique across all tenants
- **Token tenant binding**: Token must contain tenantId and must match request tenant
- **Cross-tenant access**: Must be prevented

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/30-tenant-resolution.ts
import express from "express";
const app = express();

function resolveTenant(req:any){
  const host = req.headers.host || "";
  // e.g., shoes.example.com -> tenant from mapping
  if (host.includes("shoes")) return "t1";
  if (host.includes("bags")) return "t2";
  return null;
}

app.use((req:any,res:any,next:any)=>{
  req.tenantId = resolveTenant(req);
  if (!req.tenantId) return res.status(400).json({error:"unknown tenant"});
  next();
});

app.get("/test", (req:any,res:any)=>{
  res.json({ tenantId: req.tenantId });
});

app.listen(4160, ()=>console.log("Demo on 4160"));
```

**Reset:** `rm auth-learn/api/src/30-tenant-resolution.ts`

**Next:** 31-super-admin-impersonation-audit.md
