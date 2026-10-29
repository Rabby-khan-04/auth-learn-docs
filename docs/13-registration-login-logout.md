# 13: Registration, Login, Logout Flows

> **Goal:** Learn correct order for registration, login, and logout with secure password handling, avoiding user enumeration, and proper session/token invalidation.

## 1) Simple explanation (like I'm 7)

- **Registration**: Sign up - create your identity, store proof (hashed password) securely. Don't store the password as-is.
- **Login**: Prove who you are - check credentials. If correct, give you a way back (session ID in cookie or tokens). On login, **rotate** sessions/tokens (new ones, old ones invalid).
- **Logout**: Destroy your way back. Make sure it's gone so nobody else can use it.

Order matters - verify before granting access.

## 2) Real name (technical)

- **Registration**: Create principal identity, validate email/username uniqueness, enforce password policy + breached check, hash password with slow PHF + salt, store safely.
- **Login**: Identify by identifier, verify credential against hash, handle failures consistently (avoid enumeration), on success create authenticated session/tokens, rotate on privilege changes.
- **Logout**: Invalidate session on server (delete from store) or revoke tokens (blocklist + rotation), clear cookies.
- **User enumeration**: Don't reveal whether email exists via different messages/timings.
- **Credential verification**: Use constant-time safe comparisons where possible; slow hash comparison is inherently timing-different but we must be careful about messages.

> **OWASP Authentication Cheat Sheet:** Use generic error messages, hash passwords properly, rotate sessions on login, invalidate on logout.

## 3) Example: complete, runnable code with comments

Local demo with in-memory store, using argon2 for passwords (from chapter 04). **DANGER DEMO** parts labeled.

Create `src/13-registration-login-logout.ts`:
```ts
// auth-learn/api/src/13-registration-login-logout.ts
// DEMO: Registration/Login/Logout (local only)

import express from "express";
import crypto from "crypto";
import argon2 from "argon2";

const app = express();
app.use(express.json());

type User = { id: string; email: string; passwordHash: string; actorType: "customer" | "merchant" | "super_admin"; tenantId: string };
const users: User[] = [];

type Session = { userId: string; actorType: string; tenantId: string; createdAt: number };
const sessions = new Map<string, Session>();

function newSid() { return crypto.randomBytes(32).toString("hex"); }

app.post("/register", async (req, res) => {
  const { email, password, actorType = "customer", tenantId = "t1" } = req.body as any;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  
  // Check if exists (but be careful about enumeration in responses - we'll be generic on login)
  if (users.find(u => u.email === email && u.actorType === actorType && u.tenantId === tenantId)) {
    // Still be generic to avoid leaking existence? Or say "try login" - be consistent
    return res.status(400).json({ error: "Invalid request" });
  }
  
  // Hash password with Argon2id
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  
  const user: User = { id: crypto.randomUUID(), email, passwordHash, actorType, tenantId };
  users.push(user);
  
  res.json({ message: "Registered (demo)", userId: user.id });
});

app.post("/login", async (req, res) => {
  const { email, password, actorType = "customer", tenantId = "t1" } = req.body as any;
  if (!email || !password) return res.status(400).json({ error: "Invalid credentials" });
  
  const user = users.find(u => u.email === email && u.actorType === actorType && u.tenantId === tenantId);
  if (!user) {
    // Generic message to avoid enumeration
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  try {
    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  // ROTATE: create new session (invalidate old if existed - not tracked here)
  const sid = newSid();
  sessions.set(sid, { userId: user.id, actorType: user.actorType, tenantId: user.tenantId, createdAt: Date.now() });
  
  res.json({ message: "Logged in", sessionId: sid, actorType: user.actorType, tenantId: user.tenantId });
});

app.get("/me", (req, res) => {
  const sid = req.header("x-demo-session-id");
  if (!sid) return res.status(401).json({ error: "unauthenticated" });
  const s = sessions.get(sid);
  if (!s) return res.status(401).json({ error: "unauthenticated" });
  res.json({ userId: s.userId, actorType: s.actorType, tenantId: s.tenantId });
});

app.post("/logout", (req, res) => {
  const sid = req.header("x-demo-session-id");
  if (sid) sessions.delete(sid);
  res.json({ message: "Logged out" });
});

app.listen(4070, () => {
  console.log("Demo listening on http://localhost:4070");
});
```

Run:
```bash
cd auth-learn/api
npx tsx src/13-registration-login-logout.ts
```

Test:
```bash
# Register
curl -s -X POST "http://localhost:4070/register" -H "content-type: application/json" -d '{"email":"alice@example.test","password":"CorrectHorseBatteryStaple!","actorType":"customer","tenantId":"t1"}'
# Login
curl -s -X POST "http://localhost:4070/login" -H "content-type: application/json" -d '{"email":"alice@example.test","password":"CorrectHorseBatteryStaple!","actorType":"customer","tenantId":"t1"}'
# Use session
curl -s -H "x-demo-session-id: <SID>" "http://localhost:4070/me"
# Logout
curl -s -X POST "http://localhost:4070/logout" -H "x-demo-session-id: <SID>"
```

## 4) What I should see

- Registration stores hashed password (not plaintext)
- Login with wrong password gives same generic error as unknown user
- New session on login
- Logout destroys session

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Customer registration** on tenant `shoes.example.com`: create in customer auth system only, hash with Argon2id
- **Separate systems**: Merchant registration goes to merchant auth system (separate DB/table/secrets)
- **Login rotation**: On successful login, rotate session ID; on password change, rotate and logout everywhere
- **Logout**: Clear HttpOnly cookie and delete server session

## 6) When to use it and when NOT to

**Use:**
- Slow hash for passwords
- Generic errors on login
- Rotate on login
- Invalidate on logout

**When NOT to:**
- Don't reveal user existence
- Don't store plaintext
- Don't skip rotation

## 7) Common mistakes

- **Different error messages** (enumeration)
- **No rotation on login**
- **Not hashing passwords**
- **Forgetting to logout on all devices**

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Add a check - if user exists but wrong actorType/tenantId, still return generic "Invalid credentials".

**Hint:** As shown above.

**Reset steps:**
```bash
rm auth-learn/api/src/13-registration-login-logout.ts
```

## 9) Next

Next chapter: [14-email-verification.md](14-email-verification.md) - Tokens, expiry, single-use, verification flow.
