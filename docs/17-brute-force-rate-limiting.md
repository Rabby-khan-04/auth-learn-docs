# 17: Brute Force, Credential Stuffing, Rate Limiting

> **Goal:** Understand attacks and defenses - rate limiting, account lockouts (careful), per-IP and per-account, avoiding user enumeration.

## 1) Simple explanation (like I'm 7)

If someone tries to guess your password over and over, we need to slow them down. Like a bank ATM that makes you wait after wrong PINs. But if we block by account too aggressively, bad guys can lock out real users. Better to slow down everyone a bit.

## 2) Real name (technical)

- **Brute force**: Trying many passwords for same account
- **Credential stuffing**: Trying breached username/password pairs across sites
- **Rate limiting**: Limit requests per time window (per IP, per account)
- **Account lockout**: Temporarily disable account after failures - can enable denial of service
- **Throttling/backoff**: Add delays, exponential backoff
- **CAPTCHA**: Can help but not foolproof
- **Distributed rate limiting**: Use Redis in multi-instance

> **OWASP Authentication Cheat Sheet:** Implement rate limiting, consider device cookies, avoid lockouts that enable DoS. Use generic errors.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/17-rate-limiting-demo.ts
import express from "express";

const app = express();
app.use(express.json());

// In-memory - use Redis in prod
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW = 60*1000;
const MAX = 5;

function rateLimit(key: string) {
  const now = Date.now();
  const rec = attempts.get(key);
  if (!rec || now - rec.first > WINDOW) {
    attempts.set(key, { count: 1, first: now });
    return { ok: true };
  }
  rec.count++;
  if (rec.count > MAX) return { ok: false, retryAfter: Math.ceil((rec.first+WINDOW - now)/1000) };
  return { ok: true };
}

app.post("/login", (req,res)=>{
  const { email, ip } = req.body as any;
  const keyIp = `ip:${ip||req.ip}`;
  const keyAcc = `acc:${email}`;
  // Rate limit both
  const r1 = rateLimit(keyIp);
  if (!r1.ok) return res.status(429).json({ error: "Too many requests", retryAfter: r1.retryAfter });
  const r2 = rateLimit(keyAcc);
  if (!r2.ok) return res.status(429).json({ error: "Too many requests", retryAfter: r2.retryAfter });
  // ... do auth with generic error
  res.json({ message: "ok" });
});

app.listen(4110, ()=>console.log("Demo on 4110"));
```

**Notes:** Rate limit per IP and per account. Don't reveal remaining attempts. Generic errors. Consider account-based throttling without full lockout.

**Reset:** `rm auth-learn/api/src/17-rate-limiting-demo.ts`

**Next:** 18-user-enumeration-timing.md
