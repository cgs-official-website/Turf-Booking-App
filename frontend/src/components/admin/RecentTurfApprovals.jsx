import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { MOCK_TURFS } from "../../data/mockTurfs";
import "../../assets/styles/recentTurfApprovals.css";

function normalizeTurf(t) {
  const vendor = t.owner?.name ?? t.ownerName ?? t.vendor ?? "—";
  const city = t.city ?? (t.location ? t.location.split(",").pop().trim() : "—");
  return {
    ...t,
    vendor,
    city,
    date: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        })
      : "—",
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
  };
}

export default function RecentTurfApprovals({ limit = 5 }) {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get("/turfs/admin/all", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        
        const list = Array.isArray(data) ? data : [];
        const recent = [...list]
          .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
          .slice(0, limit)
          .map(normalizeTurf);
          
        setTurfs(recent);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        const recentMock = [...MOCK_TURFS]
          .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
          .slice(0, limit)
          .map(normalizeTurf);
        setTurfs(recentMock);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [limit]);

  return (
    <div className="rta-card">
      <div className="rta-card-header">
        <h2 className="rta-card-title">Turf Approvals</h2>
        <a
          href="#"
          className="rta-view-all"
          onClick={(e) => { e.preventDefault(); navigate("/admin/turf-approvals"); }}
        >
          View all →
        </a>
      </div>

      {loading ? (
        <div className="rta-loading"><span className="rta-spinner" /></div>
      ) : turfs.length === 0 ? (
        <p className="rta-empty">No recent turf approvals found.</p>
      ) : (
        <table className="rta-table">
          <thead>
            <tr>
              <th>TURF NAME</th>
              <th>VENDOR</th>
              <th>LOCATION</th>
              <th>SUBMITTED DATE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {turfs.map((turf) => (
              <tr key={turf._id}>
                <td className="rta-td-name">{turf.name}</td>
                <td className="rta-td-vendor">{turf.vendor}</td>
                <td className="rta-td-loc">{turf.city}</td>
                <td className="rta-td-date">{turf.date}</td>
                <td>
                  <span className={`rta-badge rta-badge--${turf.approvalStatus}`}>
                    {turf.approvalStatus.charAt(0).toUpperCase() + turf.approvalStatus.slice(1)}
                  </span>
                </td>
                <td>
                  <button 
                    className="rta-action-btn"
                    onClick={() => navigate(`/admin/turf-approvals/${turf._id}`)}
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
