import React, { useState, useEffect } from "react"; // Added useEffect
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Storefront, 
  HourglassLow, 
  IdentificationCard, 
  FileArrowUp, 
  TextColumns, 
  CheckCircle,
  ArrowLeft,
  Buildings,
  User,ArrowSquareIn,
  Envelope,
  Phone
} from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

const SellerRegistration = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    ownerName: "",
    email: "",
    phone: "",
    brandName: "",
    panNumber: "",
    aadharNumber: "",
    description: "",
    proof: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync Redux User data to Form State on mount
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        ownerName: user.name || "",
        email: user.email || "",
        phone: user.phoneNumber || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (!formData.ownerName || !formData.email || !formData.phone) {
      return toast.error("Please provide all contact details");
    }
    if (!formData.proof) return toast.error("Please upload identity proof");
    
    if (formData.aadharNumber.length !== 12) {
      return toast.error("Aadhaar Number must be exactly 12 digits");
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) {
        return toast.error("Invalid PAN format (e.g., ABCDE1234F)");
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("brandName", formData.brandName);
      data.append("panNumber", formData.panNumber);
      data.append("aadharNumber", formData.aadharNumber);
      data.append("description", formData.description);
      data.append("ownerName", formData.ownerName);
      data.append("email", formData.email);
      data.append("phone", formData.phone); 
      data.append("proof", formData.proof);

      const response = await axios.post(`${API}/dealers/apply`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true 
      });

      if (response.data.success) {
        setSubmitted(true);
        toast.success("Application submitted successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white min-vh-100 d-flex flex-column">
        <Container className="my-auto py-5 text-center">
          <div className="bg-light d-inline-block p-4 rounded-circle mb-4">
            <HourglassLow size={64} weight="duotone" className="text-primary animate-pulse" />
          </div>
          <h2 className="fw-bold display-6">Application Under Review</h2>
          <p className="text-muted mx-auto" style={{ maxWidth: "500px" }}>
            Thank you, <strong>{formData.ownerName}</strong>. Your merchant application for <strong>{formData.brandName}</strong> is being processed. 
          </p>
          <Button variant="primary" onClick={() => navigate("/")} className="rounded-pill px-5 py-3 fw-bold mt-4 shadow-sm">
            Return to Dashboard
          </Button>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={9}>
            

            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <Row className="g-0">
                {/* Left Sidebar */}
                <Col md={4} className="bg-primary text-white p-4 p-lg-5 d-flex flex-column justify-content-center">
                  <Storefront size={64} weight="duotone" className="mb-4 opacity-75" />
                  <h3 className="fw-bold">Merchant Portal</h3>
                  <p className="small opacity-75">Register to unlock bulk listing and direct payouts.</p>
                  <hr className="my-4 opacity-25" />
                  <div className="d-flex align-items-center mb-3">
                    <CheckCircle size={20} className="me-2 text-info" />
                    <span className="small">Verified Status</span>
                  </div>
                </Col>

                  {/* Form Section */}
<Col md={8} className="bg-white p-4 p-lg-5">
  <div className="mb-4 d-flex justify-content-between align-items-start">
    <div>
      <h4 className="fw-bold mb-1 text-dark">Business Registration</h4>
      <p className="text-muted small mb-0">Provide contact and legal details.</p>
    </div>
    
    {/* Merchant Login Link with Arrow */}
    <Button 
      variant="link" 
      onClick={() => navigate("/seller-login")} 
      className="text-decoration-none text-muted x-small fw-bold p-0 d-flex align-items-center opacity-75 hover-link"
    >
      MERCHANT LOGIN <ArrowSquareIn size={16} className="ms-1" weight="bold" />
    </Button>
  </div>
    {/* ... rest of your form ... */}

                  <Form onSubmit={handleSubmit}>
                    {/* Contact Details Row */}
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">Legal Name</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><User size={18}/></InputGroup.Text>
                          <Form.Control 
                            required
                            placeholder="Full Name"
                            value={formData.ownerName} 
                            onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                            className="border-start-0 py-2 border-secondary-subtle shadow-none" 
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">Email Address</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><Envelope size={18}/></InputGroup.Text>
                          <Form.Control 
                            required
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email} 
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="border-start-0 py-2 border-secondary-subtle shadow-none" 
                          />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">Phone Number</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><Phone size={18}/></InputGroup.Text>
                          <Form.Control 
                            required
                            type="tel"
                            placeholder="Contact Number"
                            value={formData.phone} 
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="border-start-0 py-2 border-secondary-subtle shadow-none" 
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">Brand / Shop Name</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><Buildings size={18} /></InputGroup.Text>
                          <Form.Control 
                            required 
                            placeholder="e.g. Atri's Tech Store" 
                            className="border-start-0 py-2 border-secondary-subtle shadow-none"
                            onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                          />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">PAN Card Number</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><IdentificationCard size={18} /></InputGroup.Text>
                          <Form.Control 
                            required 
                            placeholder="ABCDE1234F" 
                            className="border-start-0 py-2 text-uppercase border-secondary-subtle shadow-none"
                            onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Label className="x-small fw-bolder text-uppercase text-muted">Aadhaar (12 Digits)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light border-end-0 border-secondary-subtle"><TextColumns size={18} /></InputGroup.Text>
                          <Form.Control 
                            required 
                            type="text"
                            maxLength={12}
                            placeholder="0000 0000 0000" 
                            className="border-start-0 py-2 border-secondary-subtle shadow-none"
                            onChange={(e) => setFormData({...formData, aadharNumber: e.target.value.replace(/\D/g, '')})}
                          />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label className="x-small fw-bolder text-uppercase text-muted">Identity Proof (JPG)</Form.Label>
                      <div className="upload-zone p-4 border-dashed rounded-3 text-center bg-light position-relative">
                        <FileArrowUp size={32} className="text-primary mb-2" />
                        <p className="small mb-0 text-muted">
                          {formData.proof ? <span className="text-success fw-bold">{formData.proof.name}</span> : "Click to upload document"}
                        </p>
                        <Form.Control 
                          type="file" 
                          required 
                          accept=".pdf,image/*"
                          className="position-absolute top-0 start-0 opacity-0 w-100 h-100 cursor-pointer"
                          onChange={(e) => setFormData({...formData, proof: e.target.files[0]})}
                        />
                      </div>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="x-small fw-bolder text-uppercase text-muted">Products to be Sold</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2} 
                        required
                        placeholder="Explain your business and product category..." 
                        className="py-2 border-secondary-subtle shadow-none"
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                    </Form.Group>

                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-100 py-3 fw-bold rounded-3 shadow-sm border-0 btn-primary-gradient"
                    >
                      {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                      {loading ? "Processing..." : "Submit Registration"}
                    </Button>
                  </Form>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
      <style>{`
        .x-small { font-size: 0.7rem; letter-spacing: 0.5px; }
        .border-dashed { border: 2px dashed #cbd5e1; transition: all 0.3s ease; }
        .border-dashed:hover { border-color: #6366f1; background-color: #f1f5f9 !important; }
        .cursor-pointer { cursor: pointer; }
        .btn-primary-gradient { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; transition: all 0.3s ease; }
        .btn-primary-gradient:hover { background: linear-gradient(135deg, #4f46e5, #4338ca); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  );
};

export default SellerRegistration;