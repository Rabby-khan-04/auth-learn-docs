# 09: Sessions vs JWT - Honest Comparison

> **Goal:** Give an honest comparison of server-side sessions and JWTs, trade-offs, and guidance on when to use each.

## 1) Simple explanation (like I'm 7)

- **Server-side session (coat check)**: Ticket points to info stored at counter. Counter can erase ticket anytime (logout works instantly). If counter has many branches, they need to share info.
- **JWT (self-contained badge)**: Badge has all info written on it and sealed with a stamp. You can check the stamp yourself without calling the counter. But if someone steals the badge, you can't easily "erase" it until it expires. Also if you change info, old badges still say old info until they expire.

Both can be sent in cookies (safer) or elsewhere. Neither is "perfect".

## 2) Real name (technical)

- **Server-side session**: Stateful - server stores session data, client has ID. Revocation easy (delete). Scales with shared store.
- **JSON Web Token (JWT)**: Stateless/self-contained - claims signed by issuer. Verification uses public key/secret without DB lookup (if using asymmetric). Revocation hard (need blocklist/rotation strategy).
- **Access token**: Short-lived credential for API access
- **Refresh token**: Used to get new access tokens

> **OWASP JWT Cheat Sheet:** Be careful with JWTs - many mistakes possible. Consider sessions for traditional apps; JWTs can be appropriate for certain distributed scenarios but need careful design.

## 3) Example: complete, runnable code with comments

Conceptual comparison table + notes (we'll do full JWT chapters next).

Create `src/09-sessions-vs-jwt-comparison.ts`:
```ts
// auth-learn/api/src/09-sessions-vs-jwt-comparison.ts
// CONCEPTUAL comparison only

const comparison = {
  sessions: {
    state: "server-side",
    storage: "DB/Redis",
    revocation: "easy (delete session)",
    scaling: "needs shared store",
    xss_risk_if_cookie_httponly: "lower (not readable by JS)",
    size: "small (just ID)",
    rotation: "easy"
  },
  jwt: {
    state: "stateless (self-contained)",
    storage: "client holds token",
    revocation: "hard (need blocklist/reuse detection)",
    scaling: "easy to verify without DB",
    xss_risk_if_localstorage: "high",
    size: "larger (claims)",
    rotation: "possible but complex"
  }
};

console.log(JSON.stringify(comparison, null, 2));
console.log("\nRecommendation: For most web apps with server, sessions + HttpOnly cookies are simpler and safer.");
console.log("JWTs useful for S2S, some distributed systems - but need careful revocation/rotation.");
```

Run:
```bash
cd auth-learn/api
npx tsx src/09-sessions-vs-jwt-comparison.ts
```

## 4) What I should see

Clear trade-offs printed.

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Customer web app**: Server-side sessions in Redis, HttpOnly cookies. Easy logout, "log out everywhere", tenant checks.
- **Merchant dashboard**: Similar - separate auth system with separate sessions/cookies.
- **Super admin panel**: Sessions with short timeouts, rotation, audit trail.
- **Mobile app talking to API / S2S**: Sometimes JWTs make sense, but still need rotation/revocation strategy. Must be separate per actor system.

## 6) When to use it and when NOT to

**Use sessions when:**
- Traditional web app
- Need instant revocation
- Simpler security model

**Use JWTs when:**
- Stateless auth across many services
- Can't share session store easily
- Short-lived access tokens with rotation

**When NOT to:**
- Don't put JWTs in localStorage
- Don't use long-lived JWTs
- Don't assume "stateless" means "no revocation problem"

## 7) Common mistakes

- **JWT in localStorage** - XSS theft
- **No expiration** - forever valid
- **No rotation** - refresh token theft hard to detect
- **Using JWT for everything** - overcomplicating
- **Trusting JWT without validation** - must check signature, iss, aud, exp

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** List 3 scenarios where sessions are better, 3 where JWTs might be better.

**Hint:** Sessions better for web+logout; JWTs better for microservices/S2S.

**Reset steps:**
```bash
rm auth-learn/api/src/09-sessions-vs-jwt-comparison.ts
```

## 9) Next

Next chapter: [10-jwt-structure-and-claims.md](10-jwt-structure-and-claims.md) - Header/payload/signature, base64url, claims (iss,aud,sub,exp,nbf,iat,jti), validation.
