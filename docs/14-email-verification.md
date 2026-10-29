# 14: Email Verification

> **Goal:** Learn secure email verification with tokens, expiry, single-use, and safe flows.

## 1) Simple explanation (like I'm 7)

When you sign up with email, we send a special one-time link/code to prove you own that email. Like getting a secret postcard in the mail - only you can see it. The link has a random code that only works once and expires soon.

## 2) Real name (technical)

- **Verification token**: Cryptographically random, unguessable token
- **Single-use**: Mark token as used after verification
- **Expiry**: Tokens expire quickly (e.g., 15-60 min)
- **Store hashed tokens**: Like passwords, store hash of token in DB, send plain token in email/link
- **Prevent enumeration**: Don't reveal if email exists when resending
- **Idempotency**: Handle repeated clicks safely

> **OWASP:** Use secure random tokens, store hashed, single-use, time-limited.

## 3) Example: complete, runnable code with comments

Local demo. Token stored hashed (sha256) - in prod could use same approach; tokens are high-entropy random.

Create `src/14-email-verification.ts`:
```ts
// auth-learn/api/src/14-email-verification.ts
// DEMO: Email verification (local only)

import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

type User = { id: string; email: string; verified: boolean };
type VToken = { tokenHash: string; userId: string; expiresAt: number; used: boolean };
const users: User[] = [];
const tokens: VToken[] = [];

function hashToken(t: string) { return crypto.createHash("sha256").update(t).digest("hex"); }
function newToken() { return crypto.randomBytes(32).toString("hex"); }

app.post("/register", (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "email required" });
  const user = { id: crypto.randomUUID(), email, verified: false };
  users.push(user);
  const token = newToken();
  tokens.push({ tokenHash: hashToken(token), userId: user.id, expiresAt: Date.now() + 15*60*1000, used: false });
  // In prod send email with link containing token
  res.json({ message: "Registered, verification sent (demo)", verificationToken: token });
});

app.post("/verify-email", (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) return res.status(400).json({ error: "token required" });
  const h = hashToken(token);
  const vt = tokens.find(t => t.tokenHash === h);
  if (!vt) return res.status(400).json({ error: "Invalid or expired token" });
  if (vt.used) return res.status(400).json({ error: "Token already used" });
  if (Date.now() > vt.expiresAt) return res.status(400).json({ error: "Invalid or expired token" });
  const user = users.find(u => u.id === vt.userId);
  if (!user) return res.status(400).json({ error: "Invalid or expired token" });
  vt.used = true;
  user.verified = true;
  res.json({ message: "Email verified" });
});

app.post("/resend-verification", (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: "If account exists, verification sent" });
  // Don't reveal if exists
  res.json({ message: "If account exists, verification sent" });
});

app.listen(4080, () => {
  console.log("Demo listening on http://localhost:4080");
});
```

Run and test.

## 4) What I should see

- Token returned in demo (would be emailed in prod)
- Verification marks user verified, token becomes used
- Reusing token fails

## 5) In a real multi-tenant e-commerce platform

Verify emails for customers/merchants; super admins might have different flow. Always store token hash, single-use, expire quickly.

## 6-9) Follow template (concise)

**When to use:** verify email ownership. **Don't:** put tokens in URLs that leak in logs carelessly, don't allow reuse.

**Common mistakes:** storing plain tokens, no expiry, reusable tokens.

**Exercise:** Add expiry check.

**Reset:** `rm auth-learn/api/src/14-email-verification.ts`

**Next:** 15-forgot-reset-password.md
