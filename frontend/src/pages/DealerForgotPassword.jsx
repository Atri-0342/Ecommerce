import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Envelope, Key, ArrowLeft, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

const DealerForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email Request, 2: OTP & New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/dealers/forgot-password", { email: formData.email });
      if (res.data.success) {
        toast.success("OTP sent to your email!");
        setStep(2);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }

    setLoading(true);
    try {
      const res = await axios.put("http://localhost:5000/dealers/reset-password", {
        email: formData.email,
        otp: formData.otp,
        password: formData.password
      });

      if (res.data.success) {
        toast.success("Password updated successfully!");
        navigate("/seller-login");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP or request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navigation />
      <Container className="my-auto py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <div style={{ height: "4px", backgroundColor: step === 1 ? "#6366f1" : "#10b981" }}></div>
              <Card.Body className="p-4 p-md-5">
                
                <Button 
                  variant="link" 
                  onClick={() => step === 1 ? navigate("/seller-login") : setStep(1)}
                  className="p-0 text-muted mb-4 text-decoration-none small d-flex align-items-center gap-1"
                >
                  <ArrowLeft size={14} /> Back
                </Button>

                <div className="text-center mb-4">
                  <div className={`rounded-circle d-inline-flex p-3 mb-3 ${step === 1 ? "bg-primary bg-opacity-10 text-primary" : "bg-success bg-opacity-10 text-success"}`}>
                    {step === 1 ? <Envelope size={32} weight="duotone" /> : <Key size={32} weight="duotone" />}
                  </div>
                  <h4 className="fw-bold">{step === 1 ? "Forgot Password" : "Reset Password"}</h4>
                  <p className="text-muted small">
                    {step === 1 
                      ? "Enter your business email to receive an OTP." 
                      : `Enter the 6-digit code sent to ${formData.email}`}
                  </p>
                </div>

                {step === 1 ? (
                  <Form onSubmit={handleRequestOTP}>
                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-bold text-secondary">Business Email</Form.Label>
                      <InputGroup className="bg-light rounded-3">
                        <InputGroup.Text className="bg-transparent border-0 pe-0 text-muted">
                          <Envelope size={18} />
                        </InputGroup.Text>
                        <Form.Control 
                          type="email" required placeholder="email@business.com"
                          className="bg-transparent border-0 py-2 shadow-none"
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </InputGroup>
                    </Form.Group>
                    <Button type="submit" disabled={loading} className="w-100 py-2 fw-bold rounded-pill border-0 d-flex align-items-center justify-content-center gap-2" style={{ backgroundColor: "#6366f1" }}>
                      {loading ? <Spinner size="sm" /> : <><PaperPlaneTilt size={18} weight="bold" /> Send OTP</>}
                    </Button>
                  </Form>
                ) : (
                  <Form onSubmit={handleResetPassword}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">6-Digit OTP</Form.Label>
                      <Form.Control 
                        type="text" required maxLength={6} placeholder="000000"
                        className="bg-light border-0 py-2 text-center fw-bold fs-5 shadow-none"
                        style={{ letterSpacing: "8px" }}
                        onChange={(e) => setFormData({...formData, otp: e.target.value})}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">New Password</Form.Label>
                      <Form.Control 
                        type="password" required placeholder="••••••••"
                        className="bg-light border-0 py-2 shadow-none"
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-bold text-secondary">Confirm Password</Form.Label>
                      <Form.Control 
                        type="password" required placeholder="••••••••"
                        className="bg-light border-0 py-2 shadow-none"
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      />
                    </Form.Group>

                    <Button type="submit" disabled={loading} className="w-100 py-2 fw-bold rounded-pill border-0 d-flex align-items-center justify-content-center gap-2 btn-success">
                      {loading ? <Spinner size="sm" /> : <><CheckCircle size={18} weight="bold" /> Update Password</>}
                    </Button>
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

export default DealerForgotPassword;