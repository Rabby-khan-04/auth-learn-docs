# 15: Forgot Password and Reset Password

> **Goal:** Implement secure password reset with single-use expiring hashed tokens, preventing user enumeration.

## 1) Simple explanation (like I'm 7)

If you forget password, we send a one-time key to your email. Use it once to set a new password. The key expires. We don't tell anyone "that email doesn't exist" - we just say "if it exists, we sent an email" to avoid giving away info.

## 2) Real name (technical)

- **Password reset flow**: Generate random token, store hash + userId + expiry + used flag, email plain token, on reset verify hash/expiry/used, update password (hash with slow PHF), invalidate all sessions/tokens, mark token used.
- **Enumeration prevention**: Same response regardless of whether email exists.
- **Token security**: High entropy, hashed in DB, single-use, short expiry (e.g., 15-60 min).
- **Invalidate sessions**: On password reset/change, log out all devices.

> **OWASP Forgot Password Cheat Sheet:** Use secure tokens, don't leak user existence, invalidate old sessions.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/15-forgot-reset-password.ts
import express from "express";
import crypto from "crypto";
import argon2 from "argon2";

const app = express();
app.use(express.json());

type User = { id: string; email: string; passwordHash: string };
type RToken = { tokenHash: string; userId: string; expiresAt: number; used: boolean };
const users: User[] = [];
const rtokens: RToken[] = [];
const sessions = new Map<string, any>();

function hashToken(t:string){return crypto.createHash("sha256").update(t).digest("hex");}
function newToken(){return crypto.randomBytes(32).toString("hex");}

app.post("/forgot-password", (req,res)=>{
  const { email } = req.body as {email?:string};
  // Always same response
  const user = users.find(u=>u.email===email);
  if (user) {
    const token = newToken();
    rtokens.push({ tokenHash: hashToken(token), userId: user.id, expiresAt: Date.now()+15*60*1000, used:false });
    // email token in prod
    return res.json({ message: "If an account exists, a reset link has been sent", resetToken: token });
  }
  return res.json({ message: "If an account exists, a reset link has been sent" });
});

app.post("/reset-password", async (req,res)=>{
  const { token, newPassword } = req.body as {token?:string,newPassword?:string};
  if (!token || !newPassword) return res.status(400).json({ error: "invalid request" });
  const h = hashToken(token);
  const rt = rtokens.find(t=>t.tokenHash===h);
  if (!rt || rt.used || Date.now()>rt.expiresAt) return res.status(400).json({ error: "Invalid or expired token" });
  const user = users.find(u=>u.id===rt.userId);
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  rt.used = true;
  user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  // Invalidate all sessions for user
  for (const [k,v] of sessions.entries()) if (v.userId===user.id) sessions.delete(k);
  res.json({ message: "Password reset successful" });
});

app.listen(4090, ()=>console.log("Demo on 4090"));
```

**Test:** forgot-password (returns generic), reset with token sets new hash, old sessions cleared.

**When not to:** leak existence, reuse tokens, skip session invalidation.

**Common mistakes:** storing plain tokens, different responses, not hashing new password.

**Reset:** `rm auth-learn/api/src/15-forgot-reset-password.ts`

**Next:** Batch 6 (16-18)
