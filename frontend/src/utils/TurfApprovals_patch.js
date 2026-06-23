// ── PATCH for TurfApprovals.jsx ──────────────────────────────────────────────
//
// 1. Add useNavigate at the top of the file imports:
//
//    import { useState, useEffect, useRef } from "react";
//    import { useNavigate } from "react-router-dom";          // ← ADD THIS
//
// 2. Inside the TurfApprovals() function body, add:
//
//    const navigate = useNavigate();                          // ← ADD THIS
//
// 3. Replace BOTH action buttons in the table tbody:
//
//    OLD:
//      {turf.approvalStatus === "pending" ? (
//        <button
//          className="ta-action-btn ta-action-btn--review"
//          onClick={() => setSelectedTurf(turf)}
//        >
//          Review
//        </button>
//      ) : (
//        <button
//          className="ta-action-btn ta-action-btn--view"
//          onClick={() => setSelectedTurf(turf)}
//        >
//          View Details
//        </button>
//      )}
//
//    NEW:
//      {turf.approvalStatus === "pending" ? (
//        <button
//          className="ta-action-btn ta-action-btn--review"
//          onClick={() => navigate(`/admin/turf/${turf._id}`)}
//        >
//          Review
//        </button>
//      ) : (
//        <button
//          className="ta-action-btn ta-action-btn--view"
//          onClick={() => navigate(`/admin/turf/${turf._id}`)}
//        >
//          View Details
//        </button>
//      )}
//
// That's all — the modal (ReviewModal) can stay or be removed; it is no
// longer triggered by the table buttons.
// ─────────────────────────────────────────────────────────────────────────────
