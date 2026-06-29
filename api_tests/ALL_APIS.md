# Turf Backend Full API Documentation

## ADMIN API

### POST /api/admin/login
- **Method**: POST
- **Role**: Public
- **Bearer**: No

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### GET /api/admin/profile
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### PUT /api/admin/profile
- **Method**: PUT
- **Role**: Public
- **Bearer**: No

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### PUT /api/admin/profile-image
- **Method**: PUT
- **Role**: Public
- **Bearer**: No

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### DELETE /api/admin/profile-image
- **Method**: DELETE
- **Role**: Public
- **Bearer**: No

---

### GET /api/admin/login-activity
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/admin/dashboard
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/admin/vendors
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/admin/vendors/:vendorId/bookings
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/admin/vendors/:vendorId/recent-bookings
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/admin/bookings
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### DELETE /api/admin/vendors/:vendorId
- **Method**: DELETE
- **Role**: Public
- **Bearer**: No

---

## AUTH API

### POST /api/auth/register
- **Method**: POST
- **Role**: Public
- **Bearer**: No

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### POST /api/auth/login
- **Method**: POST
- **Role**: Public
- **Bearer**: No

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

## BOOKING API

### POST /api/booking/
- **Method**: POST
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### GET /api/booking/my
- **Method**: GET
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/booking/:id
- **Method**: GET
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### PUT /api/booking/:id/confirm
- **Method**: PUT
- **Role**: vendor,admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### PUT /api/booking/:id/reject
- **Method**: PUT
- **Role**: vendor,admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

## INDEX API

### GET /api/vendor/dashboard
- **Method**: GET
- **Role**: vendor
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### POST /api/reviews
- **Method**: POST
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### GET /api/reviews/my
- **Method**: GET
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/reviews/turf/:turfId
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### DELETE /api/reviews/:id
- **Method**: DELETE
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

## NOTIFICATION API

### GET /api/notification/
- **Method**: GET
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### PATCH /api/notification/:id/read
- **Method**: PATCH
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

## REPORT API

### GET /api/report/my
- **Method**: GET
- **Role**: vendor
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

## SUBSCRIPTION API

### GET /api/subscription/plans
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/subscription/plans/:id
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### DELETE /api/subscription/plans/:id
- **Method**: DELETE
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/subscription/my
- **Method**: GET
- **Role**: vendor
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### POST /api/subscription/renew
- **Method**: POST
- **Role**: vendor
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

## TURF API

### GET /api/turf/
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/turf/search
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/turf/admin/all
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/turf/admin/:id
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/turf/pending
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### PATCH /api/turf/:id/approve
- **Method**: PATCH
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### PATCH /api/turf/:id/reject
- **Method**: PATCH
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### GET /api/turf/:id
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### GET /api/turf/:id/slots
- **Method**: GET
- **Role**: Public
- **Bearer**: No

---

### DELETE /api/turf/:id
- **Method**: DELETE
- **Role**: vendor,admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

## USER API

### GET /api/user/profile
- **Method**: GET
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### PUT /api/user/profile
- **Method**: PUT
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### PUT /api/user/change-password
- **Method**: PUT
- **Role**: Authenticated User (Any)
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

**JSON Body:**
```json
{
  // Add request body fields here
}
```

---

### GET /api/user/
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### GET /api/user/:id
- **Method**: GET
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

### DELETE /api/user/:id
- **Method**: DELETE
- **Role**: admin
- **Bearer**: Yes (Requires Authorization: Bearer <token>)

---

