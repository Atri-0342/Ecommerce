import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Fingerprint, 
  CheckCircle,
  Info
} from "@phosphor-icons/react";
import { Button, Form, Spinner, Alert, Card } from "react-bootstrap";

const SuccessVerifyOtp = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const { deliveryToken } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const themeColor = "#10b981"; // Emerald Green
  const OTP_LENGTH = 4;

  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otp.length !== OTP_LENGTH) {
      setError(`Please enter the ${OTP_LENGTH}-digit security OTP.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = { headers: { Authorization: `Bearer ${deliveryToken}` } };
      
      const payload = {
        orderId: id,
        newStatus: "Delivered",
        otpInput: otp
      };

      const { data } = await axios.put(`${API}/delivery/update-status`, payload, config);

      if (data.success) {
        // Navigate back to dashboard on success
        navigate("/delivery/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please check the OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(2, 44, 34, 0.9)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 3000 
    }}>
      <Card className="border-0 shadow-lg" style={{ width: '90%', maxWidth: '400px', borderRadius: '20px' }}>
        
        {/* Header Section */}
        <div className="text-center p-4">
          <div className="mb-3 d-inline-block p-3 rounded-circle" style={{ background: '#f0fdf4' }}>
            <Fingerprint size={40} color={themeColor} weight="duotone" />
          </div>
          <h4 className="fw-bold mb-1">Verify OTP</h4>
          <p className="text-muted small">Enter the code provided by customer to complete delivery</p>
        </div>

        <Card.Body className="px-4 pb-4 pt-0">
          {error && (
            <Alert variant="success" className="small py-2 text-center border-0" style={{background: '#f0fdf4', color: '#166534'}}>
              <Info size={16} className="me-2" />{error}
            </Alert>
          )}

          <Form onSubmit={handleVerify}>
            {/* OTP Input */}
            <div className="mb-4">
              <Form.Control
                type="text"
                inputMode="numeric"
                placeholder="0 0 0 0"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                className="text-center fw-bold border-2 shadow-none"
                style={{ 
                  fontSize: '2.5rem', letterSpacing: '0.8rem', borderRadius: '12px',
                  borderColor: '#d1fae5', color: '#064e3b', height: '80px'
                }}
                disabled={loading}
                autoFocus
              />
              <div className="text-center mt-2 text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                CUSTOMER SECURITY CODE
              </div>
            </div>

            <div className="d-grid gap-2">
              <Button 
                type="submit" 
                disabled={loading || otp.length !== OTP_LENGTH}
                className="py-3 fw-bold border-0 shadow-sm"
                style={{ backgroundColor: themeColor, borderRadius: '12px' }}
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <span className="d-flex align-items-center justify-content-center">
                    <CheckCircle size={20} className="me-2" /> Complete Delivery
                  </span>
                )}
              </Button>
              
              <Button 
                variant="link" 
                className="text-muted text-decoration-none small d-flex align-items-center justify-content-center"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                <ArrowLeft size={14} className="me-1" /> Back to Dashboard
              </Button>
            </div>
          </Form>
        </Card.Body>

        <Card.Footer className="bg-light border-0 py-3 text-center rounded-bottom-4">
          <small className="text-muted fw-bold" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            <ShieldCheck size={14} className="me-1 text-success" /> SECURE HANDSHAKE VERIFIED
          </small>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default SuccessVerifyOtp;