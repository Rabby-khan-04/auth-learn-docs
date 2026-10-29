# 06: Sessions - Server-Side Sessions, Session IDs, Entropy

> **Goal:** Understand server-side sessions, what session IDs are, why entropy matters, and storage considerations.

## 1) Simple explanation (like I'm 7)

Imagine a coat check at a restaurant.

- You hand your coat to the coat check person and get a **ticket** (session ID).
- The coat check person remembers which coat belongs to which ticket (session stored on server).
- When you show the ticket later, they give you back your coat (look up your session).
- If you lose the ticket, someone else can't claim your coat unless they guess your ticket number - so tickets must be random and hard to guess.
- When you leave, you return the ticket and they throw it away (logout).

## 2) Real name (technical)

- **Server-side session**: State stored on the server (in memory/DB/Redis) associated with a session identifier. Client only holds the ID (usually in a cookie).
- **Session ID**: A random, unguessable identifier that maps to session data on the server. Must be cryptographically secure.
- **Entropy**: Measure of randomness/unpredictability. Session IDs need high entropy to prevent guessing/brute force.
- **Session store**: Where sessions live - in-process memory (dev only), database, or distributed cache like Redis (prod).
- **Session fixation**: Attack where attacker sets a session ID before victim logs in (covered later).
- **Session hijacking**: Attacker steals session ID and impersonates user.

> **OWASP Session Management Cheat Sheet:** Use secure, unpredictable session IDs, store sessions server-side, use secure cookie attributes.

## 3) Example: complete, runnable code with comments

Local demo using in-memory store (dev only). Shows creating session, sending ID in cookie concept, looking up.

Create `src/06-sessions-inmemory-demo.ts`:
```ts
// auth-learn/api/src/06-sessions-inmemory-demo.ts
// DEMO: Server-side sessions (in-memory) - DEV ONLY
// In prod use DB/Redis

import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

// In-memory session store - NOT for prod (lost on restart, no scaling)
type Session = { userId: string; createdAt: number; lastSeen: number };
const sessions = new Map<string, Session>();

function generateSessionId(): string {
  // Cryptographically secure random bytes
  return crypto.randomBytes(32).toString("hex"); // 256 bits of entropy
}

app.post("/login-session", (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: "username required" });
  
  // Create session
  const sid = generateSessionId();
  sessions.set(sid, {
    userId: username,
    createdAt: Date.now(),
    lastSeen: Date.now(),
  });
  
  // In real app, set HttpOnly Secure SameSite cookie
  // For demo we return it so you can see
  res.json({
    message: "Session created (demo)",
    sessionId: sid,
    note: "In prod send as HttpOnly Secure SameSite cookie, never in JSON to localStorage",
  });
});

app.get("/me-session", (req, res) => {
  // In real app, read from cookie
  const sid = req.header("x-demo-session-id");
  if (!sid) return res.status(401).json({ error: "No session" });
  
  const session = sessions.get(sid);
  if (!session) return res.status(401).json({ error: "Invalid/expired session" });
  
  session.lastSeen = Date.now();
  res.json({ userId: session.userId, createdAt: session.createdAt });
});

app.post("/logout-session", (req, res) => {
  const sid = req.header("x-demo-session-id");
  if (sid) sessions.delete(sid);
  res.json({ message: "Logged out (session destroyed)" });
});

app.listen(4030, () => {
  console.log("Demo listening on http://localhost:4030");
});
```

Run:
```bash
cd auth-learn/api
npx tsx src/06-sessions-inmemory-demo.ts
```

Test:
```bash
# Login
curl -i -X POST "http://localhost:4030/login-session" -H "content-type: application/json" -d '{"username":"alice"}'
# Copy sessionId from response

# Use session
curl -i -H "x-demo-session-id: <PASTE_SESSION_ID>" "http://localhost:4030/me-session"

# Logout
curl -i -X POST "http://localhost:4030/logout-session" -H "x-demo-session-id: <PASTE_SESSION_ID>"

# Try again
curl -i -H "x-demo-session-id: <PASTE_SESSION_ID>" "http://localhost:4030/me-session"
```

## 4) What I should see

- Login returns sessionId (256-bit hex)
- `/me-session` works with valid sessionId
- Logout deletes session, subsequent request fails
- Session data stays on server

## 5) In a real multi-tenant e-commerce platform: one concrete example

For a customer on tenant `t1`:
- On login, create server-side session with `userId`, `actorType: "customer"`, `tenantId: "t1"`, etc.
- Send session ID as `HttpOnly; Secure; SameSite=Lax` cookie scoped appropriately
- Each request looks up session, checks tenant matches request tenant
- Different actor types can have separate session stores/cookie names to prevent cross-auth leakage

## 6) When to use it and when NOT to

**Use:**
- Server-side sessions for traditional web apps where you can control cookies
- High-entropy session IDs (>= 128 bits, preferably 256)
- Secure storage (DB/Redis) in prod
- Proper expiry and rotation

**When NOT to:**
- Don't store session data in the ID itself
- Don't use predictable IDs (sequential)
- Don't store sessions only in memory in multi-instance prod
- Don't put session data in localStorage

## 7) Common mistakes

- **Low entropy IDs** - guessable
- **In-memory only in prod** - lost on restart, doesn't scale
- **Not rotating on privilege change/login** - session fixation risk
- **Long-lived sessions without rotation** - increases risk if stolen
- **Sending ID in URL** - leaks in logs/referrers

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Add absolute and idle expiry. Reject if idle > 60s or absolute > 5 min.

**Hint:**
```ts
const IDLE = 60_000, ABS = 5*60_000;
if (Date.now() - session.lastSeen > IDLE || Date.now() - session.createdAt > ABS) { sessions.delete(sid); return res.status(401).json({error:"expired"}); }
```

**Reset steps:**
```bash
rm auth-learn/api/src/06-sessions-inmemory-demo.ts
```

## 9) Next

Next chapter: [07-session-stores-expiry-rotation.md](07-session-stores-expiry-rotation.md) - DB vs Redis stores, expiry, rotation after login, logout.
