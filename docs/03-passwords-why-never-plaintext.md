# 03: Passwords - Why Never Plaintext, Hashing vs Encryption, Salt, Pepper

> **Goal:** Understand why storing plaintext passwords is catastrophic, the difference between hashing and encryption, salts, peppers, and why we need slow hashes.

## 1) Simple explanation (like I'm 7)

Imagine you have a box of secret notes with kids' passwords written on them.

- If someone breaks in and takes the box, they see *every* password right away. Bad.
- Instead, put each password through a *one-way blender*. You can't get the original back from the mush. If someone steals the mush, it's much harder to know original passwords.
- Add a little *extra spice* unique to each password (salt) so even if two kids have same password, their mush looks different.
- *Encryption* is different - it's like putting in a locked box that you can *unlock* with a key to get original back. We don't want to be able to "unlock" passwords to plain text.
- *Hashing* (one-way) is what we want for passwords. *Encryption* (reversible) is for data we need to read again.

## 2) Real name (technical)

- **Plaintext storage**: Storing passwords exactly as entered. **Never do this.** Catastrophic if DB leaked.
- **Hash function**: A deterministic one-way function `H(input) -> digest`. Given digest, should be computationally infeasible to recover input (preimage resistance). Small change in input changes digest completely.
- **Encryption**: Reversible transformation using a key `E_k(plaintext)=ciphertext`, `D_k(ciphertext)=plaintext`. Use for data you need to recover; not appropriate for password verification as primary method.
- **Salt**: A unique, random value per password added before hashing (`H(salt + password)`). Prevents rainbow table attacks and makes identical passwords produce different hashes.
- **Pepper**: A secret value (often stored outside DB, e.g. env/secret manager) applied to all passwords. If DB leaked but pepper not, it adds another layer. It's not a replacement for salt/slow hash.
- **Rainbow table**: Precomputed table of hashes for common passwords - salts defeat these.

> **OWASP Password Storage Cheat Sheet:** Use a slow, adaptive password hashing function (Argon2id is current recommended in many contexts; bcrypt/scrypt also acceptable). Never use fast hashes like MD5, SHA-1, SHA-256 for passwords.

## 3) Example: complete, runnable code with comments

**DANGER DEMO** - first shows what NOT to do, then shows correct approach concept. Run only locally.

Create `src/03-passwords-danger-vs-fix.ts`:
```ts
// auth-learn/api/src/03-passwords-danger-vs-fix.ts
// DANGER DEMO: plaintext vs hashing (concept)
// RUN ONLY LOCALLY. Never use these patterns in prod.

import crypto from "crypto";

// === DANGER DEMO 1: Plaintext storage ===
type UserDanger = { email: string; passwordPlain: string }; // DANGER
const usersDanger: UserDanger[] = [
  { email: "alice@example.test", passwordPlain: "Password123!" }, // DANGER
];

function loginDanger(email: string, password: string): boolean {
  const u = usersDanger.find((x) => x.email === email);
  if (!u) return false;
  // DANGER: comparing/storing plaintext
  return u.passwordPlain === password;
}

// === BETTER (but still not enough alone): fast hash with salt ===
// Fast hashes (SHA-256) are NOT suitable for passwords - too fast to brute force
// We show to illustrate; chapter 04 uses slow hashes
function hashWithSaltFast(password: string, salt: string): string {
  // DANGER DEMO: SHA-256 is fast - INSECURE for passwords
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

type UserFastHash = { email: string; salt: string; hash: string };
const usersFastHash: UserFastHash[] = [];
function registerFastHash(email: string, password: string) {
  const salt = crypto.randomBytes(16).toString("hex"); // unique per user
  const hash = hashWithSaltFast(password, salt);
  usersFastHash.push({ email, salt, hash });
}

function loginFastHash(email: string, password: string): boolean {
  const u = usersFastHash.find((x) => x.email === email);
  if (!u) return false;
  const hash = hashWithSaltFast(password, u.salt);
  // Compare hashes
  return hash === u.hash;
}

// === CONCEPT: pepper (secret not in DB) ===
// pepper = process.env.PASSWORD_PEPPER (or secret manager). DB leak + no pepper is better, but pepper alone not enough
const PEPPER = process.env.PASSWORD_PEPPER || "demo-pepper-change-me"; // DANGER DEMO placeholder

function hashWithSaltAndPepperConcept(password: string, salt: string): string {
  // Still fast hash here - just shows concept. Use slow hash in practice.
  return crypto.createHash("sha256").update(salt + PEPPER + password).digest("hex");
}

console.log("=== DANGER DEMO ===");
console.log("loginDanger correct:", loginDanger("alice@example.test", "Password123!"));
console.log("loginDanger wrong:", loginDanger("alice@example.test", "nope"));

console.log("\n=== Fast hash + salt (better than plaintext, but FAST hash INSECURE for passwords) ===");
registerFastHash("bob@example.test", "Password123!");
console.log("loginFastHash correct:", loginFastHash("bob@example.test", "Password123!"));
console.log("loginFastHash wrong:", loginFastHash("bob@example.test", "nope"));
// Note identical passwords give different hashes due to salt
registerFastHash("carol@example.test", "Password123!");
console.log("Different salts -> different hashes for same password:", usersFastHash[0].hash !== usersFastHash[1].hash);

console.log("\n=== Concept: pepper ===");
const salt = crypto.randomBytes(16).toString("hex");
console.log("With pepper concept hash:", hashWithSaltAndPepperConcept("test", salt).slice(0, 16) + "...");
console.log("WARNING: Use slow hashes (Argon2id/bcrypt/scrypt) for passwords - chapter 04");
```

Run:
```bash
cd auth-learn/api
npx tsx src/03-passwords-danger-vs-fix.ts
```

## 4) What I should see

- DANGER DEMO shows plaintext "works" but is catastrophic if leaked
- Fast hash + salt shows identical passwords produce different hashes
- Warnings about fast hashes being insecure for passwords

## 5) In a real multi-tenant e-commerce platform: one concrete example

If customer DB is breached:
- **Plaintext**: all customer passwords exposed immediately - attackers try them on other sites (credential stuffing)
- **Fast hash (SHA-256) no salt**: rainbow tables crack many common passwords quickly
- **Fast hash + salt**: common passwords still crackable quickly due to speed
- **Slow hash (Argon2id) + unique salt per password**: cracking is much slower/costlier, limiting damage
- **Pepper**: if stored in secret manager (separate from DB), stolen DB alone not enough - but if both stolen, less help; still defense in depth

All three actor types (customers, merchants, super admins) need strong password storage - super admin accounts are highest value targets.

## 6) When to use it and when NOT to

**Use:**
- Hash passwords with a **slow, adaptive** algorithm + **unique salt per password**
- Store hash and salt (salt can be stored with hash)
- Consider pepper as defense in depth (separate storage)
- Use encryption for data you need to recover; hashing for passwords

**When NOT to:**
- Never store plaintext
- Never use MD5/SHA-1/SHA-256 for passwords
- Don't rely on pepper alone
- Don't reuse salts

## 7) Common mistakes

- **Plaintext storage** - unforgivable
- **Fast hashes for passwords** - GPU/ASIC can try billions/sec
- **No salt / same salt** - rainbow tables
- **Encryption instead of hashing** - if key stolen, all passwords recovered
- **"Hashing is hashing"** - password hashing != general hashing

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Show that with same salt, identical passwords give same hash; with different salts, different hashes. Also explain why this matters.

**Hint:** Already shown - add two users with same password and different salts, print hashes.

**Reset steps:**
```bash
rm auth-learn/api/src/03-passwords-danger-vs-fix.ts
```

## 9) Next

Next chapter: [04-slow-hashes-and-demo.md](04-slow-hashes-and-demo.md) - Argon2id, bcrypt, scrypt; local demo of cracking speed on weak hashes; when to use each.
