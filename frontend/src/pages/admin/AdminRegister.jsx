import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Card, InputGroup, Container, Alert, Row, Col } from "react-bootstrap";
import { Mail, Lock, User, Phone, ShieldCheck, UserPlus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phoneNumber: "",
    access_level: "Editor", // Default
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API}/admins/create`, formData);
      
      if (res.data.success) {
        alert("Registration successful! You can now login.");
        navigate("/admin-login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Email might be taken.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <Card className="shadow-lg border-0 rounded-4" style={{ maxWidth: "550px", width: "100%" }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
              <UserPlus size={32} className="text-primary" />
            </div>
            <h3 className="fw-bold text-dark">Admin Registration</h3>
            <p className="text-muted small">Create a staff account to manage the store</p>
          </div>

          {error && <Alert variant="danger" className="py-2 small text-center">{error}</Alert>}

          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Full Name</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0"><User size={18} /></InputGroup.Text>
                <Form.Control
                  name="full_name"
                  type="text"
                  placeholder="Atri Mondal"
                  className="bg-light border-0 shadow-none py-2"
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase">Email Address</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0"><Mail size={18} /></InputGroup.Text>
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="admin@company.com"
                  className="bg-light border-0 shadow-none py-2"
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Access Level</Form.Label>
                  <Form.Select 
                    name="access_level"
                    className="bg-light border-0 shadow-none py-2"
                    onChange={handleChange}
                  >
                    <option value="Editor">Editor</option>
                    <option value="Moderator">Moderator</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-muted text-uppercase">Phone</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-light border-0"><Phone size={18} /></InputGroup.Text>
                    <Form.Control
                      name="phoneNumber"
                      type="text"
                      placeholder="+91..."
                      className="bg-light border-0 shadow-none py-2"
                      onChange={handleChange}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase">Password</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0"><Lock size={18} /></InputGroup.Text>
                <Form.Control
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-light border-0 shadow-none py-2"
                  onChange={handleChange}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 fw-bold py-2 shadow-sm rounded-3 mt-2" disabled={loading}>
              {loading ? "Creating Account..." : "Register Admin Account"}
            </Button>

            <div className="text-center mt-4">
              <Link to="/admin-login" className="text-decoration-none small fw-bold text-primary">
                Already an Admin? Back to Login
              </Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRegister;