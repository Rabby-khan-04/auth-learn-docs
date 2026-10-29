# 08: Cookies in Depth

> **Goal:** Understand HttpOnly, Secure, SameSite, Domain, Path, `__Host-` prefix, and why cookies are usually safer than localStorage for session/tokens.

## 1) Simple explanation (like I'm 7)

Cookies are like sticky notes the browser gives to a website and brings back each time.

- **HttpOnly**: The sticky note says "only the website can read me, JavaScript can't peek". Stops some theft if bad JS runs.
- **Secure**: Only give/send over HTTPS (encrypted). Don't send on http.
- **SameSite**: Says when to send to other sites. Helps stop tricking browser into sending your cookie.
- **Domain/Path**: Where the cookie is valid.
- **__Host- prefix**: Super strict rules - must be Secure, no Domain, Path=/, makes it harder to mess up.
- **localStorage**: JavaScript can read/write it. If bad JS (XSS) runs, it can steal everything in localStorage. Cookies with HttpOnly are harder to steal via JS.

## 2) Real name (technical)

- **Cookie attributes**:
  - `HttpOnly`: Prevents access via `document.cookie` (mitigates XSS theft of cookie)
  - `Secure`: Cookie only sent over HTTPS
  - `SameSite=Strict|Lax|None`: Controls cross-site sending. `None` requires `Secure`
  - `Domain`: Scope to domain and subdomains (be careful)
  - `Path`: Scope to path
  - `Max-Age`/`Expires`: Expiry
- **Cookie prefixes** (RFC 6265bis):
  - `__Host-`: Must have `Secure`, must not have `Domain`, must have `Path=/`. Host-only.
  - `__Secure-`: Must have `Secure`. Less strict than `__Host-` but still requires Secure.
- **localStorage/sessionStorage**: Accessible to JavaScript on same origin - vulnerable to XSS token theft.
- **XSS**: Cross-site scripting can run malicious JS; HttpOnly cookies not readable by JS.
- **CSRF**: Cross-site request forgery tricks browser to send cookies - mitigated by SameSite and CSRF tokens.

> **OWASP Session Management/Cheat Sheets:** Prefer HttpOnly Secure cookies for sessions. Be careful with SameSite=None. Use `__Host-` prefix when possible.

## 3) Example: complete, runnable code with comments

Local demo showing cookie setting (concept). In practice test over http in dev, but use Secure in prod.

Create `src/08-cookies-demo.ts`:
```ts
// auth-learn/api/src/08-cookies-demo.ts
// DEMO: Cookie attributes (local only)

import express from "express";

const app = express();
app.use(express.json());

app.post("/set-cookie-safe", (_req, res) => {
  // SAFE pattern (concept): HttpOnly, Secure (in prod), SameSite=Lax, Path=/, __Host- prefix ideal
  // In dev over http, Secure may prevent sending in some browsers; adjust for local testing
  res.cookie("__Host-session", "demo-session-id", {
    httpOnly: true,
    secure: false, // set true in HTTPS prod
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 10,
  });
  res.json({ message: "Set __Host-session cookie (demo)" });
});

app.post("/set-cookie-bad-localstorage-analogy", (_req, res) => {
  res.json({ 
    warning: "If you put tokens in localStorage, JS can read them. Use HttpOnly cookies.",
    example: "localStorage.setItem('token', '...') // XSS can steal this"
  });
});

app.get("/read-cookie", (req, res) => {
  const cookies = req.headers.cookie || "";
  res.json({ cookies });
});

app.listen(4050, () => {
  console.log("Demo listening on http://localhost:4050");
});
```

Run and test:
```bash
cd auth-learn/api
npx tsx src/08-cookies-demo.ts
# In browser dev tools or curl -v to see Set-Cookie
curl -v -X POST "http://localhost:4050/set-cookie-safe"
```

## 4) What I should see

- `Set-Cookie: __Host-session=...; Path=/; HttpOnly; SameSite=Lax; Max-Age=...` (Secure may be omitted in our dev demo)
- Cookie not accessible to JS when HttpOnly
- `__Host-` prefix enforces strict rules

## 5) In a real multi-tenant e-commerce platform: one concrete example

For three separate actor auth systems:
- **Customer auth**: Cookie name `__Host-cust_session` or similar, scoped to tenant domain
- **Merchant auth**: Separate cookie name `__Host-merc_session` (different secret/system)
- **Super admin**: Separate cookie `__Host-sadmin_session`
- All HttpOnly, Secure, SameSite=Lax/Strict as appropriate, Path=/
- Prevents token/cookie confusion between systems

## 6) When to use it and when NOT to

**Use:**
- HttpOnly + Secure + SameSite for session cookies
- `__Host-` prefix when possible
- Cookies for server-side sessions

**When NOT to:**
- Don't store sensitive tokens in localStorage if you can use HttpOnly cookies
- Don't use `SameSite=None` unless necessary and always with `Secure`
- Don't set `Domain` unnecessarily (breaks `__Host-` rules)
- Don't rely on cookies alone for CSRF in all cases - understand SameSite

## 7) Common mistakes

- **Missing HttpOnly** - XSS can steal
- **Missing Secure** - sent over http
- **Wrong SameSite** - breaks flows or doesn't protect
- **Using localStorage for auth tokens** - common XSS theft vector
- **Sharing cookie names across systems** - confusion/leakage

## 8) Try it yourself: exercise with hint and reset steps

**Exercise:** Try to set a cookie with `Domain` and see why `__Host-` prefix would reject it. Also test SameSite effects conceptually.

**Hint:** `__Host-` requires no Domain attribute.

**Reset steps:**
```bash
rm auth-learn/api/src/08-cookies-demo.ts
```

## 9) Next

Next chapter: [09-sessions-vs-jwt-honest.md](09-sessions-vs-jwt-honest.md) - Honest comparison and when to use each.
