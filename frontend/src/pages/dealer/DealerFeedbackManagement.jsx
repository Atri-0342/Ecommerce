import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { 
  Row, Col, Card, Form, Button, 
  Badge, Spinner, Table, Modal 
} from "react-bootstrap";
import { 
  Plus, History, MessageSquare, 
  CheckCircle, Clock, Mail, Send, Eye 
} from "lucide-react";
import Sidebar from "./Sidebar"; 

const DealerFeedback = () => {
  const API = import.meta.env.VITE_API_URL;
  
  const { merchantToken, adminToken } = useSelector((state) => state.auth);
  const token = merchantToken || adminToken;

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  
  // Modal states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [formData, setFormData] = useState({ subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMyHistory = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API}/feedbacks/my-messages`, config);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error("Fetch History Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyHistory();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API}/feedbacks/send`, formData, config);
      
      setFormData({ subject: "", message: "" });
      setShowIssueModal(false);
      fetchMyHistory();
      alert("Ticket Issued Successfully!");
    } catch (err) {
      alert("Failed to issue ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  return (
    <Sidebar>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-0">Support Tickets</h3>
          <p className="text-muted small">Manage your inquiries and view admin responses</p>
        </div>
        <Button 
          variant="primary" 
          className="rounded-3 px-4 shadow-sm fw-bold d-flex align-items-center gap-2"
          onClick={() => setShowIssueModal(true)}
        >
          <Plus size={18} /> Issue a Ticket
        </Button>
      </div>

      {/* Inquiry History Table */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="bg-white py-3 border-0">
          <h5 className="fw-bold mb-0 text-secondary d-flex align-items-center gap-2">
            <History size={18} /> My Ticket History
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-5">
              <MessageSquare size={40} className="text-muted opacity-25 mb-3" />
              <p className="text-muted">No tickets found. Need help? Issue a ticket above.</p>
            </div>
          ) : (
            <Table hover responsive className="mb-0 align-middle">
              <thead className="bg-light text-muted small text-uppercase">
                <tr>
                  <th className="ps-4">Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Admin Reply</th>
                  <th className="text-end pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr key={msg._id} className="border-bottom-0">
                    <td className="ps-4 text-muted small">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{msg.subject}</span>
                    </td>
                    <td>
                      <Badge 
                        bg={msg.status === 'resolved' ? 'success' : 'warning'} 
                        className="rounded-pill px-3 py-2 fw-medium"
                        style={{ fontSize: '11px' }}
                      >
                        {msg.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td>
                      {msg.admin_reply ? (
                        <div className="text-success small d-flex align-items-center gap-1">
                          <CheckCircle size={14} /> Received
                        </div>
                      ) : (
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <Clock size={14} /> Pending
                        </div>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="rounded-3 border"
                        onClick={() => handleViewTicket(msg)}
                      >
                        <Eye size={16} className="me-1" /> View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* MODAL: Issue New Ticket */}
      <Modal show={showIssueModal} onHide={() => setShowIssueModal(false)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-dark">Issue New Support Ticket</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="pt-0">
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Subject</Form.Label>
              <Form.Control 
                type="text"
                placeholder="Briefly describe the issue"
                className="rounded-3 bg-light border-0 py-2"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-bold text-muted">Detailed Description</Form.Label>
              <Form.Control 
                as="textarea"
                rows={5}
                placeholder="Provide as much detail as possible..."
                className="rounded-3 bg-light border-0 p-3"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
            </Form.Group>
            <small className="text-muted">
              <Mail size={14} className="me-1"/> Our admin team will be notified immediately.
            </small>
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button variant="light" onClick={() => setShowIssueModal(false)} className="rounded-3">Cancel</Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="px-4 rounded-3 shadow-sm fw-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="sm" /> : <><Send size={16} className="me-2" /> Send Ticket</>}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: View Ticket Details & Admin Reply */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Ticket Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedTicket && (
            <>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold text-primary mb-0">{selectedTicket.subject}</h5>
                  <Badge bg={selectedTicket.status === 'resolved' ? 'success' : 'warning'} className="rounded-pill">
                    {selectedTicket.status.toUpperCase()}
                  </Badge>
                </div>
                <small className="text-muted d-block mb-3">Issued on: {new Date(selectedTicket.createdAt).toLocaleString()}</small>
                
                <label className="small fw-bold text-muted text-uppercase d-block mb-1">Your Message:</label>
                <div className="bg-light p-3 rounded-4 text-dark mb-4 shadow-sm border-start border-primary border-4">
                  {selectedTicket.message}
                </div>

                {selectedTicket.admin_reply ? (
                  <div className="p-4 bg-success bg-opacity-10 rounded-4 border-start border-success border-4 shadow-sm">
                    <label className="small fw-bold text-success d-flex align-items-center gap-1 mb-2 text-uppercase">
                      <CheckCircle size={16}/> Admin Response:
                    </label>
                    <p className="mb-0 text-dark fw-medium" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedTicket.admin_reply}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-light rounded-4 text-center border">
                    <Clock size={24} className="text-muted mb-2" />
                    <p className="text-muted small mb-0">This ticket is currently being reviewed by an administrator. Please check back later.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowViewModal(false)} className="rounded-3">Close</Button>
        </Modal.Footer>
      </Modal>
    </Sidebar>
  );
};

export default DealerFeedback;