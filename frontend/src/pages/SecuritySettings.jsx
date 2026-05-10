import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, ListGroup, Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Monitor, 
  DeviceMobile, 
  Clock, 
  Trash, 
  Key, 
  ArrowLeft,
  DeviceTablet
} from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import axios from "axios";

const SecuritySettings = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch actual login sessions from your backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        // Replace with your actual endpoint (e.g., GET /api/users/sessions)
        const response = await axios.get("/api/users/sessions", { withCredentials: true });
        setSessions(response.data.sessions);
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const getDeviceIcon = (deviceType = "") => {
    const type = deviceType.toLowerCase();
    if (type.includes("mobile") || type.includes("phone")) return <DeviceMobile size={28} />;
    if (type.includes("tablet") || type.includes("ipad")) return <DeviceTablet size={28} />;
    return <Monitor size={28} />;
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            
            {/* Header */}
            <div className="mb-4 d-flex align-items-center justify-content-between">
              <div>
                <Button 
                  variant="link" 
                  className="p-0 text-decoration-none text-muted mb-2 d-flex align-items-center gap-2"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={18} /> Back to Settings
                </Button>
                <h3 className="fw-bold text-dark">Security Control</h3>
              </div>
              <ShieldCheck size={40} weight="duotone" className="text-primary opacity-75" />
            </div>

            {/* 1. Logged In Sessions (Shown First) */}
            <Card className="border-0 shadow-sm rounded-4 mb-4">
              <Card.Header className="bg-white border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold mb-0">Where you're logged in</h5>
                <p className="text-muted small">Active sessions across your devices</p>
              </Card.Header>
              <Card.Body className="px-4 pb-4">
                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <p className="mt-2 text-muted small">Loading device history...</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {sessions.map((session, index) => (
                      <ListGroup.Item key={index} className="px-0 py-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex gap-3 align-items-center">
                            <div className="p-2 bg-light rounded-circle text-secondary">
                              {getDeviceIcon(session.deviceType)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                {session.deviceName || "Unknown Device"}
                                {session.isCurrent && <Badge bg="success" pill style={{ fontSize: '10px' }}>Current Session</Badge>}
                              </div>
                              <div className="text-muted small">
                                {session.browser} • {session.ipAddress} • <Clock size={12} className="ms-1" /> {session.lastActive}
                              </div>
                            </div>
                          </div>
                          {!session.isCurrent && (
                            <Button variant="outline-danger" size="sm" className="rounded-pill px-3">
                              Logout
                            </Button>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>

            {/* 2. Security Actions (Bottom Section) */}
            <Row className="gy-3">
              <Col sm={6}>
                <Card 
                  className="border-0 shadow-sm rounded-4 h-100 p-2 cursor-pointer hover-shadow" 
                  onClick={() => navigate("/profile/security/changePassword")}
                  style={{ cursor: "pointer", transition: "0.2s" }}
                >
                  <Card.Body className="d-flex align-items-center gap-3">
                    <div className="p-3 bg-primary-subtle rounded-4 text-primary">
                      <Key size={24} weight="bold" />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Change Password</h6>
                      <p className="mb-0 text-muted small">Update your login security</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col sm={6}>
                <Card 
                  className="border-0 shadow-sm rounded-4 h-100 p-2" 
                  onClick={() => navigate("/profile/security/deleteAccount")}
                  style={{ cursor: "pointer", transition: "0.2s" }}
                >
                  <Card.Body className="d-flex align-items-center gap-3">
                    <div className="p-3 bg-danger-subtle rounded-4 text-danger">
                      <Trash size={24} weight="bold" />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1">Delete Account</h6>
                      <p className="mb-0 text-muted small">Permanently remove data</p>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <div className="mt-5 text-center">
              <p className="text-muted small">
                Your account is protected by industry-standard encryption.<br/>
                Need help? <span className="text-primary fw-bold" style={{ cursor: "pointer" }} onClick={() => navigate("/support")}>Contact Customer Care</span>
              </p>
            </div>

          </Col>
        </Row>
      </Container>

      <style>{`
        .hover-shadow:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default SecuritySettings;