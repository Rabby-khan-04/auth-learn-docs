# 22: Passkeys and WebAuthn (Introduction)

> **Goal:** Conceptual intro to passkeys/WebAuthn, phishing resistance, and safe demo notes.

## 1) Simple explanation (like I'm 7)

Passkeys let you log in with your fingerprint, face, or device unlock instead of a password. The device proves who you are with a special key that only works for that website - bad guys can't steal it or trick you into using it on fake sites.

## 2) Real name (technical)

- **WebAuthn (Web Authentication)**: W3C standard for strong, phishing-resistant authentication using public key cryptography
- **Passkey**: Discoverable credential stored on device/authenticator (synced or device-bound)
- **FIDO2**: Alliance standard (CTAP + WebAuthn)
- **Phishing resistant**: Credentials bound to origin (RP ID) - can't be used on fake sites
- **Attestation/Assertion**: Registration creates key pair, authentication proves possession

> **Note:** Full implementation is complex; this is conceptual. Use well-maintained libraries if implementing.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/22-webauthn-concept.ts
console.log("WebAuthn flow (concept):");
console.log("1. Registration: navigator.credentials.create() with challenge");
console.log("2. Server verifies attestation, stores public key");
console.log("3. Authentication: navigator.credentials.get() with challenge");
console.log("4. Server verifies assertion with stored public key");
console.log("Passkeys = user-friendly passkeys built on WebAuthn");
```

**Safety notes:** Use HTTPS, validate origin, use challenges, verify signatures.

**Reset:** `rm auth-learn/api/src/22-webauthn-concept.ts`

**Next:** 23-oauth2-oidc-auth-code-pkce.md
