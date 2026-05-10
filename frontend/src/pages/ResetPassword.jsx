import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams(); // Grabs the token from the URL automatically
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const API = import.meta.env.VITE_API_URL;

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/users/reset-password/${token}`, { password });
      alert("Password updated! Please login with your new password.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Link expired or invalid");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-box">
        <h2 className="otp-title">New Password</h2>
        <p className="otp-subtext">Enter your new secure password below.</p>
        <form onSubmit={handleReset}>
          <input 
            type="password" 
            className="otp-input" 
            placeholder="Min 6 characters"
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button type="submit" className="otp-btn otp-btn-success w-100">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;