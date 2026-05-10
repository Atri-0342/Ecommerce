import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Badge, Spinner, Form, InputGroup, Card, Modal, Row, Col } from "react-bootstrap";
import { Search, MessageSquare, RefreshCw, Eye, Send, Mail, Clock } from "lucide-react";
import Sidebar from "./Sidebar"; 
import { useSelector } from "react-redux";

const FeedbackManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  const { adminToken } = useSelector((state) => state.auth);

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sending, setSending] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  const config = {
    headers: { Authorization: `Bearer ${adminToken}` },
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      // Consistent with your AdminManagement API structure
      const res = await axios.get(`${API}/feedbacks/all`, config);
      if (res.data.success) {
        setFeedbacks(res.data.feedbacks);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedbacks(); }, []);

  const handleOpenReply = (ticket) => {
    setSelectedTicket(ticket);
    setReplyText(ticket.admin_reply || "");
    setShowModal(true);
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await axios.put(`${API}/feedbacks/admin-reply/${selectedTicket._id}`, { reply: replyText }, config);
      setShowModal(false);
      fetchFeedbacks(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    const s = searchTerm.toLowerCase();
    return (
      f.name?.toLowerCase().includes(s) || 
      f.email?.toLowerCase().includes(s) || 
      f.subject?.toLowerCase().includes(s)
    );
  });

  return (
    <Sidebar>
      <div className="p-4">
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Customer Feedbacks</h3>
            <p className="text-muted small">Manage support inquiries and send automated email responses</p>
          </div>
          <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary">
            <MessageSquare size={28} />
          </div>
        </div>

        {/* Search and Table Card */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white py-3 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <InputGroup className="bg-light border rounded-3 w-50">
                <InputGroup.Text className="bg-transparent border-0 text-muted">
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control 
                  placeholder="Search by name, email or subject..." 
                  className="bg-transparent border-0 shadow-none" 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </InputGroup>
              <Button variant="light" onClick={fetchFeedbacks} className="text-primary border">
                <RefreshCw size={18} className={loading ? "spin" : ""} />
              </Button>
            </div>
          </Card.Header>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-muted small text-uppercase">Sender Details</th>
                  <th className="text-muted small text-uppercase">Subject</th>
                  <th className="text-muted small text-uppercase">Date</th>
                  <th className="text-muted small text-uppercase">Status</th>
                  <th className="text-end pe-4 text-muted small text-uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">No feedback tickets found.</td>
                  </tr>
                ) : (
                  filteredFeedbacks.map((item) => (
                    <tr key={item._id}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-light p-2 rounded-circle border text-primary">
                            <Mail size={18} />
                          </div>
                          <div>
                            <div className="fw-bold text-dark">{item.name}</div>
                            <div className="text-muted small" style={{fontSize: '11px'}}>{item.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold text-secondary">{item.subject}</span>
                      </td>
                      <td>
                        <div className="text-muted small d-flex align-items-center gap-1">
                          <Clock size={14} />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <Badge 
                          bg={item.status === 'resolved' ? "success" : "warning"} 
                          className="rounded-pill px-3 py-2 fw-medium"
                          style={{ fontSize: '10px' }}
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="text-end pe-4">
                        <Button 
                          variant={item.status === 'resolved' ? "light" : "primary"} 
                          size="sm" 
                          className="rounded-pill px-3 shadow-sm border-0"
                          onClick={() => handleOpenReply(item)}
                        >
                          {item.status === 'resolved' ? <Eye size={16} /> : <Send size={16} />}
                          <span className="ms-2">{item.status === 'resolved' ? 'View' : 'Reply'}</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      {/* Reply Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">
            {selectedTicket?.status === 'resolved' ? "Ticket History" : "Respond to Ticket"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2">
          <div className="bg-light p-3 rounded-4 mb-4 border">
            <div className="d-flex justify-content-between mb-2">
              <h6 className="fw-bold text-primary mb-0">User Inquiry:</h6>
              <small className="text-muted">{selectedTicket?.email}</small>
            </div>
            <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{selectedTicket?.message}</p>
          </div>

          <Form.Group>
            <Form.Label className="fw-bold small text-secondary">ADMIN RESPONSE</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              placeholder={selectedTicket?.status === 'resolved' ? "" : "Type your reply... an email will be sent to the user."}
              className="border-0 bg-light rounded-4 p-3 shadow-none border"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={selectedTicket?.status === 'resolved'}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="light" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
            Close
          </Button>
          {selectedTicket?.status !== 'resolved' && (
            <Button 
              variant="primary" 
              className="rounded-pill px-4 fw-bold" 
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
            >
              {sending ? <Spinner size="sm" /> : "Send & Resolve"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Sidebar>
  );
};

export default FeedbackManagement;