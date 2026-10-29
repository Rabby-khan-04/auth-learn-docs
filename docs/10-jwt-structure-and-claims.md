# 10: JWT Structure and Claims

> **Goal:** Understand JWT structure (header.payload.signature), base64url, registered claims (iss, aud, sub, exp, nbf, iat, jti), custom claims, and validation.

## 1) Simple explanation (like I'm 7)

A JWT is like a sealed envelope with three parts separated by dots: `aaaa.bbbb.cccc`

- First part (header): says "how I was sealed" (algorithm)
- Second part (payload): says "who I am and what I can do" (claims) - anyone can read this if they have it!
- Third part (signature): the seal that proves it wasn't tampered with

Anyone can read the envelope contents, but only someone with the right key can make a valid seal.

## 2) Real name (technical)

- **JWT (JSON Web Token)**: Compact, URL-safe token format (RFC 7519). Structure: `base64url(header).base64url(payload).base64url(signature)`
- **Header**: Typically `{"alg": "...", "typ": "JWT"}`
- **Payload (claims set)**: JSON with claims
- **Registered claims**: `iss` (issuer), `sub` (subject), `aud` (audience), `exp` (expiration time), `nbf` (not before), `iat` (issued at), `jti` (JWT ID)
- **Public/private claims**: Custom claims (namespaced to avoid collisions)
- **Validation**: Must verify signature, algorithm (explicit), iss, aud, exp, nbf. Never trust claims without verification.

> **RFC 7519:** JWTs are signed/encrypted; JWS for signed, JWE for encrypted. We focus on JWS.

## 3) Example: complete, runnable code with comments

Use `jose` (modern, secure) to create/verify. Run locally.

Create `src/10-jwt-structure-demo.ts`:
```ts
// auth-learn/api/src/10-jwt-structure-demo.ts
// DEMO: JWT structure and claims (local only)

import * as jose from "jose";

async function demo() {
  const secret = new TextEncoder().encode("demo-secret-change-me-in-prod"); // DANGER DEMO for HS256
  const issuer = "auth-learn-api";
  const audience = "auth-learn-web";
  
  // Create JWT
  const jwt = await new jose.SignJWT({ 
    role: "customer", 
    tenantId: "t1",
    actorType: "customer" 
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user_123")
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("15m") // short-lived
    .setJti(crypto.randomUUID())
    .sign(secret);
  
  console.log("JWT:", jwt);
  console.log("\n--- Parts ---");
  const parts = jwt.split(".");
  console.log("Header:", Buffer.from(parts[0], "base64url").toString());
  console.log("Payload:", Buffer.from(parts[1], "base64url").toString());
  console.log("Signature:", parts[2].slice(0, 20) + "...");
  
  console.log("\n--- Verify ---");
  try {
    const { payload } = await jose.jwtVerify(jwt, secret, {
      issuer,
      audience,
    });
    console.log("Valid! Payload:", payload);
  } catch (e: any) {
    console.log("Invalid:", e.message);
  }
  
  console.log("\nNote: Payload is base64url-encoded, NOT encrypted. Anyone can read it.");
}

demo().catch(console.error);
```

Run:
```bash
cd auth-learn/api
npx tsx src/10-jwt-structure-demo.ts
```

## 4) What I should see

- Three parts printed
- Header shows `{"alg":"HS256","typ":"JWT"}`
- Payload shows claims including our custom ones
- Verification succeeds with correct issuer/audience/secret
- Note that payload is readable

## 5) In a real multi-tenant e-commerce platform: one concrete example

For customer auth system:
- `iss`: `https://customer-auth.example.com`
- `aud`: `https://api.example.com`
- `sub`: customer user id
- `actorType`: `customer`
- `tenantId`: `t1` (must verify against request tenant)
- `jti`: unique ID for tracking/blocklisting if needed
- Short `exp` (e.g., 15 min)

Different systems have different `iss`/`aud` to prevent cross-system token use.

## 6) When to use it and when NOT to

**Use:**
- Short-lived access tokens
- Validate all registered claims
- Use specific audience/issuer

**When NOT to:**
- Don't put secrets in payload
- Don't trust unverified JWTs
- Don't use as long-lived sessions without rotation strategy

## 7) Common mistakes

- **Not verifying signature** - accepting any token
- **Not checking iss/aud** - accepting tokens from wrong system
- **Long expiry** - stolen token valid long
- **Putting sensitive data in payload** - readable by anyone
- **Using `alg: none`** - critical vulnerability

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Try to verify with wrong secret - should fail. Try to modify payload and verify - should fail.

**Hint:** Change one char in payload part and reassemble JWT.

**Reset steps:**
```bash
rm auth-learn/api/src/10-jwt-structure-demo.ts
```

## 9) Next

Next chapter: [11-jwt-signing-algorithms.md](11-jwt-signing-algorithms.md) - HS256 vs RS256/EdDSA, key management, `alg: none` danger demo + fix.
