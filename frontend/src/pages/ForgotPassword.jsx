import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./pages.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const API = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/users/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-box">
        <h2 className="otp-title">Forgot Password</h2>
        <p className="otp-subtext">Enter your email and we'll send you a reset link.</p>
        
        {message && <div className="alert alert-info py-2" style={{fontSize: '0.9rem'}}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="email" 
            className="otp-input" 
            placeholder="Enter registered email"
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <button type="submit" className="otp-btn otp-btn-success w-100">Send Reset Link</button>
        </form>
        
        <div className="mt-3 text-center">
          <Link to="/login" className="text-decoration-none small text-muted">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;