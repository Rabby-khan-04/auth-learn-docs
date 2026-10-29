# 07: Session Stores, Expiry, Rotation

> **Goal:** Compare session stores (DB vs Redis), understand absolute/idle expiry, rotate sessions on login/privilege change, and logout properly.

## 1) Simple explanation (like I'm 7)

Coat check again:
- **Where to keep records?** In a notebook at the counter (in-memory) - fine for one counter, lost if counter closes. In a filing cabinet (database) - stays, but slower. In a super-fast clipboard system (Redis) - fast, great for many counters.
- **Expiry**: Tickets expire if you don't come back for too long (**idle timeout**) or if too much time passed since you got ticket (**absolute timeout**).
- **Rotation**: When you prove who you are again (log in), get a **new ticket** and throw away old ticket. Prevents someone who stole old ticket from using it.
- **Logout**: Destroy the ticket completely.

## 2) Real name (technical)

- **Session store backends**: In-memory (dev only), relational DB (Postgres), key-value store (Redis/Valkey). For multi-instance, need shared store.
- **Idle timeout (sliding)**: Session invalid if no activity within X time. Update lastSeen on requests.
- **Absolute timeout**: Session invalid if older than X time regardless of activity.
- **Session rotation**: On authentication events (login, privilege escalation), generate new session ID, copy/migrate session data, invalidate old ID. Prevents session fixation.
- **Session invalidation**: On logout, password change, "log out everywhere" - delete from store.
- **Fixation prevention**: Always rotate session ID on login.

> **OWASP Session Management:** Implement idle and absolute timeouts, rotate session IDs after login, properly invalidate sessions on logout.

## 3) Example: complete, runnable code with comments

Local demo showing expiry checks and rotation. Uses in-memory map but shows logic.

Create `src/07-sessions-expiry-rotation.ts`:
```ts
// auth-learn/api/src/07-sessions-expiry-rotation.ts
// DEMO: Expiry + rotation (local only)

import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

type Session = { userId: string; actorType: string; tenantId: string; createdAt: number; lastSeen: number };
const sessions = new Map<string, Session>();

const IDLE_MS = 60 * 1000;      // 1 min idle
const ABSOLUTE_MS = 5 * 60 * 1000; // 5 min absolute

function newSid() { return crypto.randomBytes(32).toString("hex"); }

function validSession(sid: string): Session | null {
  const s = sessions.get(sid);
  if (!s) return null;
  const now = Date.now();
  if (now - s.lastSeen > IDLE_MS) { sessions.delete(sid); return null; }
  if (now - s.createdAt > ABSOLUTE_MS) { sessions.delete(sid); return null; }
  s.lastSeen = now;
  return s;
}

app.post("/login", (req, res) => {
  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: "username required" });
  
  // ROTATE: if somehow had old session, could invalidate; on fresh login create new
  const sid = newSid();
  sessions.set(sid, { userId: username, actorType: "customer", tenantId: "t1", createdAt: Date.now(), lastSeen: Date.now() });
  res.json({ sessionId: sid, idle: IDLE_MS/1000, absolute: ABSOLUTE_MS/1000 });
});

app.post("/relogin-rotate", (req, res) => {
  const oldSid = req.header("x-demo-session-id");
  // Rotate even if re-authenticating
  if (oldSid) sessions.delete(oldSid);
  const sid = newSid();
  sessions.set(sid, { userId: "alice", actorType: "customer", tenantId: "t1", createdAt: Date.now(), lastSeen: Date.now() });
  res.json({ message: "Rotated session", sessionId: sid });
});

app.get("/me", (req, res) => {
  const sid = req.header("x-demo-session-id");
  if (!sid) return res.status(401).json({ error: "no session" });
  const s = validSession(sid);
  if (!s) return res.status(401).json({ error: "invalid/expired" });
  res.json({ user: s.userId, tenantId: s.tenantId });
});

app.post("/logout", (req, res) => {
  const sid = req.header("x-demo-session-id");
  if (sid) sessions.delete(sid);
  res.json({ message: "logged out" });
});

app.post("/logout-everywhere", (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });
  for (const [k, v] of sessions.entries()) {
    if (v.userId === userId) sessions.delete(k);
  }
  res.json({ message: "logged out everywhere for user" });
});

app.listen(4040, () => {
  console.log("Demo listening on http://localhost:4040");
});
```

Run:
```bash
cd auth-learn/api
npx tsx src/07-sessions-expiry-rotation.ts
```

## 4) What I should see

- New login creates fresh session
- After idle/absolute timeout, session rejected
- Rotation gives new ID, old ID invalid
- Logout everywhere removes all sessions for user

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Store selection**: On merchant login to tenant, create session with tenantId/merchantId
- **Rotation**: After password change or MFA verification, rotate session
- **"Log out everywhere"**: When user changes password, invalidate all sessions for that account in that actor system
- **Scale**: Use Redis with TTL for sessions; DB also works with cleanup jobs

## 6) When to use it and when NOT to

**Use:**
- Shared store in multi-instance
- Both idle and absolute timeouts
- Rotate on login/privilege change
- Proper logout

**When NOT to:**
- Don't rely only on client to expire
- Don't skip rotation on auth
- Don't store everything in session if large (use IDs)

## 7) Common mistakes

- **No rotation on login** - session fixation
- **Only idle timeout** - stolen session usable forever if active
- **Only absolute timeout** - bad UX or security
- **In-memory in cluster** - breaks
- **Not cleaning up** - memory/DB bloat

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Simulate rotation - login gives sid1, call relogin-rotate with sid1 header, old sid1 should fail, new sid works.

**Hint:** As above.

**Reset steps:**
```bash
rm auth-learn/api/src/07-sessions-expiry-rotation.ts
```

## 9) Next

Next chapter: [08-cookies-in-depth.md](08-cookies-in-depth.md) - HttpOnly, Secure, SameSite, Domain, Path, `__Host-` prefix, vs localStorage.
