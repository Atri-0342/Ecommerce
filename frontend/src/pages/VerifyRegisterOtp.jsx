import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import React from "react";
import "./pages.css";

const VerifyRegisterOtp = () => {
  const API = import.meta.env.VITE_API_URL;

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30); // 30-second cooldown
  const [canResend, setCanResend] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  // Prevent error if page refreshed
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  // ✅ Timer Logic for Resend Button
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Verify OTP
  const handleVerify = async () => {
    if (!otp || otp.length < 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const res = await axios.post(`${API}/users/verify-register-otp`, { 
        email, 
        otp: Number(otp) 
      });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err?.response?.data?.message || "OTP verification failed");
    }
  };

  // ✅ Implemented Resend Logic
  const handleResend = async () => {
    if (!canResend) return;

    try {
      // Ensure this route exists in your backend
      const res = await axios.post(`${API}/users/resend-otp`, { email });
      
      alert("A new OTP has been sent to your email.");
      
      // Reset timer and disable resend button
      setCanResend(false);
      setTimer(60); // Increase cooldown to 60s for the next try
      setOtp(""); // Clear field for new code
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-box">
        <h2 className="otp-title">Verify OTP</h2>
        <p className="otp-subtext">Enter the 6-digit code sent to <strong>{email}</strong></p>

        <input
          type="text"
          className="otp-input"
          placeholder="000000"
          maxLength={6}
          value={otp}
          // Only allow numbers to be typed
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <button className="otp-btn" onClick={handleVerify}>
          Verify OTP
        </button>

        <p className="otp-resend">
          Didn’t receive OTP? {" "}
          <span 
            className={canResend ? "resend-active" : "resend-disabled"} 
            onClick={handleResend}
          >
            {canResend ? "Resend Now" : `Resend in ${timer}s`}
          </span>
        </p>
      </div>
    </div>
  );
};

export default VerifyRegisterOtp;