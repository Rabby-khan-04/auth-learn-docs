# 18: User Enumeration and Timing Attacks

> **Goal:** Prevent user enumeration and understand timing attack basics.

## 1) Simple explanation (like I'm 7)

If your website says "That email isn't registered" vs "Wrong password", bad guys can figure out who has accounts. Also, if checking a real account takes longer than fake account (because of password hash), they can tell the difference.

We need same messages and try to make timing similar.

## 2) Real name (technical)

- **User enumeration**: Attacker discovers valid usernames/emails by different responses/messages/timings
- **Timing attack**: Inferring information from execution time
- **Constant-time comparison**: Compare strings in time independent of where difference is (important for tokens)
- **Password hash verification**: Argon2/bcrypt do work anyway - helps equalize timing somewhat, but message must be same

> **OWASP Authentication Cheat Sheet:** Use generic error messages for login/forgot password, ensure consistent timing.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/18-enumeration-timing.ts
import express from "express";
import argon2 from "argon2";
import crypto from "crypto";

const app = express();
app.use(express.json());

// Simulated user
const hash = await argon2.hash("password", { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });

app.post("/login", async (req,res)=>{
  const { email, password } = req.body as any;
  // Always do same work if possible
  if (email === "exists@example.test") {
    const ok = await argon2.verify(hash, password);
    // Same message regardless
    return res.status(401).json({ error: "Invalid credentials" });
  } else {
    // Do dummy work to equalize timing
    await argon2.verify(hash, "dummy-password-to-equalize");
    return res.status(401).json({ error: "Invalid credentials" });
  }
});

app.listen(4120, ()=>console.log("Demo on 4120"));
```

**Notes:** Use same error message. Do dummy verification for non-existent users. For token comparison use constant-time (crypto.timingSafeEqual).

**Reset:** `rm auth-learn/api/src/18-enumeration-timing.ts`

**Next:** Batch 7 (19-21)
