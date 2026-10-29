# 33: Auth in Next.js

> **Goal:** Cookies in Server Components/Route Handlers, middleware route protection (not enough alone), client guards UX only.

## 1) Simple explanation (like I'm 7)

- **Server Components**: Run on server - can read cookies directly
- **Route Handlers**: API routes in Next.js
- **Middleware**: Runs before request - can redirect, but can be bypassed if someone calls API directly
- **Client components**: Run in browser - can hide buttons but bad guys can ignore and call API directly

**Always re-check auth on the server/data layer.**

## 2) Real name (technical)

- **Server Components**: Can access cookies via `cookies()` 
- **Middleware**: Edge/runtime middleware for route protection (UX + some protection)
- **Route Handlers**: Must verify auth
- **Client-side guards**: Only for UX, not security
- **Defense in depth**: Middleware + server checks

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/web/app/api/me/route.ts (concept)
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-cust_session");
  if (!session) return NextResponse.json({ error: "unauth" }, { status: 401 });
  // Verify session server-side
  return NextResponse.json({ user: "..." });
}
```

**Reset:** N/A (conceptual in web/)

**Next:** 34-audit-logs-my-devices.md
