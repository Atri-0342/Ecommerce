import React, { useState } from "react";
import axios from "axios";
import { Form, Button, Card, InputGroup, Container, Alert } from "react-bootstrap";
import { Mail, Lock, LogIn, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
// ✅ Path updated from ../redux/authSlice to ../../store/authSlice
import { setAdminSuccess } from "../../store/authSlice"; 

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const API = import.meta.env.VITE_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // POST request to your admin login endpoint
      const res = await axios.post(`${API}/admins/login`, { email, password });
      
      if (res.data.success) {
        // 1. Dispatch to Redux (updates state and handles localStorage via the slice)
        dispatch(setAdminSuccess({
          token: res.data.token,
          admin: res.data.admin
        }));
        
        // 2. Redirect to the admin dashboard
        navigate("/admin-dashboard");
      }
    } catch (err) {
      // Catch backend errors or network issues
      setError(err.response?.data?.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <Card className="shadow-lg border-0 rounded-4" style={{ maxWidth: "400px", width: "100%" }}>
        <Card.Body className="p-5">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
              <ShieldAlert size={32} className="text-primary" />
            </div>
            <h3 className="fw-bold text-dark">Admin Portal</h3>
            <p className="text-muted small">Access protected inventory controls</p>
          </div>

          {error && (
            <Alert variant="danger" className="py-2 small border-0 text-center mb-4">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Email Address
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Mail size={18} className="text-muted"/>
                </InputGroup.Text>
                <Form.Control
                  type="email"
                  placeholder="name@company.com"
                  className="bg-light border-0 shadow-none py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                Password
              </Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-light border-0">
                  <Lock size={18} className="text-muted"/>
                </InputGroup.Text>
                <Form.Control
                  type="password"
                  placeholder="••••••••"
                  className="bg-light border-0 shadow-none py-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 fw-bold py-2 shadow-sm rounded-3 mt-2" 
              disabled={loading}
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <LogIn size={18} /> Sign In
                </div>
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminLogin;