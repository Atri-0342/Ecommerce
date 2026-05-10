import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice"; // Reusing logout to clear Redux state
import { Warning, Trash, ArrowLeft, WarningOctagon } from "@phosphor-icons/react";
import Navigation from "../components/Navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

const DeleteAccount = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await axios.delete("http://localhost:5000/users/delete-account", {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success("Account deleted successfully");
        dispatch(logout()); // Clear Redux
        navigate("/register"); // Redirect to signup
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Button 
              variant="link" 
              className="text-decoration-none text-muted mb-3 p-0 d-flex align-items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} /> Back to Security
            </Button>

            <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
              <div className="bg-danger p-4 text-center">
                <WarningOctagon size={60} weight="fill" className="text-white opacity-75" />
                <h4 className="text-white fw-bold mt-2">Delete Account</h4>
              </div>
              
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-4">
                  <h5 className="fw-bold text-dark">Are you absolutely sure?</h5>
                  <p className="text-muted small">
                    This action is permanent and cannot be undone. You will lose access to your orders, 
                    saved addresses, and all profile data.
                  </p>
                </div>

                <div className="bg-danger-subtle p-3 rounded-4 mb-4 d-flex gap-3">
                  <Warning size={24} className="text-danger flex-shrink-0" />
                  <ul className="mb-0 small text-danger ps-3">
                    <li>Your active orders will be cancelled.</li>
                    <li>Your wallet/points balance will be forfeited.</li>
                    <li>You will be logged out of all devices immediately.</li>
                  </ul>
                </div>

                <div className="d-grid gap-2">
                  <Button 
                    variant="danger" 
                    className="py-3 rounded-pill fw-bold border-0 shadow-sm"
                    onClick={() => setShowModal(true)}
                  >
                    Delete My Account
                  </Button>
                  <Button 
                    variant="light" 
                    className="py-3 rounded-pill fw-bold border-0"
                    onClick={() => navigate(-1)}
                  >
                    Keep My Account
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="p-4 text-center">
          <Trash size={48} weight="duotone" className="text-danger mb-3" />
          <h5 className="fw-bold">Final Confirmation</h5>
          <p className="text-muted small">
            Do you really want to delete your YuKTI account? This is the point of no return.
          </p>
          <div className="d-flex gap-2 mt-4">
            <Button variant="light" className="w-100 rounded-pill py-2" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              className="w-100 rounded-pill py-2 fw-bold" 
              disabled={loading}
              onClick={handleDelete}
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DeleteAccount;