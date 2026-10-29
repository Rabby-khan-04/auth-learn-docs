# 19: Session Fixation and CSRF

> **Goal:** Understand session fixation, CSRF attacks, and defenses (rotate on login, SameSite cookies, CSRF tokens).

## 1) Simple explanation (like I'm 7)

- **Session fixation**: Bad guy gives you a ticket first, then tricks you to use it and log in - now they know the ticket and can use it. Fix: give you a **new ticket** when you log in.
- **CSRF**: Bad guy tricks your browser into doing something on another site where you're logged in. Your browser automatically sends cookies! Fix: check where request came from (SameSite) or ask for a secret token only your site knows.

## 2) Real name (technical)

- **Session fixation**: Attacker fixes session ID before authentication, victim authenticates with it - attacker uses same ID. **Defense:** Regenerate session ID on login/privilege change.
- **CSRF (Cross-Site Request Forgery)**: Forged requests from other sites using authenticated user's cookies. **Defenses:** SameSite cookie attribute, CSRF tokens (synchronizer token pattern), double-submit cookie, check Origin/Referer.
- **SameSite**: `Strict` most secure, `Lax` good balance, `None` requires Secure.

> **OWASP:** Rotate session IDs, use SameSite, implement CSRF protection for state-changing requests.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/19-fixation-csrf-concept.ts
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const sessions = new Map<string, any>();
function newSid(){return crypto.randomBytes(32).toString("hex");}

// FIXATION DEFENSE: rotate on login
app.post("/login", (req,res)=>{
  const old = req.header("x-demo-session-id");
  if (old) sessions.delete(old); // don't reuse
  const sid = newSid(); // new ID
  sessions.set(sid, { userId: "alice" });
  res.json({ sessionId: sid });
});

// CSRF concept - SameSite cookie would help
app.post("/transfer", (req,res)=>{
  const sid = req.header("x-demo-session-id");
  if (!sessions.has(sid)) return res.status(401).json({ error: "nope" });
  res.json({ message: "transfer done (demo)" });
});

app.listen(4130, ()=>console.log("Demo on 4130"));
```

**Notes:** Always rotate session on login. Use HttpOnly Secure SameSite cookies. For sensitive actions, consider CSRF tokens.

**Reset:** `rm auth-learn/api/src/19-fixation-csrf-concept.ts`

**Next:** 20-token-theft-xss.md
