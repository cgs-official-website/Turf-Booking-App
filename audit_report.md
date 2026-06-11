# Turf Booking Backend Audit Report

## 1. Executive Summary
This audit report presents a comprehensive review of the Turf Booking Application backend. The codebase has a solid foundation, utilizing standard MVC architectural patterns with Express and Mongoose. The routing, middleware, and controller layers are well-organized. 

However, there are a few **Critical** and **High** severity issues that need addressing before production deployment. The most significant issues are related to race conditions during booking creation and a logic error in slot availability calculation where incorrect booking status strings are used.

---

## 2. API Inventory

| Method | Route | Controller | Middleware | Auth Required |
|--------|-------|------------|------------|---------------|
| POST | `/api/auth/register` | `auth.controller.register` | None | No |
| POST | `/api/auth/login` | `auth.controller.login` | None | No |
| GET | `/api/turfs/` | `turf.controller.getAllTurfs` | None | No |
| GET | `/api/turfs/:id` | `turf.controller.getTurfById` | None | No |
| GET | `/api/turfs/:id/slots` | `turf.controller.getAvailableSlots` | None | No |
| POST | `/api/turfs/` | `turf.controller.addTurf` | `protect`, `authorizeRoles("vendor", "admin")`, `validate` | Yes (Vendor/Admin) |
| PUT | `/api/turfs/:id` | `turf.controller.updateTurf` | `protect`, `authorizeRoles("vendor", "admin")`, `validate` | Yes (Vendor/Admin) |
| DELETE | `/api/turfs/:id` | `turf.controller.deleteTurf` | `protect`, `authorizeRoles("vendor", "admin")` | Yes (Vendor/Admin) |
| POST | `/api/bookings/` | `booking.controller.createBooking` | `protect`, `validate` | Yes (User) |
| GET | `/api/bookings/my` | `booking.controller.getMyBookings` | `protect` | Yes (User) |
| GET | `/api/bookings/turf/:turfId`| `booking.controller.getTurfBookings` | `protect`, `authorizeRoles("vendor", "admin")` | Yes (Vendor/Admin) |
| GET | `/api/bookings/:id` | `booking.controller.getBookingById` | `protect` | Yes (User) |
| PUT | `/api/bookings/:id/confirm`| `booking.controller.confirmBooking` | `protect`, `authorizeRoles("vendor", "admin")` | Yes (Vendor/Admin) |
| PUT | `/api/bookings/:id/reject` | `booking.controller.rejectBooking` | `protect`, `authorizeRoles("vendor", "admin")` | Yes (Vendor/Admin) |
| GET | `/api/users/profile` | `user.controller.getMyProfile` | `protect` | Yes (User) |
| PUT | `/api/users/profile` | `user.controller.updateMyProfile` | `protect` | Yes (User) |
| PUT | `/api/users/change-password`| `user.controller.changePassword` | `protect` | Yes (User) |
| GET | `/api/users/` | `user.controller.getAllUsers` | `protect`, `authorizeRoles("admin")` | Yes (Admin) |
| GET | `/api/users/:id` | `user.controller.getUserById` | `protect`, `authorizeRoles("admin")` | Yes (Admin) |
| DELETE | `/api/users/:id` | `user.controller.deleteUser` | `protect`, `authorizeRoles("admin")` | Yes (Admin) |
| POST | `/api/admin/create` | `admin.controller.createAdmin` | `validate` | No |
| POST | `/api/admin/login` | `admin.controller.loginAdmin` | `validate` | No |
| GET | `/api/admin/profile` | `admin.controller.getProfile` | `authorizeAdmin` | Yes (Admin) |

*Observation*: Route `POST /api/admin/create` lacks authorization middleware which may allow anyone to create an admin account.

---

## 3. Security Report

### Authentication & Authorization Audit
* **JWT Verification**: Token verification and expiration logic are correctly handled in `auth.middleware.js` using `protect`. Missing, invalid, or expired tokens correctly fail with 401 Unauthorized.
* **Role Authorization**: `authorizeRoles` accurately secures routes based on role (User, Vendor, Admin). Vendors cannot access Admin APIs and vice versa.
* **Unauthorized Access**: Vendor attempts to approve/reject bookings of another vendor's turf correctly fail (Validation check is present in `confirmBooking` and `rejectBooking`).

### Identified Vulnerabilities
* **[Critical] Unprotected Admin Creation**: `admin.routes.js` `POST /create` does not have authorization. Anyone might be able to create an admin account.
* **[Critical] Race Condition in Booking**: `createBooking` in `booking.service.js` checks for overlapping bookings using `Booking.findOne()`, and then calls `Booking.create()`. These two operations are not atomic. Two concurrent requests for the exact same slot will both pass the conflict check and create double bookings.
* **[High] Weak Validation for Sport Type**: In `Turf.js`, the `enum` validation for `sportType` is commented out (`// enum: ["football", ... ]`). Arbitrary strings can be submitted.

---

## 4. Booking Logic Report

### Status Transitions
Expected Flow: `pending -> confirmed/rejected`.
* **Transitions**: `booking.service.js` strictly requires `booking.bookingStatus === "pending"` to allow confirmation or rejection.
* **Invalid Transitions**:
  - `confirmed -> pending`: Prevented.
  - `rejected -> confirmed`: Prevented.
  - `confirmed -> rejected`: Prevented.

### Slot Availability & Overlaps
* **Overlap Check (Booking Creation)**: Handled properly in `booking.service.js` using MongoDB queries (`startTime: { $lt: endTime }, endTime: { $gt: startTime }`).
* **Slot Calculation Bug**: In `getAvailableSlots` (`turf.service.js`), the query ignores cancelled bookings:
  `bookingStatus: { $ne: "cancelled" }`
  However, in the `Booking.js` model, the enum values are `pending`, `confirmed`, `rejected`. The status `cancelled` does not exist. **Consequently, "rejected" bookings will still be treated as occupied slots, blocking availability.**

---

## 5. Worst-Case Scenario Report

| Scenario | Test Case | Expected Result | Actual Implementation Result | Status |
|----------|-----------|-----------------|------------------------------|--------|
| **Double Booking** | User A books 13:30-15:30. User B attempts 14:00-15:00. | Rejected | Rejected (Caught by `$lt/$gt` query) | ✅ Pass |
| **Race Condition** | Two users book same slot at the exact same millisecond. | Rejected | Both requests pass, creating duplicate bookings | ❌ Fail (Vulnerable) |
| **Invalid Times** | 15:00 -> 14:00 | Rejected | Rejected (`endMinutes <= startMinutes` check) | ✅ Pass |
| **Same Time** | 15:00 -> 15:00 | Rejected | Rejected (`endMinutes <= startMinutes` check) | ✅ Pass |
| **Invalid Turf** | Booking with a non-existent ObjectId | 404 Error | 404 Error (`!turf`) | ✅ Pass |
| **Deleted Turf** | Turf gets deleted before booking completes | Handled Gracefully | 404 Error (`!turf`) | ✅ Pass |
| **Unauthorized Vendor** | Vendor attempts to confirm another vendor's booking | Rejected | 403 Access Denied (`turf.owner !== vendorId`) | ✅ Pass |
| **Invalid Status** | DB Injection (`bookingStatus = "random"`) | Protected | Mongoose Enum Validation throws error | ✅ Pass |

---

## 6. Performance & Database Report

* **Missing Indexes**: The `Booking` model lacks compound indexes on fields queried together often. `turf`, `bookingDate`, `startTime`, and `endTime` should have a compound index because they are queried on every single booking creation check.
* **Missing Indexes**: The `Turf` model is queried by `location` using a `$regex: location, $options: "i"` scan which is extremely slow on large datasets without a text index.
* **N+1 Query Risks**: `.populate()` is heavily utilized across `getUserBookings`, `getTurfBookings`, etc., effectively mitigating most raw N+1 issues. However, populating deep relationships without field selection constraints can bloat memory over time.

---

## 7. Final Risk Assessment & Recommendations

### Issues List

#### Critical
1. **Race Condition in `createBooking`**: Concurrent API requests can double-book the same slot. **Recommendation**: Implement a distributed lock (e.g., Redis) or use MongoDB Transactions / Unique Compound Index.
2. **Unsecured Admin Creation**: The `/admin/create` endpoint is public. **Recommendation**: Remove this endpoint or secure it behind an existing Admin authorization middleware.
3. **Slot Availability Bug**: `getAvailableSlots` filters by `{ $ne: "cancelled" }` instead of `{ $ne: "rejected" }`. **Recommendation**: Update the service logic to match the Model enum values.

#### High
1. **Missing Enums**: `Turf.js` has commented out `sportType` enum. **Recommendation**: Restore the enum constraints.

#### Medium
1. **Database Indexes**: The absence of compound indexes on `Booking` (`turf`, `bookingDate`) will cause linear time `O(n)` scans when checking for slot conflicts. **Recommendation**: Add a compound index.

#### Low
1. **Time Validation**: Time format `HH:MM` is split blindly without regex formatting. `25:99` could potentially be calculated. **Recommendation**: Use a Joi Regex pattern to ensure proper `HH:MM` formatting.

### Production Readiness Score

* **Authentication & Users**: 85% (Due to unprotected admin route)
* **Turfs**: 95% (Missing index & enum validation)
* **Bookings**: 80% (Critical race condition & slot availability bug)
* **Admin**: 90%
* **Overall Backend Completion**: **87%**

**Conclusion**: The application is not yet ready for production. The critical issues (Race conditions, Slot availability logic, and Admin route exposure) must be fixed before deploying.
