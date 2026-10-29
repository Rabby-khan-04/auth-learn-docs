# 32: API Keys, Service-to-Service Auth, Webhook Signatures

> **Goal:** API keys, S2S auth, webhook signature verification (HMAC).

## 1) Simple explanation (like I'm 7)

- **API key**: Like a key card for a service - proves "this program is allowed to come in"
- **Service-to-service**: Programs talking to each other need to prove identity
- **Webhook signature**: When another service calls you, you verify they really sent it (like checking a wax seal)

## 2) Real name (technical)

- **API keys**: High-entropy random keys, store hashed, scope permissions, rotate
- **S2S auth**: mTLS, or JWTs with client credentials, or API keys
- **HMAC signature**: Sign payload with secret, verify signature (timing-safe)
- **Webhook verification**: Prevent spoofing

> **OWASP:** Hash API keys, use HMAC for webhooks, verify signatures.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/32-api-keys-webhooks.ts
import crypto from "crypto";

// API key - store hash
function generateApiKey(){ const key = crypto.randomBytes(32).toString("hex"); return { key, hash: crypto.createHash("sha256").update(key).digest("hex") }; }

// Webhook HMAC
function signWebhook(payload:string, secret:string){ return crypto.createHmac("sha256", secret).update(payload).digest("hex"); }
function verifyWebhook(payload:string, secret:string, sig:string){
  const expected = signWebhook(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

console.log(generateApiKey());
```

**Reset:** `rm auth-learn/api/src/32-api-keys-webhooks.ts`

**Next:** 33-auth-in-nextjs.md
