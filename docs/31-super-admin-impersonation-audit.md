# 31: Super Admin Impersonation with Audit Trail

> **Goal:** Safe impersonation, audit trail, scoping.

## 1) Simple explanation (like I'm 7)

Sometimes support needs to help a customer. Super admin can "become" that customer temporarily to see the problem, but:
- Must ask permission/log it
- Must be obvious they're impersonating
- Must be able to stop impersonation
- Everything they do must be recorded

## 2) Real name (technical)

- **Impersonation**: Temporarily act as another user
- **Audit trail**: Log who impersonated whom, when, why, actions taken
- **Short-lived**: Impersonation session expires quickly
- **Clear indication**: UI shows "Impersonating user X"
- **Scoped**: Limited permissions
- **Non-reversible actions**: Be very careful

> **Critical:** All impersonation must be audited. Only authorized super admins.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/31-impersonation-audit.ts
import express from "express";
const app = express();

const auditLog: any[] = [];

app.post("/impersonate", (req:any,res:any)=>{
  const { targetUserId, reason } = req.body;
  const adminId = req.user.id;
  // Create short-lived impersonation session
  const impSession = { adminId, targetUserId, expiresAt: Date.now()+10*60*1000 };
  auditLog.push({ action: "impersonate_start", adminId, targetUserId, reason, at: new Date() });
  res.json({ impersonationToken: "demo", expiresIn: 600 });
});

app.listen(4170, ()=>console.log("Demo on 4170"));
```

**Reset:** `rm auth-learn/api/src/31-impersonation-audit.ts`

**Next:** Batch 11 (32-34)
