# 05. REST & Server Action API Specification

> **Base URL**: `https://home.janus-lab.duckdns.org` (or `http://localhost:8000` in dev)  
> **Protocols**: HTTPS, JSON payloads, Presigned S3 uploads  
> **Documentation Engine**: [Scalar](https://scalar.com/) mounted at `GET /docs`  
> **Contract Linting**: [Spectral](https://stoplight.io/open-source/spectral)  
> **API Testing**: [Bruno](https://www.usebruno.com/) (`bruno/` Git collection)  
> **Error Standard**: RFC 7807 Problem Details + GlitchTip Correlation IDs  

---

## 1. The 5 Janus "Golden Endpoints" (Mandatory Host Standards)

Every backend on Project Janus must implement these 5 operational endpoints to integrate cleanly with **Traefik**, **Uptime Kuma**, and **JanusDeck**:

### 1. `GET /healthz` (Liveness)
Tells Traefik and Docker if the web process is running.
* **Response `200 OK`**:
```json
{
  "status": "alive"
}
```

### 2. `GET /readyz` (Readiness)
Verifies that PostgreSQL 18, Redis 7.2, and MinIO S3 are actively reachable. Used by **Uptime Kuma** for proactive alerting.
* **Response `200 OK` (Healthy)**:
```json
{
  "status": "ok",
  "timestamp": "2026-11-10T15:40:00Z",
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```
*(If the database or storage fails, returns `HTTP 503 Service Unavailable` so Uptime Kuma triggers an immediate alert).*

### 3. `GET /version` (Release Metadata)
Allows JanusDeck and CI/CD tools to identify running commit & release metadata.
* **Response `200 OK`**:
```json
{
  "version": "1.0.0",
  "git_sha": "a1b2c3d4",
  "environment": "production"
}
```

### 4. `GET /openapi.json`
Machine-readable OpenAPI 3.1 specification used by Bruno, Spectral linter, and Scalar.

### 5. `GET /docs`
Interactive [Scalar](https://scalar.com/) documentation interface (zero external servers; embedded in runtime).

---

## 2. Standardized Error Format (RFC 7807) & GlitchTip

All errors returned by the API conform strictly to **RFC 7807 Problem Details**:

```json
{
  "type": "https://janus.homelab/errors/validation-failed",
  "title": "Validation Error",
  "status": 422,
  "detail": "Field 'barcode' is required and must be between 4 and 64 characters.",
  "instance": "/api/catalog/products",
  "trace_id": "req_84f93a902c"
}
```

### Request Correlation & GlitchTip Forensics:
1. Every incoming HTTP request is assigned a unique `X-Request-ID` header (UUID or nanoid).
2. The `trace_id` is included in all error responses, logged in structured JSON, and tagged in **GlitchTip (Sentry)**.
3. If an error occurs, searching the `trace_id` in GlitchTip (`https://errors.janus-lab.duckdns.org`) instantly reveals the stack trace, headers, and local variable dump.

---

## 2. Authentication & Admin-Controlled Provisioning

> **Security Rule**: No public self-registration. The first user to run the app becomes the **Admin**. All subsequent users must be invited/created by the Admin and set their password on first login.

### `GET /api/auth/status`
Checks if the system has been initialized with an Admin account.
* **Response `200 OK` (Uninitialized - First Run)**:
```json
{
  "initialized": false,
  "setupRequired": true
}
```

---

### `POST /api/auth/setup` (First-Run Admin Bootstrap)
Can only be called **once** when the database has 0 users. Creates the primary household and initial Admin user.

* **Request Body**:
```json
{
  "householdName": "Our Nook",
  "name": "Daniel",
  "email": "daniel@example.com",
  "password": "SecureAdminPassword123"
}
```
* **Response `201 Created`**: Sets HTTP-only `session` cookie and returns admin profile.

---

### `POST /api/auth/login`
Authenticates a user using email and password.

* **Response `200 OK`**:
```json
{
  "user": {
    "id": "user-uuid",
    "name": "Sarah",
    "email": "sarah@example.com",
    "role": "member",
    "mustSetPassword": false
  }
}
```
*(If `mustSetPassword: true`, frontend immediately redirects to the "Set Your Password" screen).*

---

### `POST /api/admin/invite-user` (Admin Only)
Admin provisions a new household member. Generates a 1-time activation code/link.

* **Request Body**:
```json
{
  "name": "Sarah",
  "email": "sarah@example.com",
  "role": "member" // "admin" | "member" | "viewer"
}
```
* **Response `201 Created`**:
```json
{
  "userId": "user-uuid",
  "inviteUrl": "https://home.janus-lab.duckdns.org/join?token=act_9f8a2bc4..."
}
```

---

### `POST /api/auth/set-password` (First Login Password Setup)
Called when an invited user opens their activation link or logs in for the first time.

* **Request Body**:
```json
{
  "token": "act_9f8a2bc4...",
  "password": "NewStrongUserPassword!"
}
```
* **Response `200 OK`**: Updates `password_hash`, clears `must_set_password` to `false`, sets session cookie, and logs the user in.

---

## 3. Presigned S3 Direct Uploads (MinIO Engine)

Bypasses the application container entirely when uploading images from smartphones.

### `POST /api/uploads/presigned-url`
Generates a temporary AWS S3 PUT URL for uploading product photos, receipts, or PDF manuals to MinIO.

* **Request Body**:
```json
{
  "folder": "products", // "products" | "receipts" | "manuals"
  "fileExtension": "webp", // "jpg" | "png" | "webp" | "pdf"
  "contentType": "image/webp"
}
```

* **Zod Schema**:
```typescript
export const presignedUrlSchema = z.object({
  folder: z.enum(["products", "receipts", "manuals"]),
  fileExtension: z.string().min(2).max(5),
  contentType: z.string().min(3),
});
```

* **Response `200 OK`**:
```json
{
  "uploadUrl": "https://s3.janus-lab.duckdns.org/janus-home/products/550e8400-e29b-41d4-a716-446655440000.webp?X-Amz-Algorithm=...",
  "fileKey": "products/550e8400-e29b-41d4-a716-446655440000.webp",
  "publicUrl": "https://s3.janus-lab.duckdns.org/janus-home/products/550e8400-e29b-41d4-a716-446655440000.webp"
}
```

---

## 3. Product Catalog & Barcode Scanner Endpoints

### `GET /api/products/scan/:barcode`
Fast barcode resolution endpoint. Checks local PostgreSQL catalog first. If not found, asynchronously queries Open Food Facts API and returns pre-populated data.

* **Response `200 OK` (Existing in Local Catalog)**:
```json
{
  "source": "local",
  "product": {
    "id": "e2a39b4f-8a03-4f18-a6d1-12a9efb8214b",
    "barcode": "5601009941123",
    "title": "Terra Nostra Pastured Whole Milk 1L",
    "brand": "Terra Nostra",
    "category": "Dairy",
    "unit": "l",
    "defaultPrice": "1.15",
    "imageKey": "products/terra-nostra.webp",
    "imageUrl": "https://s3.janus-lab.duckdns.org/janus-home/products/terra-nostra.webp"
  }
}
```

* **Response `200 OK` (New Barcode - Resolved via Open Food Facts)**:
```json
{
  "source": "openfoodfacts",
  "product": {
    "id": null,
    "barcode": "5449000000996",
    "title": "Coca-Cola Zero Sugar 330ml",
    "brand": "Coca-Cola",
    "category": "Beverage",
    "unit": "can",
    "defaultPrice": null,
    "imageKey": null,
    "imageUrl": "https://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.123.400.jpg"
  }
}
```

* **Response `404 Not Found` (Unknown Barcode)**:
```json
{
  "source": "not_found",
  "barcode": "9999999999999",
  "message": "Product not found. Open product creation sheet."
}
```

---

### `POST /api/products`
Creates a newly digitalized product in the household catalog.

* **Request Body**:
```json
{
  "barcode": "5601009941123",
  "title": "Terra Nostra Pastured Whole Milk 1L",
  "brand": "Terra Nostra",
  "category": "Dairy",
  "unit": "l",
  "defaultPrice": 1.15,
  "imageKey": "products/terra-nostra.webp"
}
```

* **Zod Schema**:
```typescript
export const createProductSchema = z.object({
  barcode: z.string().min(4).max(64),
  title: z.string().min(1).max(128),
  brand: z.string().max(64).optional(),
  category: z.string().default("General"),
  unit: z.string().default("pcs"),
  defaultPrice: z.number().positive().optional(),
  imageKey: z.string().optional(),
});
```

* **Response `201 Created`**: Returns the saved product record.

---

## 4. Collaborative Shopping Lists

### `GET /api/shopping-lists/active`
Retrieves the primary active grocery list with all items, grouped by store and category.

* **Response `200 OK`**:
```json
{
  "id": "list-uuid",
  "title": "Weekly Groceries",
  "storeName": "Supermarket",
  "totalItems": 12,
  "checkedItems": 4,
  "items": [
    {
      "id": "item-uuid-1",
      "productId": "prod-uuid",
      "title": "Terra Nostra Pastured Whole Milk 1L",
      "brand": "Terra Nostra",
      "category": "Dairy",
      "quantity": 2,
      "unit": "l",
      "estimatedPrice": 2.30,
      "isChecked": false,
      "imageUrl": "https://s3.janus-lab.duckdns.org/janus-home/products/..."
    }
  ]
}
```

---

### `PATCH /api/shopping-lists/:id/items/:itemId`
Toggles item checked status or edits quantity. Designed for instant optimistic updates.

* **Request Body**:
```json
{
  "isChecked": true,
  "quantity": 3
}
```

* **Response `200 OK`**:
```json
{
  "id": "item-uuid-1",
  "isChecked": true,
  "checkedAt": "2026-11-10T15:35:12Z"
}
```

### `POST /api/shopping-lists/:id/unpack`
Executed when you get home from the supermarket. Transfers collected cart items into **Home Stock**.

* **Request Body**:
```json
{
  "transferAll": false, // If true, transfers all collected items
  "itemIds": ["item-uuid-1", "item-uuid-2"], // Specific items to stock
  "targetLocation": "Fridge", // Optional override
  "logExpense": true, // Automatically logs the trip to Finance
  "totalAmount": 42.50
}
```

* **Zod Schema**:
```typescript
export const unpackCartSchema = z.object({
  transferAll: z.boolean().default(true),
  itemIds: z.array(z.string().uuid()).optional(),
  targetLocation: z.string().optional(),
  logExpense: z.boolean().default(false),
  totalAmount: z.number().positive().optional(),
});
```

* **Response `200 OK`**:
```json
{
  "success": true,
  "transferredCount": 8,
  "updatedStockIds": ["stock-uuid-1", "stock-uuid-2"],
  "listStatus": "unpacked"
}
```

---

## 5. Home Stock Inventory (Submodule 1)

### `GET /api/pantry`
List household items in stock, running low, or expiring soon.

* **Query Params**: `?status=running_low&location=Fridge`
* **Response `200 OK`**: Array of pantry items joined with product metadata.

### `PATCH /api/pantry/:id`
Update stock status (`in_stock` / `running_low` / `out_of_stock`) or decrement quantity.
