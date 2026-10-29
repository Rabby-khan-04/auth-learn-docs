# 34: Audit Logs, Security Events, "My Devices"

> **Goal:** Audit logs, security events, session list with revoke.

## 1) Simple explanation (like I'm 7)

We need to keep a diary of important security events - like "Alice logged in from phone", "Password changed", "Someone tried wrong password". Users can see "My Devices" and log out devices they don't recognize.

## 2) Real name (technical)

- **Audit log**: Immutable record of security-relevant events (who, when, what, IP, user agent)
- **Security events**: Login success/failure, password change, MFA, impersonation
- **Session listing**: Show active sessions with device info
- **Remote revoke**: Invalidate specific session

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/34-audit-devices.ts
import express from "express";
const app = express();

const audit: any[] = [];
const sessions = new Map<string, any>();

app.post("/login", (req:any,res:any)=>{
  // ... auth ...
  audit.push({ event: "login_success", userId: "alice", ip: req.ip, at: new Date() });
  res.json({ sessionId: "..." });
});

app.get("/my-devices", (req:any,res:any)=>{
  // List sessions for user
  const devices = Array.from(sessions.values()).filter(s=>s.userId===req.user.id);
  res.json({ devices });
});

app.delete("/sessions/:id", (req:any,res:any)=>{
  sessions.delete(req.params.id);
  audit.push({ event: "session_revoked", userId: req.user.id, sessionId: req.params.id, at: new Date() });
  res.json({ message: "revoked" });
});

app.listen(4180, ()=>console.log("Demo on 4180"));
```

**Reset:** `rm auth-learn/api/src/34-audit-devices.ts`

**Next:** Batch 11 end (35)
