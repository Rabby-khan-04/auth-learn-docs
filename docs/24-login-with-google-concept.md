# 24: "Login with Google" in Concept

> **Goal:** Understand "Login with Google" flow, state/nonce, redirect URIs, and what libraries do.

## 1) Simple explanation (like I'm 7)

Instead of making a new password, you ask Google "is this person who they say they are?" Google says yes/no and tells your app some basic info. Your app trusts Google.

## 2) Real name (technical)

- **Redirect URI**: Must be pre-registered, validated
- **state parameter**: Random value, stored in session, verified on return - prevents CSRF
- **nonce**: In OIDC, prevents ID token replay
- **ID token**: JWT from Google with claims (sub, email, etc.)
- **Access token**: May be used to call Google APIs

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/24-login-google-concept.ts
console.log("Login with Google (OIDC):");
console.log("- Register app in Google Cloud, get client_id/secret");
console.log("- Use Authorization Code + PKCE");
console.log("- Include state and nonce");
console.log("- Verify id_token signature, iss, aud, nonce");
console.log("- Create local session for user");
console.log("- Never trust email without verification");
```

**Note:** We'll check maintained libraries in next chapter.

**Reset:** `rm auth-learn/api/src/24-login-google-concept.ts`

**Next:** Batch 9 (25-27)
