import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Badge, Accordion, Spinner } from "react-bootstrap";
import { Phone, Envelope, MapPin, PaperPlaneTilt, ClockCounterClockwise } from "@phosphor-icons/react";
import { useSelector } from "react-redux";
import axios from "axios";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const CustomerSupport = () => {
  // Define API from Vite environment
  const API = import.meta.env.VITE_API_URL;

  // STRICTLY USER AUTH: Pulling only accessToken and user from Redux
  const { accessToken, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [history, setHistory] = useState([]);

  // Config using the user's accessToken
  const config = {
    headers: { 
      Authorization: `Bearer ${accessToken}` 
    },
  };

  const fetchHistory = async () => {
    if (!accessToken) return;
    try {
      // Requested syntax: axios.get(`${API}/...`)
      const { data } = await axios.get(`${API}/feedbacks/my-messages`, config);
      setHistory(data.messages);
    } catch (err) {
      console.error("History Fetch Error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);
    try {
      // EXACT SYNTAX REQUESTED: axios.post(`${API}/feedbacks/send`...)
      await axios.post(`${API}/feedbacks/send`, formData, config);
      
      setSubmitStatus({ type: "success", msg: "Support ticket submitted!" });
      setFormData({ subject: "", message: "" });
      fetchHistory(); 
    } catch (err) {
      setSubmitStatus({ 
        type: "danger", 
        msg: err.response?.data?.message || "Failed to send. Please check your login." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navigation />
      
      <Container className="py-5 flex-grow-1">
        <Row className="mb-4 text-center">
          <Col>
            <h2 className="fw-bold">User Support Center</h2>
            <p className="text-muted">Logged in as: <span className="text-primary fw-bold">{user?.name}</span></p>
          </Col>
        </Row>

        <Row className="gy-4">
          {/* Contact Details */}
          <Col lg={4}>
            <div className="d-grid gap-3">
              <Card className="border-0 shadow-sm rounded-4">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center gap-3 mb-4">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                      <Phone size={24} weight="bold" />
                    </div>
                    <div>
                      <div className="small text-muted fw-bold">HELPLINE</div>
                      <div className="fw-bold">+91 1800-123-456</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
                      <Envelope size={24} weight="bold" />
                    </div>
                    <div>
                      <div className="small text-muted fw-bold">SUPPORT EMAIL</div>
                      <div className="fw-bold text-break">support@yukti.com</div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              <div className="p-4 bg-dark text-white rounded-4 shadow-sm">
                <h6 className="fw-bold mb-2">Helpful Tip</h6>
                <p className="small mb-0 opacity-75">Please include your order ID if your inquiry is regarding a specific purchase.</p>
              </div>
            </div>
          </Col>

          {/* User Form */}
          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4 p-4 mb-4">
              <h5 className="fw-bold mb-4 text-dark">Submit New Ticket</h5>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">NAME</Form.Label>
                      <Form.Control 
                        type="text" 
                        value={user?.name || ""} 
                        readOnly 
                        className="bg-light border-0 py-2 fw-semibold text-muted" 
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-bold text-secondary">EMAIL</Form.Label>
                      <Form.Control 
                        type="email" 
                        value={user?.email || ""} 
                        readOnly 
                        className="bg-light border-0 py-2 fw-semibold text-muted" 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold text-secondary">SUBJECT</Form.Label>
                  <Form.Control 
                    required 
                    placeholder="e.g., Refund Request, App Issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="small fw-bold text-secondary">MESSAGE</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={5} 
                    required
                    placeholder="Explain your issue in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="border-0 bg-light py-2"
                  />
                </Form.Group>

                <div className="d-flex align-items-center gap-3">
                  <Button variant="primary" type="submit" className="px-5 py-2 rounded-pill fw-bold" disabled={loading}>
                    {loading ? <Spinner size="sm" /> : "Send Message"}
                  </Button>
                  {submitStatus && (
                    <Badge bg={submitStatus.type} className="p-2 px-3 rounded-pill fw-medium">
                      {submitStatus.msg}
                    </Badge>
                  )}
                </div>
              </Form>
            </Card>

            {/* History Section */}
            <div className="mt-5">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <ClockCounterClockwise size={24} />
                My Support History
              </h5>
              <Accordion flush className="rounded-4 overflow-hidden border shadow-sm bg-white">
                {history.length === 0 ? (
                  <div className="p-5 text-center text-muted italic">No tickets found in your history.</div>
                ) : (
                  history.map((ticket, i) => (
                    <Accordion.Item eventKey={i.toString()} key={ticket._id}>
                      <Accordion.Header>
                        <div className="d-flex justify-content-between w-100 pe-3">
                          <span className="fw-bold">{ticket.subject}</span>
                          <Badge bg={ticket.status === 'resolved' ? 'success' : 'warning'} className="rounded-pill">
                            {ticket.status.toUpperCase()}
                          </Badge>
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="small text-muted mb-2">Submitted on: {new Date(ticket.createdAt).toLocaleString()}</div>
                        <p className="text-secondary mb-3">{ticket.message}</p>
                        {ticket.admin_reply && (
                          <div className="p-3 bg-light rounded-3 border-start border-primary border-4">
                            <span className="fw-bold d-block text-primary small mb-1">ADMIN RESPONSE:</span>
                            <p className="mb-0 small text-dark italic">"{ticket.admin_reply}"</p>
                          </div>
                        )}
                      </Accordion.Body>
                    </Accordion.Item>
                  ))
                )}
              </Accordion>
            </div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default CustomerSupport;