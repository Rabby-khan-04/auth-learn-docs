# 26: Authorization - RBAC, Permissions, Ownership

> **Goal:** Understand RBAC, permissions, ownership checks, deny by default.

## 1) Simple explanation (like I'm 7)

Authentication = who you are. Authorization = what you can do.
- **RBAC (Role-Based Access Control)**: "If you're a manager, you can do manager things"
- **Permissions**: Specific actions like "edit product"
- **Ownership**: "You can only edit YOUR product, even if you're a merchant"
- **Deny by default**: If not allowed, say no.

## 2) Real name (technical)

- **RBAC**: Assign roles to users, roles have permissions
- **ABAC preview**: Attribute-based (covered next)
- **Ownership check**: Verify resource belongs to user/tenant
- **Least privilege**: Give minimum needed
- **Deny by default**: Explicit allow only

> **OWASP Access Control Cheat Sheet:** Deny by default, enforce at server/data layer, check ownership.

## 3) Example: complete, runnable code with comments

```ts
// auth-learn/api/src/26-rbac-ownership.ts
import express from "express";
const app = express();
app.use(express.json());

// Deny by default
function requireRole(roles:string[]){
  return (req:any,res:any,next:any)=>{
    if(!req.user) return res.status(401).json({error:"unauth"});
    if(!roles.includes(req.user.role)) return res.status(403).json({error:"forbidden"});
    next();
  };
}

// Ownership check
app.get("/products/:id", (req:any,res:any)=>{
  const product = { id: req.params.id, merchantId: "m1" };
  // Must check ownership
  if (req.user.role === "merchant" && product.merchantId !== req.user.merchantId) {
    return res.status(403).json({error:"not your product"});
  }
  res.json(product);
});

app.listen(4140, ()=>console.log("Demo on 4140"));
```

**Reset:** `rm auth-learn/api/src/26-rbac-ownership.ts`

**Next:** 27-abac-policy-functions.md
