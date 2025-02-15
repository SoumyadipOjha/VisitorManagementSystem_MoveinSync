import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin-login");
  };

  return (
    <nav style={styles.navbar}>
      <h2 style={styles.logo}>Visitor Management</h2>
      <div style={styles.navLinks}>
        <Link to="/" style={styles.link}>Home</Link>
        {!token ? (
          <Link to="/admin-login" style={styles.link}>Admin Login</Link>
        ) : (
          <>
            <Link to="/pending-visitors" style={styles.link}>Pending Visitors</Link>
            <button onClick={handleLogout} style={styles.button}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    background: "linear-gradient(135deg, #1e3c72, #2a5298)",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    position: "fixed",
    width: "96%",
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#fff",
    margin: 0,
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    margin: "0 15px",
    fontSize: "18px",
    fontWeight: "500",
    transition: "color 0.3s ease-in-out",
  },
  linkHover: {
    color: "#ffcc00",
  },
  button: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    padding: "8px 15px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "5px",
    transition: "background 0.3s ease-in-out",
  },
  buttonHover: {
    background: "#cc0000",
  },
};

export default Navbar;
