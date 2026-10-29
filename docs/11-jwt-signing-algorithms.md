# 11: JWT Signing Algorithms (HS256 vs RS256/EdDSA), `alg: none` Danger

> **Goal:** Understand symmetric vs asymmetric signing, key management, and the critical `alg: none` vulnerability with fixes.

## 1) Simple explanation (like I'm 7)

- **HS256 (symmetric)**: Same secret key used to seal and check. Like using same padlock key at home. If someone else gets that key, they can make fake seals.
- **RS256/EdDSA (asymmetric)**: Private key seals, public key checks. Like a wax seal only you can make with your private stamp, but anyone can verify with your public stamp.
- **alg: none (DANGER)**: No seal at all - anyone can write anything and claim it's valid. **Never accept this.**

## 2) Real name (technical)

- **Symmetric (HMAC)**: HS256/HS384/HS512 - same key for sign and verify. Simple but secret must be shared/kept secure.
- **Asymmetric (RSA/ECDSA/EdDSA)**: RS256, PS256, ES256, EdDSA - private key signs, public key verifies. Better for distributed systems (multiple verifiers).
- **Key rotation**: Support multiple keys (kid in header), rotate regularly.
- **Algorithm confusion**: Attacker changes alg to trick verifier. Always specify allowed algorithms.
- **alg: none attack**: Token with `{"alg":"none"}` and no signature accepted by vulnerable libraries.

> **OWASP JWT Cheat Sheet:** Never accept `alg: none`. Explicitly whitelist algorithms. Use strong keys. Prefer asymmetric for public verification.

## 3) Example: complete, runnable code with comments

**DANGER DEMO** showing alg:none, then fix. Run locally only.

Create `src/11-jwt-algorithms-demo.ts`:
```ts
// auth-learn/api/src/11-jwt-algorithms-demo.ts
// DANGER DEMO + FIX (local only)

import * as jose from "jose";
import crypto from "crypto";

async function demo() {
  console.log("=== DANGER DEMO: alg: none ===");
  // Create a token with alg none (no signature)
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "attacker", role: "super_admin", exp: Math.floor(Date.now()/1000)+3600 })).toString("base64url");
  const noneToken = `${header}.${payload}.`; // empty signature
  
  console.log("noneToken:", noneToken);
  
  // VULNERABLE verification (DANGER) - DO NOT DO THIS
  try {
    // Some old/bad code might accept any alg - with jose we must be explicit
    const { payload: p } = await jose.jwtVerify(noneToken, crypto.randomBytes(32), { algorithms: ["none"] }); // explicitly allowing - BAD
    console.log("VULNERABLE: accepted alg:none payload:", p);
  } catch (e: any) {
    console.log("With algorithms:['none'] explicitly:", e.message);
  }
  
  console.log("\n=== FIX: Explicitly whitelist algorithms ===");
  try {
    // FIX: only allow HS256, never none
    const secret = new TextEncoder().encode("demo-secret");
    // Try to verify noneToken with only HS256 allowed
    const { payload: p2 } = await jose.jwtVerify(noneToken, secret, { algorithms: ["HS256"] });
    console.log("Should not see this:", p2);
  } catch (e: any) {
    console.log("FIXED: rejected -", e.code || e.message);
  }
  
  console.log("\n=== HS256 vs RS256 concept ===");
  console.log("HS256: same secret signs and verifies");
  console.log("RS256: private key signs, public key verifies (better for distribution)");
}

demo().catch(console.error);
```

Run:
```bash
cd auth-learn/api
npx tsx src/11-jwt-algorithms-demo.ts
```

## 4) What I should see

- alg:none token created
- If you explicitly allow `algorithms: ["none"]` it's accepted (vulnerable) - shows danger
- With `algorithms: ["HS256"]` only, alg:none is rejected
- **Fix:** always explicitly whitelist allowed algorithms, never accept "none"

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Each actor auth system has its own keys/algorithm policy**
- **Customer API** only accepts tokens from customer auth issuer with specific alg and audience
- **Never** fall back to "accept any alg"
- Use asymmetric keys if multiple services verify tokens

## 6) When to use it and when NOT to

**Use:**
- HS256 for simple same-system
- RS256/EdDSA for distributed
- Explicit algorithm whitelist
- Strong keys (>= 256 bits for HS256)

**When NOT to:**
- Never accept `alg: none`
- Don't let token choose algorithm (algorithm confusion)
- Don't use weak secrets

## 7) Common mistakes

- **alg: none acceptance** - critical
- **Algorithm confusion attacks**
- **Shared secrets across systems**
- **No key rotation plan**

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Create HS256 token and try to verify with wrong algorithm list - should fail.

**Hint:** Use `algorithms: ["RS256"]` when token is HS256.

**Reset steps:**
```bash
rm auth-learn/api/src/11-jwt-algorithms-demo.ts
```

## 9) Next

Next chapter: [12-access-refresh-tokens.md](12-access-refresh-tokens.md) - Short access, longer refresh, rotation, reuse detection, revocation problem.
