import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const PendingVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/admin-login"); // Redirect if not logged in
      return;
    }
    fetchPendingVisitors();
  }, []); // Removed token & navigate dependencies to avoid unnecessary re-renders

  const fetchPendingVisitors = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/visitors/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVisitors(response.data);
    } catch (error) {
      console.error("Error fetching visitors", error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisitorStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/visitors/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVisitors((prev) => prev.filter((visitor) => visitor._id !== id));
      alert(`Visitor ${status} successfully!`);
    } catch (error) {
      console.error("Error updating status", error);
      alert("Failed to update visitor status.");
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Pending Visitors</h2>

      {loading ? (
        <p style={styles.message}>Loading pending visitors...</p>
      ) : visitors.length === 0 ? (
        <p style={styles.message}>No pending visitors</p>
      ) : (
        <div style={styles.visitorList}>
          {visitors.map((visitor) => (
            <div key={visitor._id} style={styles.visitorCard}>
              <img
                src={visitor.photo ? `http://localhost:5000${visitor.photo}` : "/default-avatar.png"}
                alt={visitor.fullName || "Visitor"}
                style={styles.visitorPhoto}
                // onError={(e) => (e.target.src = "/default-avatar.png")}  // Fallback if image fails to load
              />
              <div style={styles.visitorInfo}>
                <p><strong>Name:</strong> {visitor.fullName}</p>
                <p><strong>Purpose:</strong> {visitor.purpose}</p>
                <p><strong>Host:</strong> {visitor.hostEmployee}</p>
                <p><strong>Company:</strong> {visitor.company || "N/A"}</p>
                <div style={styles.actionButtons}>
                  <button style={styles.approve} onClick={() => updateVisitorStatus(visitor._id, "approved")}>
                    Approve
                  </button>
                  <button style={styles.reject} onClick={() => updateVisitorStatus(visitor._id, "rejected")}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "80px auto 20px", // Adjusted for fixed navbar
    padding: "20px",
    textAlign: "center",
  },
  heading: {
    fontSize: "26px",
    color: "#333",
    marginBottom: "20px",
  },
  message: {
    fontSize: "18px",
    color: "#555",
  },
  visitorList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    justifyContent: "center",
  },
  visitorCard: {
    background: "#fff",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    transition: "transform 0.3s ease-in-out",
  },
  visitorCardHover: {
    transform: "scale(1.05)",
  },
  visitorPhoto: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    objectFit: "cover",
    marginBottom: "10px",
  },
  visitorInfo: {
    fontSize: "16px",
    color: "#444",
    marginBottom: "10px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    marginTop: "10px",
  },
  approve: {
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease-in-out",
  },
  reject: {
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    padding: "8px 12px",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    borderRadius: "5px",
    transition: "background 0.3s ease-in-out",
  },
};

export default PendingVisitors;
