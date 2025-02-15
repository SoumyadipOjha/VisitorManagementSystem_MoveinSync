import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/admin/login", { email, password });
      localStorage.setItem("token", response.data.token);
      navigate("/pending-visitors"); // Redirect after login
    } catch (error) {
      alert("Invalid Credentials");
    }
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    //   background: "linear-gradient(135deg, #1e3c72, #2a5298)",
    },
    box: {
      background: "#ffffff",
      padding: "2rem",
      borderRadius: "10px",
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)",
      width: "350px",
      textAlign: "center",
    },
    heading: {
      color: "#333",
      marginBottom: "1rem",
      fontSize: "24px",
    },
    input: {
      width: "100%",
      padding: "10px",
      margin: "10px 0",
      border: "1px solid #ddd",
      borderRadius: "5px",
      fontSize: "16px",
      outline: "none",
      transition: "all 0.3s ease-in-out",
    },
    inputFocus: {
      borderColor: "#1e3c72",
      boxShadow: "0px 0px 8px rgba(30, 60, 114, 0.3)",
    },
    button: {
      width: "100%",
      background: "#1e3c72",
      color: "white",
      padding: "12px",
      border: "none",
      borderRadius: "5px",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer",
      transition: "all 0.3s ease-in-out",
    },
    buttonHover: {
      background: "#2a5298",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.heading}>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            onFocus={(e) => (e.target.style = { ...styles.input, ...styles.inputFocus })}
            onBlur={(e) => (e.target.style = styles.input)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            onFocus={(e) => (e.target.style = { ...styles.input, ...styles.inputFocus })}
            onBlur={(e) => (e.target.style = styles.input)}
          />
          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => (e.target.style.background = styles.buttonHover.background)}
            onMouseOut={(e) => (e.target.style.background = styles.button.background)}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
