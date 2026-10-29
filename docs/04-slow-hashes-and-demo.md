# 04: Slow Hashes (Argon2id, bcrypt, scrypt) and Cracking Speed Demo

> **Goal:** Learn why slow, adaptive password hashes are needed, compare Argon2id, bcrypt, scrypt, run a local demo showing timing differences, and understand how to choose parameters.

## 1) Simple explanation (like I'm 7)

Imagine someone steals the list of hashed passwords.

- If using a *fast blender* (SHA-256), a bad guy can try millions of passwords per second on their computer/GPUs.
- If using a *slow blender* (Argon2id/bcrypt/scrypt), each try takes time and uses memory. They can only try thousands (or much fewer) per second.
- Slowing it down makes guessing expensive and time-consuming. Even if they guess, it's not instant.
- You can also make the blender *tunable* - as computers get faster, you can make it slower.

## 2) Real name (technical)

- **Password hashing function (PHF)**: Designed to be slow and memory-hard to resist brute force and GPU/ASIC attacks. 
- **Argon2**: Modern PHF, winner of Password Hashing Competition (2015). **Argon2id** is the recommended hybrid variant (resists side-channels and GPU attacks). Configurable: time cost, memory cost, parallelism.
- **bcrypt**: Based on Blowfish, widely used, battle-tested. Has a cost factor (log rounds). Memory usage is relatively fixed/smaller than Argon2id. Still acceptable if configured well.
- **scrypt**: Memory-hard PHF, designed to make large-scale custom hardware attacks expensive. Also tunable (N, r, p).
- **Key derivation function (KDF)**: Some KDFs (like PBKDF2) exist; for passwords prefer memory-hard PHFs (Argon2id/scrypt) over PBKDF2 where possible per current guidance.

> **OWASP Password Storage Cheat Sheet (current guidance):** Prefer **Argon2id**. If not available, use **bcrypt** with appropriate cost. scrypt is also acceptable. Avoid fast hashes and PBKDF2-HMAC-SHA256 only if no better option and configured very high (but memory-hard is stronger).

## 3) Example: complete, runnable code with comments

We'll install `argon2` and `bcryptjs` in `auth-learn/api` (done). Create a local demo that hashes the same password with each and measures time - **illustrative only**, not a full cracking rig.

Create `src/04-slow-hashes-timing-demo.ts`:
```ts
// auth-learn/api/src/04-slow-hashes-timing-demo.ts
// DEMO: Timing comparison of slow password hashes (local only)
// Illustrative - shows relative cost, not full crack speed

import argon2 from "argon2";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const password = "CorrectHorseBatteryStaple!"; // example, not real

async function demo() {
  console.log("=== Slow hash timing demo (illustrative) ===");
  console.log("Password:", password);
  console.log("");

  // Argon2id - recommended by many modern guides
  // Defaults vary; be explicit in prod. These are reasonable demo params.
  const t0 = performance.now();
  const argonHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19MB
    timeCost: 2,
    parallelism: 1,
  });
  const t1 = performance.now();
  console.log("[Argon2id] time:", (t1-t0).toFixed(2), "ms");
  console.log("[Argon2id] hash:", argonHash.slice(0, 40) + "...");
  
  const v0 = performance.now();
  await argon2.verify(argonHash, password);
  const v1 = performance.now();
  console.log("[Argon2id] verify:", (v1-v0).toFixed(2), "ms");
  console.log("");

  // bcrypt
  const b0 = performance.now();
  const bcryptHash = await bcrypt.hash(password, 12); // cost factor 12
  const b1 = performance.now();
  console.log("[bcrypt] rounds:", 12, "time:", (b1-b0).toFixed(2), "ms");
  console.log("[bcrypt] hash:", bcryptHash.slice(0, 40) + "...");
  
  const bv0 = performance.now();
  await bcrypt.compare(password, bcryptHash);
  const bv1 = performance.now();
  console.log("[bcrypt] verify:", (bv1-bv0).toFixed(2), "ms");
  console.log("");

  // SHA-256 (fast) for contrast - INSECURE for passwords
  const s0 = performance.now();
  const salt = crypto.randomBytes(16);
  const shaHash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex"); // PBKDF2 is better than raw SHA but still not memory-hard
  const s1 = performance.now();
  console.log("[PBKDF2-HMAC-SHA256] iter:", 100000, "time:", (s1-s0).toFixed(2), "ms (for contrast)");
  console.log("[PBKDF2-HMAC-SHA256] hash:", shaHash.slice(0, 40) + "...");
  console.log("");
  
  console.log("Note: Faster on attacker GPUs/ASICs. Memory-hard (Argon2id/scrypt) increases cost more.");
  console.log("OWASP prefers Argon2id. bcrypt acceptable. Choose params for your server (target ~100-500ms is rough guidance).");
}

demo().catch(console.error);
```

Run:
```bash
cd auth-learn/api
npx tsx src/04-sslow-hashes-timing-demo.ts  # wait, filename typo check
```

Wait - I named it `04-slow-hashes-timing-demo.ts` above. Let us fix filename if needed and run:
```bash
cd auth-learn/api
npx tsx src/04-slow-hashes-timing-demo.ts
```

Also create a quick "cracking speed" conceptual demo (DANGER DEMO label) - show how many attempts possible:
```ts
// auth-learn/api/src/04-crack-speed-concept.ts (DANGER DEMO)
// Conceptual only - never use for real cracking
console.log("Concept: Fast hash -> millions of attempts/sec (attacker hardware); Slow hash -> thousands/sec or less");
console.log("Memory-hard -> even more expensive on custom hardware");
```

But better to just document - running actual cracking is not necessary; concept is enough. The timing demo is sufficient.

## 4) What I should see

- Argon2id takes noticeable time (tens-hundreds of ms depending on params/hardware)
- bcrypt similar scale depending on rounds
- PBKDF2 with 100k iterations faster than memory-hard in practice, but still not memory-hard
- All slow relative to raw SHA-256

Times will vary by machine - that's fine.

## 5) In a real multi-tenant e-commerce platform: one concrete example

- **Customer passwords**: Use Argon2id. If breached, attackers can't instantly test billions of guesses.
- **Merchant passwords**: Same strong PHF (merchants have elevated access to stores/payments).
- **Super admin passwords**: Highest priority - use strongest reasonable params, plus MFA (later chapters). Compromise is catastrophic.
- **API keys/service credentials**: Different story (often random high-entropy, maybe hashed differently or stored as HMAC) - covered later.

## 6) When to use it and when NOT to

**Use:**
- Argon2id for new systems (check library support)
- bcrypt if Argon2 unavailable and well-tested
- scrypt as alternative
- Tune parameters to be slow enough on your target hardware (~0.1-0.5s is common guidance, don't overdo)

**When NOT to:**
- Don't use MD5/SHA-1/SHA-256/SHA-3 raw for passwords
- Don't use the same params everywhere blindly - test on your deployment
- Don't make it so slow it DoS's your login endpoint

## 7) Common mistakes

- **Using fast hashes** - still the biggest mistake
- **Not using salt** - built into these functions
- **Too low cost** - defaults may be outdated
- **Too high cost** - login becomes slow/unusable
- **Rehashing unnecessarily** - fine on login if upgrading params
- **Using PBKDF2 when memory-hard available** - not wrong but less ideal per OWASP current guidance

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Try different Argon2id params (increase memoryCost/timeCost) and see how time changes. Also verify wrong password fails.

**Hint:**
```ts
await argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
await argon2.verify(hash, "wrong"); // false
```

**Reset steps:**
```bash
rm auth-learn/api/src/04-slow-hashes-timing-demo.ts
rm auth-learn/api/src/04-crack-speed-concept.ts 2>&1 | true
```

## 9) Next

Next chapter: [05-password-rules-and-breached-checks.md](05-password-rules-and-breached-checks.md) - Modern password rules (NIST-aligned), breached password checks using k-anonymity safely.
