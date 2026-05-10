import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken, setUser } from "../store/authSlice";
import React from "react";
import "./pages.css";

const VerifyLoginOtp = () => {
  const API = import.meta.env.VITE_API_URL;

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30); // 30-second cooldown
  const [canResend, setCanResend] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const emailFromState = location.state?.email;

  // Store email for refresh handling
  useEffect(() => {
    if (emailFromState) {
      localStorage.setItem("loginEmail", emailFromState);
    }
  }, [emailFromState]);

  const email = emailFromState || localStorage.getItem("loginEmail");

  // Redirect if email missing
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

  const handleVerify = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      const res = await axios.post(
        `${API}/users/verify-login-otp`,
        { email, otp: Number(otp) },
        { withCredentials: true }
      );

      alert(res.data.message);

      dispatch(setAccessToken(res.data.accessToken));
      dispatch(setUser(res.data.user));

      localStorage.removeItem("loginEmail");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "OTP verification failed");
    }
  };

  // ✅ Implemented Resend Logic
  const handleResend = async () => {
    if (!canResend) return;

    try {
      // Note: This usually hits your login route again to re-trigger the OTP
      const res = await axios.post(`${API}/users/resend-otp`, { email });
      
      alert("A new login OTP has been sent to your email.");
      
      // Reset timer and disable button
      setCanResend(false);
      setTimer(60); // Increase cooldown to 60s for subsequent tries
      setOtp(""); 
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-box">
        <h2 className="otp-title">Verify Login OTP</h2>
        <p className="otp-subtext">
          Enter the OTP sent to your email: <strong>{email}</strong>
        </p>

        <input
          type="text"
          className="otp-input"
          placeholder="000000"
          maxLength={6}
          value={otp}
          // Prevents non-numeric characters
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <button className="otp-btn otp-btn-success" onClick={handleVerify}>
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

export default VerifyLoginOtp;