import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { 
  Form, Button, Card, Container, 
  Row, Col, Spinner, InputGroup, Alert 
} from "react-bootstrap";
import { 
  Envelope, Lock, ArrowRight, 
  WarningCircle, Truck, Eye, EyeSlash 
} from "@phosphor-icons/react";
import { setDeliverySuccess } from "../../store/authSlice"; 

const DeliveryLogin = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // POST request to your updated controller
      const { data } = await axios.post(`${API}/delivery/login`, formData);

      if (data.success) {
        // payload matches: { token: data.token, person: data.person }
        dispatch(setDeliverySuccess({ 
          token: data.token, 
          person: data.person 
        }));

        navigate("/delivery/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your work email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="p-4 p-md-5 bg-white">
                
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center mb-3 rounded-circle shadow-sm"
                    style={{ width: "64px", height: "64px", backgroundColor: "#e8f5e9" }}>
                    <Truck size={32} weight="duotone" className="text-success" />
                  </div>
                  <h4 className="fw-bold text-dark">Rider Portal</h4>
                  <p className="text-muted small">Sign in to start your shift</p>
                </div>

                {error && (
                  <Alert variant="danger" className="d-flex align-items-center gap-2 border-0 rounded-3 py-2 mb-4">
                    <WarningCircle size={20} weight="fill" />
                    <span className="small">{error}</span>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Work Email</Form.Label>
                    <InputGroup className="bg-light rounded-3 overflow-hidden border">
                      <InputGroup.Text className="bg-transparent border-0 text-muted">
                        <Envelope size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="rider@yukti.com"
                        className="border-0 bg-transparent py-2 shadow-none"
                        onChange={handleChange}
                        required
                      />
                    </InputGroup>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Password</Form.Label>
                    <InputGroup className="bg-light rounded-3 overflow-hidden border">
                      <InputGroup.Text className="bg-transparent border-0 text-muted">
                        <Lock size={18} />
                      </InputGroup.Text>
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="••••••••"
                        className="border-0 bg-transparent py-2 shadow-none"
                        onChange={handleChange}
                        required
                      />
                      <InputGroup.Text 
                        className="bg-transparent border-0 text-muted" 
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </InputGroup.Text>
                    </InputGroup>
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="success"
                    className="w-100 py-2 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm border-0"
                    disabled={loading}
                    style={{ backgroundColor: "#1b5e20" }}
                  >
                    {loading ? <Spinner size="sm" /> : <>Access Dashboard <ArrowRight weight="bold" /></>}
                  </Button>

                  <div className="text-center mt-4 pt-3 border-top">
                    <p className="text-muted small mb-0">
                      Not yet a partner? <Link to="/delivery/register" className="text-success fw-bold text-decoration-none">Register Now</Link>
                    </p>
                  </div>
                </Form>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DeliveryLogin;