# Turf API Testing Guide

Use these API details to test the Vendor KYC reuse and Turf creation logic via Postman, Insomnia, or any other API client.

---

## 1. Login Vendor

**Endpoint:** `POST /api/auth/register` (To create the vendor)
**Role:** Public
**Description:** Vendor signs up and provides their KYC and EB Bill.

**JSON Body:**
```json
{
  "name": "Vendor Bob",
  "email": "bob@example.com",
  "password": "Password@123",
  "phone": "9876543210",
  "role": "vendor",
  "profileImage": "https://example.com/profile.jpg",
  "aadhar": "https://example.com/aadhar.jpg",
  "pan": "https://example.com/pan.jpg",
  "gst": "https://example.com/gst.jpg",
  "ebBill": "https://example.com/eb-bill.jpg"
}
```

*Note: Save the `token` from the response to use as `Authorization: Bearer <token>` in the next steps.*

---

## 2. Create First Turf (Reuses profile docs)

**Endpoint:** `POST /api/turfs`
**Role:** Vendor
**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Description:** Creates the first turf for this vendor. Because their documents are saved during registration, we DO NOT pass Aadhar, PAN, GST, or EB Bill here. They will be pulled from the vendor's profile automatically.

**JSON Body:**
```json
{
  "name": "Vendor's First Turf",
  "location": "Chennai",
  "mainImage": "https://example.com/image.jpg",
  "pricePerHour": {
    "basePrice": 1000
  }
}
```

---

## 3. Create Second Turf (Reuse KYC docs)

**Endpoint:** `POST /api/turfs`
**Role:** Vendor
**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Description:** Creates a second turf for the SAME vendor. Notice that we **DO NOT** pass any documents. The backend will automatically fetch Aadhar, PAN, GST, and EB Bill from the vendor's profile and mark them as Verified.

**JSON Body:**
```json
{
  "name": "Vendor's Second Turf",
  "location": "Coimbatore",
  "mainImage": "https://example.com/image2.jpg",
  "pricePerHour": {
    "basePrice": 1200
  }
}
```

---

## 4. Get Turf Details (Admin Verification)

**Endpoint:** `GET /api/turfs/admin/:id`
**Role:** Admin
**Headers:**
- `Authorization: Bearer <admin_token>`

**Description:** Allows the admin to view the newly created turf. You will see that the second turf contains all 4 documents in the response, and Aadhar, PAN, and GST will have a `status` of `"verified"`.
