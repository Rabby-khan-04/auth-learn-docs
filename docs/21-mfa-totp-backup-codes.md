# 21: MFA, TOTP, Backup Codes

> **Goal:** Understand MFA, TOTP (Time-based One-Time Password), backup codes, and recovery.

## 1) Simple explanation (like I'm 7)

Password is "something you know". MFA adds another proof:
- **TOTP**: App on your phone (like Google Authenticator) generates a 6-digit code that changes every 30 seconds. "Something you have".
- **Backup codes**: One-time codes you print/save in case you lose your phone.

Even if someone steals your password, they can't log in without the second factor.

## 2) Real name (technical)

- **MFA**: Multi-factor authentication using different factor categories
- **TOTP (RFC 6238)**: Time-based OTP using shared secret + current time, HMAC-SHA1 usually
- **OTP secret**: Base32 encoded secret shared between server and app
- **QR code**: Encodes `otpauth://` URI for easy setup
- **Backup codes**: Single-use recovery codes, store hashed
- **Replay prevention**: Don't allow same TOTP code twice

> **OWASP:** Offer MFA, use TOTP securely, provide recovery options.

## 3) Example: complete, runnable code with comments

Need `otplib` or implement simply. Install otplib:
```bash
cd auth-learn/api && npm install otplib qrcode 2>&1 | tail -5
```

```ts
// auth-learn/api/src/21-totp-demo.ts
import { authenticator } from "otplib";
import qrcode from "qrcode";

const secret = authenticator.generateSecret();
const user = "alice@example.test";
const service = "auth-learn";
const otpauth = authenticator.keyuri(user, service, secret);

console.log("Secret:", secret);
console.log("otpauth:", otpauth);
qrcode.toString(otpauth, { type: "terminal" }, (err, url) => {
  if (!err) console.log(url);
});

const token = authenticator.generate(secret);
console.log("Current token:", token);
console.log("Verify:", authenticator.verify({ token, secret }));
```

**Notes:** Store secret encrypted/securely. Generate backup codes as random, store hashed, mark used. Don't allow TOTP reuse.

**Reset:** `rm auth-learn/api/src/21-totp-demo.ts`

**Next:** Batch 8 (22-24)
