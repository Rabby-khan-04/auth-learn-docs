# 02: Identity and Credentials, Factors

> **Goal:** Understand principals, identifiers, credentials, factor categories, and a safe intro to MFA.

## 1) Simple explanation (like I'm 7)

Think of a school:

- **Principal** = someone or something that wants to do stuff (a student, a teacher, or even a robot helper).
- **Identity** = the school's record of that person (their student ID profile).
- **Identifier** = how the school picks that record (like student number or email used to log in).
- **Credentials** = proof you are that person (password, ID card, fingerprint).
- **Factors** = different *kinds* of proof - something you know, something you have, something you are.

Using more than one kind (like password + code from phone) makes it harder for someone else to pretend to be you.

## 2) Real name (technical)

- **Principal**: An entity that can be authenticated/authorized (user, service account, API client, device).
- **Identity**: The canonical representation of a principal in the system (attributes, roles, tenant linkage).
- **Identifier (username/email/subject)**: A unique value used to look up an identity (not necessarily secret). Must be unique in its scope (per actor system / per tenant as needed).
- **Credential**: A piece of evidence used in authentication (secret or private key/material). Examples: password, passkey private key, TOTP secret, API key.
- **Authentication factors**: 
  - *Knowledge* (something you know): password, PIN
  - *Possession* (something you have): phone (TOTP/app), hardware key
  - *Inherence* (something you are): biometrics (fingerprint/face) - use carefully, note privacy
- **MFA (Multi-Factor Authentication)**: Requiring two or more *different* factors from different categories to authenticate.

> **Important:** Two passwords are not two factors. "SMS code" can be possession-like but has risks; we will discuss in later chapters.

## 3) Example: complete, runnable code with comments

Local demo in `auth-learn/api` showing identity lookup vs credential check (separated). Uses in-memory store only.

```bash
cd auth-learn/api
cp .env.example .env  # if needed
```

Create `src/02-identity-credentials-demo.ts`:
```ts
// auth-learn/api/src/02-identity-credentials-demo.ts
// DEMO: Identity vs Credentials vs Factors (local only)

import express from "express";

const app = express();
app.use(express.json());

// Identity store: maps identifier -> identity (public info)
type Identity = { id: string; email: string; actorType: "customer" | "merchant" | "super_admin"; tenantId: string };
const identities: Identity[] = [
  { id: "id1", email: "alice@example.test", actorType: "customer", tenantId: "t1" },
  { id: "id2", email: "morgan@example.test", actorType: "merchant", tenantId: "t1" },
];

// Credential store: separate from identity (secrets). NEVER return secrets.
// DANGER DEMO: plain text password shown ONLY to explain concept - see chapter 03 for fix
type Credential = { identityId: string; type: "password"; secretPlain: string }; // DANGER DEMO
const credentials: Credential[] = [
  { identityId: "id1", secretPlain: "demo-pass-123" }, // DANGER DEMO
  { identityId: "id2", secretPlain: "demo-pass-456" }, // DANGER DEMO
];

// (1) Find identity by identifier (email) - this is lookup, not proof
function findIdentityByEmail(email: string): Identity | undefined {
  return identities.find((i) => i.email === email);
}

// (2) Verify credential - prove identity
function verifyPassword(identityId: string, password: string): boolean {
  const cred = credentials.find((c) => c.identityId === identityId && c.type === "password");
  if (!cred) return false;
  // DANGER DEMO: plain text comparison - INSECURE. We will replace with slow hash + constant-time later
  return cred.secretPlain === password;
}

// Factor categories (concept)
const factors = {
  knowledge: ["password", "pin"],
  possession: ["totp_app", "hardware_key"],
  inherence: ["biometric"], // use with care
};

app.post("/login-demo", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  // Step 1: identify (lookup) - who do they claim to be?
  const identity = findIdentityByEmail(email);
  if (!identity) {
    // NOTE: to avoid user enumeration we must be careful with messages later (chapter 18)
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Step 2: verify credential (proof) - is this really them?
  const ok = verifyPassword(identity.id, password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Authenticated - established principal identity
  res.json({
    message: "Authenticated (demo)",
    identity: { id: identity.id, email: identity.email, actorType: identity.actorType, tenantId: identity.tenantId },
    factorsUsed: ["knowledge"] as string[],
    note: "This is DANGER DEMO (plain text). See chapter 03/04 for secure password storage.",
  });
});

app.get("/factors", (_req, res) => {
  res.json({ factors, mfaNote: "MFA combines different factor categories." });
});

app.listen(4020, () => {
  console.log("Demo listening on http://localhost:4020");
});
```

Run:
```bash
cd auth-learn/api
npx tsx src/02-identity-credentials-demo.ts
```

Test:
```bash
curl -i -X POST "http://localhost:4020/login-demo" -H "content-type: application/json" -d '{"email":"alice@example.test","password":"demo-pass-123"}'
curl -i -X POST "http://localhost:4020/login-demo" -H "content-type: application/json" -d '{"email":"alice@example.test","password":"wrong"}'
curl -i -X POST "http://localhost:4020/login-demo" -H "content-type: application/json" -d '{"email":"nope@example.test","password":"x"}'
curl -i "http://localhost:4020/factors"
```

## 4) What I should see

- Correct creds -> 200 with identity (no secrets returned) and `factorsUsed: ["knowledge"]`
- Wrong password or unknown email -> 401 `Invalid credentials` (same message in this simple demo; we must fix enumeration later)
- `/factors` shows categories

Notice: identity lookup and credential verification are separate steps.

## 5) In a real multi-tenant e-commerce platform: one concrete example

For customers on tenant `t1` (shoes.example.com):
- Identifier could be email `alice@example.test` - looked up in *customer* identity store scoped to tenant context.
- Credential is verified against *customer* credential store (separate table/system from merchants/super admins).
- If MFA enabled, after password (knowledge) we require TOTP from authenticator app (possession) as second factor.
- Merchant users have different identity/credential stores - same email could exist in different tenant's merchant system or different actor systems; we must resolve correctly by actor type + tenant.

## 6) When to use it and when NOT to

**Use:**
- Keep identity and credentials in separate stores/concerns
- Treat identifiers as non-secret
- Use different factor categories for MFA
- Scope identities by actor type and tenant

**When NOT to:**
- Don't log credentials or return them
- Don't use the same identifier namespace across completely separate auth systems without clear scoping
- Don't treat possession of email alone as "possession factor" without proper verification flows

## 7) Common mistakes

- **Storing secrets with identity** - leak risk
- **Using email as "proof"** - it's an identifier/contact, not a credential
- **Counting same factor twice** - not MFA
- **Returning different error messages** for wrong password vs unknown user (helps enumeration)
- **Mixing actor types** in same identity table without strict separation

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Add a simple "possession" factor demo - after password verification, require a fixed demo code `123456` (TOTP-like placeholder) to fully authenticate. Return which factors were used.

**Hint:**
- Add a step: if password ok, check `req.body.mfaCode === "123456"`
- Track `factorsUsed: ["knowledge", "possession"]`
- Only return success if both pass

**Reset steps:**
```bash
rm auth-learn/api/src/02-identity-credentials-demo.ts
```

## 9) Next

Next chapter: [03-passwords-why-never-plaintext.md](03-passwords-why-never-plaintext.md) - Why never plaintext, hashing vs encryption, salt, pepper (concept).
