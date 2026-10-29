# 16: Change Password and Log Out Everywhere

> **Goal:** Securely change password while authenticated, invalidate all sessions/tokens, and implement "log out everywhere".

## 1) Simple explanation (like I'm 7)

When you change your password, anyone who was logged in on other devices should be kicked out - because maybe someone else has access. You stay logged in on the device you changed it on (or get a fresh session). And you must prove your old password first.

## 2) Real name (technical)

- **Change password (authenticated)**: Require current password verification, check new password against policy + breached list, hash with slow PHF, update, rotate current session or invalidate others.
- **Logout everywhere**: Invalidate all sessions/refresh token families for the user across all devices/sessions.
- **Session invalidation**: Delete from session store by userId.
- **Token revocation**: Revoke all refresh tokens/families.

> **OWASP:** Require current password, invalidate other sessions on password change, use strong new password.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/16-change-password-logout-everywhere.ts
import express from "express";
import crypto from "crypto";
import argon2 from "argon2";

const app = express();
app.use(express.json());

type User = { id: string; email: string; passwordHash: string };
type Session = { id: string; userId: string };
const users: User[] = [];
const sessions = new Map<string, Session>();

app.post("/change-password", async (req,res)=>{
  const sid = req.header("x-demo-session-id");
  const { currentPassword, newPassword } = req.body as any;
  if (!sid) return res.status(401).json({ error: "unauthenticated" });
  const s = sessions.get(sid);
  if (!s) return res.status(401).json({ error: "unauthenticated" });
  const user = users.find(u=>u.id===s.userId);
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  
  // Verify current password
  const ok = await argon2.verify(user.passwordHash, currentPassword);
  if (!ok) return res.status(400).json({ error: "Invalid current password" });
  
  // Update password
  user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  
  // Logout everywhere EXCEPT current session (common pattern) or all - be explicit
  for (const [k,v] of sessions.entries()) {
    if (v.userId === user.id && k !== sid) sessions.delete(k);
  }
  // Optionally rotate current session instead
  res.json({ message: "Password changed, other sessions logged out" });
});

app.post("/logout-everywhere", (req,res)=>{
  const sid = req.header("x-demo-session-id");
  const s = sid ? sessions.get(sid) : null;
  if (!s) return res.status(401).json({ error: "unauthenticated" });
  for (const [k,v] of sessions.entries()) if (v.userId===s.userId) sessions.delete(k);
  res.json({ message: "Logged out everywhere" });
});

app.listen(4100, ()=>console.log("Demo on 4100"));
```

**Notes:** Invalidate on password change/reset. Require current password. Consider rotating current session.

**Reset:** `rm auth-learn/api/src/16-change-password-logout-everywhere.ts`

**Next:** 17-brute-force-rate-limiting.md
