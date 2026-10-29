# 23: OAuth 2.0 and OpenID Connect, Authorization Code + PKCE

> **Goal:** Understand OAuth2 vs OIDC, Authorization Code flow with PKCE, and key differences.

## 1) Simple explanation (like I'm 7)

- **OAuth 2.0**: Lets an app ask another service "can I access this user's stuff?" - like giving a valet key to park your car, not your house key.
- **OpenID Connect (OIDC)**: Adds "who is this user?" on top of OAuth2 - like getting an ID card from the valet service.
- **Authorization Code + PKCE**: A secure way for apps (especially mobile/SPA) to get the valet key without leaking it.

## 2) Real name (technical)

- **OAuth 2.0 (RFC 6749)**: Authorization framework - issues access tokens for resource access
- **OIDC (OpenID Connect Core)**: Identity layer on OAuth2 - adds `id_token` (JWT) with user claims
- **Authorization Code flow**: Exchange code for tokens (more secure than implicit)
- **PKCE (RFC 7636)**: Proof Key for Code Exchange - prevents code interception attacks, required for public clients
- **state**: Prevent CSRF in OAuth flow
- **nonce**: Prevent replay of ID tokens

> **Specs:** RFC 6749, OIDC Core 1.0. Use Authorization Code + PKCE.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/23-oauth-pkce-concept.ts
console.log("Auth Code + PKCE flow:");
console.log("1. Generate code_verifier (random), code_challenge = SHA256(verifier)");
console.log("2. Redirect to auth server with code_challenge");
console.log("3. User consents, auth server returns code");
console.log("4. Exchange code + code_verifier for tokens");
console.log("5. Verify tokens, get user info");
console.log("\nOAuth2 = authorization (access to resources)");
console.log("OIDC = authentication + authorization (who + access), returns id_token");
```

**Reset:** `rm auth-learn/api/src/23-oauth-pkce-concept.ts`

**Next:** 24-login-with-google-concept.md
