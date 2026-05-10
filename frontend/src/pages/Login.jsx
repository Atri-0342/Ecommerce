import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./pages.css";
import React from "react";

const Login = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please fill email and password");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/users/login`,
        form,
        { withCredentials: true }
      );

      alert(res.data.message);

      // 🔐 GO TO OTP PAGE
      navigate("/verify-login", {
        state: { email: form.email }
      });

    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message || "Login failed. Please check your credentials."
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h3 className="title">Login</h3>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
            />
          </div>

          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
            />
          </div>

          {/* ✅ FORGOT PASSWORD LINK ADDED HERE */}
          <div style={{ textAlign: "right", marginBottom: "15px" }}>
            <Link 
              to="/forgot-password" 
              style={{ fontSize: "13px", color: "#666", textDecoration: "none" }}
              onMouseOver={(e) => e.target.style.color = "#007bff"}
              onMouseOut={(e) => e.target.style.color = "#666"}
            >
              Forgot Password?
            </Link>
          </div>

          <button className="submit-btn" type="submit">
            Login
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14 }}>
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;