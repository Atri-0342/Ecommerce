import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Breadcrumb, Spinner, Form } from "react-bootstrap";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const SuggestedPage = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const IMAGE_BASE_URL = API.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const token = localStorage.getItem("accessToken"); // Ensure this matches your token key
        const res = await axios.get(`${API}/products/suggested-all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(res.data.products);
      } catch (err) {
        console.error("Error fetching suggestions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggested();
  }, [API]);

  const handleProductClick = async (id) => {
    try {
      await axios.patch(`${API}/products/click/${id}`);
      navigate(`/product/${id}`);
    } catch (err) {
      navigate(`/product/${id}`);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />
      <Container className="py-4">
        <Breadcrumb className="small mb-4">
          <Breadcrumb.Item onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Home</Breadcrumb.Item>
          <Breadcrumb.Item active>Suggested For You</Breadcrumb.Item>
        </Breadcrumb>

        <Row>
          <Col lg={3} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm p-3 mb-4 sticky-top" style={{ top: "100px", zIndex: 10 }}>
              <h5 className="fw-bold mb-3">AI Picks</h5>
              <p className="small text-muted">Based on your recent brand and category interests.</p>
              <hr />
              <div className="mb-4">
                <p className="fw-bold small mb-2">RATINGS</p>
                {[4, 3, 2, 1].map((star) => (
                  <Form.Check key={star} type="checkbox" label={`${star}★ & above`} className="small mb-1" />
                ))}
              </div>
            </Card>
          </Col>

          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center bg-white p-3 shadow-sm rounded mb-4">
              <h4 className="m-0 fw-bold">✨ Recommended for You</h4>
              <span className="text-muted small">{products.length} Items found</span>
            </div>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <Row className="g-3">
                {products.map((p) => {
                  const displayImg = p.images?.[0] ? `${IMAGE_BASE_URL}/${p.images[0].replace(/^\/+/, "")}` : "https://via.placeholder.com/300";
                  return (
                    <Col key={p._id} xs={12} sm={6} md={4}>
                      <Card className="h-100 border-0 shadow-sm" onClick={() => handleProductClick(p._id)} style={{ cursor: "pointer" }}>
                        <div className="p-3 text-center" style={{ height: "200px" }}>
                          <Card.Img src={displayImg} className="h-100 w-100" style={{ objectFit: "contain" }} />
                        </div>
                        <Card.Body className="border-top">
                          <Card.Title className="h6 text-truncate">{p.product_name}</Card.Title>
                          <div className="d-flex justify-content-between">
                             <span className="fw-bold text-primary">₹{p.price}</span>
                             <span className="badge bg-light text-dark border">{p.brand}</span>
                          </div>
                          <p className="text-success small mt-2 mb-0">Personalized Match</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default SuggestedPage;