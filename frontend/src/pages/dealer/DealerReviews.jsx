import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Card, Table, Button, Badge, Spinner, Modal } from "react-bootstrap";
import { Star, Eye, ChatTeardropDots, User, CalendarBlank } from "@phosphor-icons/react";
import Sidebar from "./Sidebar";

const DealerReviews = () => {
  const API = import.meta.env.VITE_API_URL;
  const { merchantToken } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
        // Using your existing getDealerProducts endpoint
        const { data } = await axios.get(`${API}/products/dealer/my-products`, config);        
        // Flatten reviews from all products into one list
        const allReviews = data.products.reduce((acc, product) => {
          const productReviews = product.reviews.map(rev => ({
            ...rev,
            productName: product.product_name,
            productId: product._id
          }));
          return [...acc, ...productReviews];
        }, []);

        // Sort by newest first
        setReviews(allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Error fetching reviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [API, merchantToken]);

  const handlePreview = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        weight={i < rating ? "fill" : "regular"} 
        className={i < rating ? "text-warning" : "text-muted"} 
      />
    ));
  };

  return (
    <Sidebar>
      <div className="mb-4">
        <h3 className="fw-bold text-dark mb-0">Customer Reviews</h3>
        <p className="text-muted small">Manage and monitor feedback for your products</p>
      </div>

      <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-5">
              <ChatTeardropDots size={48} className="text-muted opacity-25 mb-3" />
              <p className="text-muted">No reviews received yet.</p>
            </div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 border-0">Product</th>
                  <th className="border-0">Customer</th>
                  <th className="border-0">Rating</th>
                  <th className="border-0">Comment Snippet</th>
                  <th className="border-0">Date</th>
                  <th className="text-end pe-4 border-0">Action</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((rev) => (
                  <tr key={rev._id}>
                    <td className="ps-4">
                      <span className="fw-bold text-dark">{rev.productName}</span>
                    </td>
                    <td>{rev.name}</td>
                    <td>{renderStars(rev.rating)}</td>
                    <td>
                      <span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: "200px" }}>
                        {rev.comment}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-end pe-4">
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="rounded-3 border"
                        onClick={() => handlePreview(rev)}
                      >
                        <Eye size={18} className="me-1" /> Preview
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* --- PREVIEW MODAL --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered rounded-4>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">Review Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {selectedReview && (
            <div className="p-2">
              <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                <div className="bg-white p-2 rounded-circle shadow-sm">
                  <User size={32} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{selectedReview.name}</h6>
                  <small className="text-muted">Customer</small>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-muted small fw-bold text-uppercase">Product</label>
                <p className="fw-bold text-primary mb-0">{selectedReview.productName}</p>
              </div>

              <div className="mb-3">
                <label className="text-muted small fw-bold text-uppercase d-block">Rating</label>
                {renderStars(selectedReview.rating)} 
                <span className="ms-2 fw-bold">{selectedReview.rating}/5</span>
              </div>

              <div className="mb-4">
                <label className="text-muted small fw-bold text-uppercase">Comment</label>
                <div className="p-3 border rounded-3 bg-white italic shadow-sm" style={{ borderLeft: "4px solid #0d6efd !important" }}>
                  "{selectedReview.comment}"
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center text-muted small">
                <span><CalendarBlank size={16} /> {new Date(selectedReview.createdAt).toLocaleString()}</span>
                <Badge bg="light" text="dark" className="border">Verified Purchase</Badge>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-3">
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Sidebar>
  );
};

export default DealerReviews;