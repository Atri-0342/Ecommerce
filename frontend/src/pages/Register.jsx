import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./pages.css";
import React from "react";

const Register = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
  });

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.address || !form.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(`${API}/users/register`, form);

      alert(res.data.message);

      // 🔐 Redirect to OTP verification page
      navigate("/verify-register", {
        state: { email: form.email }
      });

    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "REGISTRATION FAILED.");
    }
  };

  return (
    <div className="register-page">
      <div className="register-box">
        <h3 className="title">Registration</h3>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name:</label>
            <input type="text" name="name" value={form.name} onChange={onChange} />
          </div>

          <div className="input-group">
            <label>Email:</label>
            <input type="email" name="email" value={form.email} onChange={onChange} />
          </div>

          <div className="input-group">
            <label>Phone:</label>
            <input type="tel" name="phone" value={form.phone} onChange={onChange} />
          </div>

          <div className="input-group">
            <label>Address:</label>
            <input type="text" name="address" value={form.address} onChange={onChange} />
          </div>

          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
            />
          </div>

          <button className="submit-btn" type="submit">
            Register
          </button>
        </form>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 14 }}>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;