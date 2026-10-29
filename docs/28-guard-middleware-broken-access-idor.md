# 28: Guards, Middleware, Broken Access Control, IDOR

> **Goal:** Guard middleware, re-check in data layer, broken access control, IDOR.

## 1) Simple explanation (like I'm 7)

- **Guard/Middleware**: Bouncer at the door checking tickets
- **Data layer check**: Also check inside the warehouse - because someone might sneak past or call directly
- **Broken access control**: #1 on OWASP Top 10 - people doing things they shouldn't
- **IDOR (Insecure Direct Object Reference)**: Changing ID in URL to access someone else's stuff

Always check on server, never trust client.

## 2) Real name (technical)

- **Broken Access Control**: Failures in enforcing restrictions
- **IDOR**: Direct reference to object without authorization check
- **Defense in depth**: Check in middleware AND data layer
- **Horizontal/Vertical privilege escalation**

> **OWASP Top 10:** Broken Access Control is critical. Enforce deny by default everywhere.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/28-idor-danger-demo.ts
// DANGER DEMO
import express from "express";
const app = express();

// BAD: no ownership check
app.get("/orders/:id", (req:any,res:any)=>{
  // Returns any order by ID - IDOR!
  res.json({ orderId: req.params.id, userId: "someone-else" });
});

// GOOD: check ownership
app.get("/orders-good/:id", (req:any,res:any)=>{
  const order = { id: req.params.id, userId: "someone-else" };
  if (order.userId !== req.user.id) return res.status(403).json({error:"forbidden"});
  res.json(order);
});

app.listen(4150, ()=>console.log("Demo on 4150"));
```

**Reset:** `rm auth-learn/api/src/28-idor-danger-demo.ts`

**Next:** Batch 10 (29-31)
