# 05: Password Rules and Breached Password Checks

> **Goal:** Understand modern password rules (NIST-aligned), why complexity rules can backfire, and how to safely check for breached passwords using k-anonymity.

## 1) Simple explanation (like I'm 7)

Old advice: "Use a capital letter, number, symbol!" 
New advice: "Use a long passphrase you can remember. Don't reuse passwords."

Also - if your password appeared in a big leak before, bad guys already know it. We should tell people "this password was seen in a breach, pick another" but *without sending the whole password to some website*.

The trick is like looking up a partial fingerprint - only send first few letters of a hash, get matches back, check locally.

## 2) Real name (technical)

- **NIST SP 800-63B (current guidance)**: Recommends length-based rules over composition rules. Minimum length >=8 (often >=15 recommended), block common/compromised passwords, no mandatory periodic password changes unless compromise suspected, allow paste, support Unicode.
- **Password blocklist**: Reject passwords that are common, predictable, or found in breaches.
- **HaveIBeenPwned (HIBP) Pwned Passwords**: Database of known breached passwords. 
- **k-anonymity model**: When checking, hash password with SHA-1, send first 5 hex chars of hash to API, get all hash suffixes with that prefix, check locally if full hash appears. Password never leaves device in full.
- **Credential stuffing**: Using breached username/password pairs on other sites.

> **OWASP Authentication Cheat Sheet:** Follow modern guidance (NIST-aligned), check against breached password lists, use slow hashes.

## 3) Example: complete, runnable code with comments

**Safe demo using k-anonymity concept** (we'll call HIBP API in demo - it's public; still safe pattern). Run locally only.

Create `src/05-breached-password-check.ts`:
```ts
// auth-learn/api/src/05-breached-password-check.ts
// DEMO: k-anonymity breached password check (local only)
// Uses HIBP Pwned Passwords API range endpoint - safe pattern

import crypto from "crypto";

async function isPwned(password: string): Promise<{ pwned: boolean; count?: number }> {
  // 1) Hash password with SHA-1 (as per HIBP API)
  const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  
  // 2) Send only prefix to API (k-anonymity)
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      "Add-Padding": "true", // recommended by HIBP
      "User-Agent": "auth-learn-demo"
    }
  });
  
  if (!res.ok) {
    throw new Error(`HIBP error: ${res.status}`);
  }
  
  const text = await res.text();
  // 3) Check if our suffix appears in results
  const lines = text.split("\n");
  for (const line of lines) {
    const [hashSuffix, countStr] = line.split(":");
    if (hashSuffix === suffix) {
      return { pwned: true, count: parseInt(countStr) };
    }
  }
  return { pwned: false };
}

async function demo() {
  console.log("=== Breached password check (k-anonymity) demo ===");
  // Common breached password for demo
  const test1 = "password123";
  const test2 = "CorrectHorseBatteryStaple!UniqueExample2026"; // unlikely to be breached
  
  console.log("Checking:", test1);
  const r1 = await isPwned(test1);
  console.log("Pwned:", r1.pwned, r1.count ? `(seen ${r1.count} times)` : "");
  
  console.log("\nChecking:", test2);
  const r2 = await isPwned(test2);
  console.log("Pwned:", r2.pwned);
  
  console.log("\nNote: Only first 5 chars of SHA-1 hash sent. Password never transmitted.");
}

demo().catch(console.error);
```

Run:
```bash
cd auth-learn/api
npx tsx src/05-breached-password-check.ts
```

Also document password rules:
- **Do:** require minimum length (e.g., 12-15+), check against blocklist/breaches, allow long passphrases, allow all printable chars
- **Don't:** require specific char classes, force rotation, disallow paste, give hints

## 4) What I should see

- `password123` is likely pwned with high count
- A long unique passphrase likely not pwned
- No full password sent in network request (only prefix)

## 5) In a real multi-tenant e-commerce platform: one concrete example

During registration/change password for any actor (customer/merchant/super admin):
1. User enters password
2. Check length >= minimum
3. Check against breached passwords via k-anonymity (client-side or server-side)
4. If pwned, reject with message "This password has appeared in a data breach. Please choose a different password."
5. Hash with Argon2id + unique salt before storing
6. For super admins especially, enforce stronger requirements and MFA

## 6) When to use it and when NOT to

**Use:**
- Block breached passwords
- Use k-anonymity (don't send full password/hash)
- Follow NIST-aligned length-based approach
- Educate users about passphrases

**When NOT to:**
- Don't email passwords or give specific hints
- Don't rely only on complexity rules
- Don't call third-party APIs with full passwords
- Don't force periodic changes

## 7) Common mistakes

- **Sending full password to API** - defeats purpose
- **Using fast hash for pwned check** - HIBP uses SHA-1 for its DB; we follow their scheme
- **Blocking all passwords with symbols** - hurts usability
- **Not checking on change password/reset** - important
- **Storing blocklists in plaintext logs** - don't log passwords

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Add a simple local blocklist check (top 10 common passwords) before calling API.

**Hint:**
```ts
const blocklist = ["password", "123456", "qwerty", ...];
if (blocklist.includes(password.toLowerCase())) return { pwned: true, count: "local" };
```

**Reset steps:**
```bash
rm auth-learn/api/src/05-breached-password-check.ts
```

## 9) Next

Next chapter: [06-sessions-intro.md](06-sessions-intro.md) - Server-side sessions, session IDs, entropy, storage considerations.
