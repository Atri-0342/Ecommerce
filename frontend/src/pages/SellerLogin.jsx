import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Spinner, InputGroup } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LockKey, Envelope, ArrowRight } from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { setMerchantSuccess } from "../store/authSlice"; // Adjust path as needed

const SellerLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Load API URL from Vite Environment
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("merchantToken");
    if (token) navigate("/dealer-dashboard");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Normalize email before sending
      const loginData = {
        ...formData,
        email: formData.email.toLowerCase().trim()
      };

      // 2. API Call to merchant login route
      const response = await axios.post(`${API_URL}/dealers/login`, loginData);
      
      if (response.data.success) {
        toast.success("Login Successful!");

        // 3. Dispatch to Redux Store (This handles LocalStorage + State)
        dispatch(setMerchantSuccess({
          token: response.data.accessToken,
          merchant: response.data.dealer
        }));

        navigate("/dealer-dashboard");
      }
    } catch (err) {
      // Handle login errors
      const msg = err.response?.data?.message || "Server connection failed.";
      toast.error(msg);
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Container className="my-auto py-5">
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <div style={{ height: "4px", backgroundColor: "#6366f1" }}></div>
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3">
                    <LockKey size={32} weight="duotone" />
                  </div>
                  <h4 className="fw-bold text-dark">Merchant Portal</h4>
                  <p className="text-muted small">Manage your business account</p>
                </div>

                <Form onSubmit={handleLogin}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-secondary">Business Email</Form.Label>
                    <InputGroup className="bg-white border rounded-3 overflow-hidden shadow-sm">
                      <InputGroup.Text className="bg-transparent border-0 pe-0 text-muted">
                        <Envelope size={18} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="email" 
                        placeholder="email@business.com" 
                        required 
                        className="border-0 py-2 shadow-none"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label className="small fw-bold text-secondary">Password</Form.Label>
                    <InputGroup className="bg-white border rounded-3 overflow-hidden shadow-sm">
                      <InputGroup.Text className="bg-transparent border-0 pe-0 text-muted">
                        <LockKey size={18} />
                      </InputGroup.Text>
                      <Form.Control 
                        type="password" 
                        placeholder="••••••••" 
                        required 
                        className="border-0 py-2 shadow-none"
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </InputGroup>
                  </Form.Group>

                  <div className="text-end mb-4">
                    <Link to="/dealer-forgot-password" size="sm" className="text-primary text-decoration-none fw-bold" style={{ fontSize: '12px' }}>
                      Forgot Password?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-100 py-2 fw-bold rounded-pill border-0 d-flex align-items-center justify-content-center gap-2 btn-primary shadow"
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>Sign In <ArrowRight size={18} weight="bold" /></>
                    )}
                  </Button>
                </Form>
              </Card.Body>
              <div className="bg-light p-3 text-center border-top">
                <p className="small mb-0 text-muted">
                  Not a merchant yet? <Link to="/seller-registration" className="text-primary text-decoration-none fw-bold">Register Business</Link>
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SellerLogin;