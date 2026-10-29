# 12: Access and Refresh Tokens, Rotation, Reuse Detection

> **Goal:** Understand short access tokens, longer refresh tokens, rotation, reuse detection, and the revocation problem.

## 1) Simple explanation (like I'm 7)

- **Access token (short pass)**: Like a day pass to the mall - valid for a short time (15 min). If stolen, only works briefly.
- **Refresh token (longer pass)**: Like a membership card - use it to get a new day pass when old one expires. Keep it safer (HttpOnly cookie).
- **Rotation**: When you use membership card to get new day pass, you also get a **new** membership card and the old one is invalidated.
- **Reuse detection**: If someone steals your old membership card and tries to use it after you've already rotated, we catch it and invalidate all tokens (log out everywhere).

## 2) Real name (technical)

- **Access token**: Short-lived (e.g., 5-15 min), used for API authorization
- **Refresh token**: Longer-lived (e.g., days/weeks), used only to obtain new access tokens. Store securely.
- **Token rotation**: Issue new refresh token on each refresh, invalidate old one.
- **Refresh token reuse detection**: If a refresh token is used after being rotated/revoked, treat as compromise - revoke entire token family.
- **Token family**: Set of tokens derived from same login session
- **Revocation problem**: JWTs are stateless; revoking before exp requires blocklist or short-lived tokens + rotation

> **OWASP:** Use short-lived access tokens, rotate refresh tokens, detect reuse.

## 3) Example: complete, runnable code with comments

Local demo showing rotation and reuse detection.

Create `src/12-access-refresh-tokens.ts`:
```ts
// auth-learn/api/src/12-access-refresh-tokens.ts
// DEMO: Access/refresh with rotation + reuse detection (local only)

import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

type TokenFamily = { userId: string; validRefresh: string | null; used: Set<string> };
const families = new Map<string, TokenFamily>();

function newToken() { return crypto.randomBytes(32).toString("hex"); }

app.post("/login", (req, res) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) return res.status(400).json({ error: "userId required" });
  const familyId = crypto.randomUUID();
  const refresh = newToken();
  families.set(familyId, { userId, validRefresh: refresh, used: new Set() });
  const access = newToken();
  res.json({ familyId, accessToken: access, refreshToken: refresh, note: "access short-lived, refresh rotated" });
});

app.post("/refresh", (req, res) => {
  const { familyId, refreshToken } = req.body as { familyId?: string; refreshToken?: string };
  if (!familyId || !refreshToken) return res.status(400).json({ error: "missing" });
  const family = families.get(familyId);
  if (!family) return res.status(401).json({ error: "invalid family" });
  
  // Check reuse
  if (family.used.has(refreshToken)) {
    // REUSE DETECTED - compromise, revoke all
    families.delete(familyId);
    return res.status(401).json({ error: "refresh token reuse detected - session revoked" });
  }
  
  if (family.validRefresh !== refreshToken) {
    return res.status(401).json({ error: "invalid refresh token" });
  }
  
  // Rotate: mark old as used, issue new
  family.used.add(refreshToken);
  const newRefresh = newToken();
  family.validRefresh = newRefresh;
  const newAccess = newToken();
  
  res.json({ accessToken: newAccess, refreshToken: newRefresh });
});

app.post("/logout", (req, res) => {
  const { familyId } = req.body as { familyId?: string };
  if (familyId) families.delete(familyId);
  res.json({ message: "logged out" });
});

app.listen(4060, () => {
  console.log("Demo listening on http://localhost:4060");
});
```

Run:
```bash
cd auth-learn/api
npx tsx src/12-access-refresh-tokens.ts
```

Test flow:
1. Login -> get familyId, accessToken, refreshToken
2. Refresh with refreshToken -> get new access + new refresh
3. Try to use old refreshToken again -> reuse detected, family deleted

## 4) What I should see

- First refresh works, issues new tokens
- Reusing old refresh token triggers "reuse detected" and revokes family
- After revocation, even new refresh fails

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Customer app**: Access token 15 min (in memory), refresh token in HttpOnly Secure cookie, rotated per use
- **If refresh token stolen and used**: Attacker gets new tokens, legitimate user tries old refresh token -> reuse detected -> all tokens revoked, user must login again (and we log security event)
- **Separate per actor type**: Different token families/secrets/issuers

## 6) When to use it and when NOT to

**Use:**
- Short access + rotated refresh
- Reuse detection
- Store refresh in HttpOnly cookie
- Detect and revoke on reuse

**When NOT to:**
- Don't use long-lived access tokens
- Don't allow unlimited refresh without rotation
- Don't store refresh in localStorage

## 7) Common mistakes

- **No rotation** - stolen refresh usable until expiry
- **No reuse detection** - can't tell compromise
- **Long access tokens** - defeats purpose
- **Sending refresh in Authorization header** - vulnerable to XSS

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Simulate attack - login, refresh once (get new tokens), attacker uses old refresh token -> should be revoked.

**Hint:** As described above.

**Reset steps:**
```bash
rm auth-learn/api/src/12-access-refresh-tokens.ts
```

## 9) Next

Next chapter: [13-registration-login-logout.md](13-registration-login-logout.md) - Registration, login, logout flows with correct order.
