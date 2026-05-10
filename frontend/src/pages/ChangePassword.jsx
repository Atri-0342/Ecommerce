import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { 
  Key, 
  EnvelopeOpen, 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  EyeSlash,
  Lock,
  CheckCircle
} from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const API = import.meta.env.VITE_API_URL;

  const [step, setStep] = useState(1); // 1: Enter New Password, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // STEP 1: Validate passwords and request OTP
  const handleInitiateChange = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);
    try {
      // Trigger the OTP to the user's email
      const res = await axios.post(`${API}/users/resend-otp`, { 
        email: user?.email 
      });
      
      if (res.status === 200) {
        toast.success(`Verification code sent to ${user?.email}`);
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Finalize password change with OTP
  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length < 6) {
      return toast.error("Please enter a valid 6-digit OTP");
    }

    setLoading(true);
    try {
      const res = await axios.put(
        `${API}/users/change-password-otp`, 
        {
          email: user?.email,
          otp: formData.otp,
          newPassword: formData.newPassword
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success("Password updated successfully!");
        navigate("/profile/security");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Button 
              variant="link" 
              className="text-decoration-none text-muted mb-3 p-0 d-flex align-items-center gap-2"
              onClick={() => step === 2 ? setStep(1) : navigate(-1)}
            >
              <ArrowLeft size={18} /> {step === 2 ? "Change Password Details" : "Back"}
            </Button>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="p-4 text-center bg-white border-bottom">
                <div className="p-3 bg-primary-subtle d-inline-block rounded-circle mb-3">
                  {step === 1 ? (
                    <Lock size={32} weight="duotone" className="text-primary" />
                  ) : (
                    <EnvelopeOpen size={32} weight="duotone" className="text-primary" />
                  )}
                </div>
                <h4 className="fw-bold mb-1">
                  {step === 1 ? "Set New Password" : "Verify OTP"}
                </h4>
                <p className="text-muted small">
                  {step === 1 
                    ? "Choose a strong password for your account" 
                    : `Enter the code sent to ${user?.email}`}
                </p>
              </div>

              <Card.Body className="p-4">
                {step === 1 ? (
                  <Form onSubmit={handleInitiateChange}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold">New Password</Form.Label>
                      <InputGroup className="bg-light rounded-3 overflow-hidden border">
                        <InputGroup.Text className="bg-transparent border-0"><Key size={18} /></InputGroup.Text>
                        <Form.Control
                          name="newPassword"
                          type={showPassword ? "text" : "password"}
                          className="bg-transparent border-0 shadow-none"
                          placeholder="••••••••"
                          required
                          value={formData.newPassword}
                          onChange={handleChange}
                        />
                        <Button variant="link" className="text-muted border-0 shadow-none" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </Button>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-bold">Confirm Password</Form.Label>
                      <InputGroup className="bg-light rounded-3 overflow-hidden border">
                        <InputGroup.Text className="bg-transparent border-0"><ShieldCheck size={18} /></InputGroup.Text>
                        <Form.Control
                          name="confirmPassword"
                          type="password"
                          className="bg-transparent border-0 shadow-none"
                          placeholder="••••••••"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                      </InputGroup>
                    </Form.Group>

                    <Button 
                      type="submit" 
                      className="w-100 py-2 fw-bold rounded-pill border-0"
                      style={{ backgroundColor: "#6366f1" }}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Get Verification Code"}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleVerifyAndSubmit}>
                    <Form.Group className="mb-4 text-center">
                      <Form.Label className="small fw-bold text-muted d-block mb-3">
                        6-Digit Security Code
                      </Form.Label>
                      <Form.Control
                        name="otp"
                        type="text"
                        placeholder="000000"
                        className="text-center fw-bold fs-3 py-2 bg-light border-0 shadow-none rounded-3"
                        style={{ letterSpacing: "8px" }}
                        maxLength="6"
                        required
                        autoFocus
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      className="w-100 py-2 fw-bold rounded-pill border-0 d-flex align-items-center justify-content-center gap-2"
                      style={{ backgroundColor: "#10b981" }}
                      disabled={loading}
                    >
                      {loading ? "Updating..." : (
                        <>
                          <CheckCircle size={20} weight="bold" />
                          Complete Update
                        </>
                      )}
                    </Button>
                    
                    <div className="text-center mt-3">
                      <p className="small text-muted">
                        Didn't get the code?{" "}
                        <span 
                          className="text-primary fw-bold" 
                          style={{ cursor: "pointer" }}
                          onClick={handleInitiateChange}
                        >
                          Resend
                        </span>
                      </p>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ChangePassword;