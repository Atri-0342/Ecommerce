import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Components
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

// React Bootstrap
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  ProgressBar,
  Spinner,
} from "react-bootstrap";

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  // Auth State from Redux
  const { accessToken } = useSelector((state) => state.auth);

  // Product & UI State
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helper to ensure Image URLs are valid
  const getImgUrl = (path) => {
    if (!path) return "https://via.placeholder.com/400";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${API}${cleanPath}`;
  };

  // 1. Fetch Product Data & AI Recommendations
  const fetchProductDetails = async () => {
    try {
      // FIX: Matches your backend route router.get("/detail/:id", getProduct);
      const res = await axios.get(`${API}/products/detail/${id}`);
      setProduct(res.data);
      
      // FIX: Use your dedicated AI recommendation route
      try {
        const suggestRes = await axios.get(`${API}/products/ai-recommend/${id}`);
        setSuggestions(suggestRes.data.products || []);
      } catch (aiErr) {
        console.error("AI Recommendation Error:", aiErr);
        // Fallback is handled by the backend, but we keep the state clean here
      }
    } catch (err) {
      console.error("Load Error:", err);
      // alert("Could not load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProductDetails();
    // Increment click count for trending logic
    axios.patch(`${API}/products/click/${id}`).catch(() => {});
    window.scrollTo(0, 0);
  }, [id, API]);

  // 2. Rating Progress Bar Stats
  const ratingStats = useMemo(() => {
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (product?.reviews) {
      product.reviews.forEach((rev) => {
        if (stats[rev.rating] !== undefined) stats[rev.rating]++;
      });
    }
    return stats;
  }, [product]);

  // 3. Handlers
  const handleAddToCart = () => {
    if (!accessToken) return navigate("/login");
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const index = cart.findIndex((item) => item._id === product._id);

    if (index > -1) {
      cart[index].qty += Number(qty);
    } else {
      cart.push({
        _id: product._id,
        product_name: product.product_name,
        price: product.price,
        qty: Number(qty),
        image: product.images[0],
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("Success! Product added to cart.");
  };

  const handleBuyNow = () => {
    if (!accessToken) return navigate("/login");
    
    const checkoutData = {
      cart: [{
        _id: product._id,
        product_name: product.product_name,
        price: product.price,
        qty: Number(qty),
        image: product.images[0]
      }],
      total: product.price * Number(qty)
    };

    navigate("/payment", { state: checkoutData });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      alert("Please login to post a review.");
      return navigate("/login");
    }

    setSubmitting(true);
    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${accessToken}` 
        } 
      };

      await axios.post(
        `${API}/products/${id}/reviews`, 
        { rating: Number(rating), comment: comment.trim() }, 
        config
      );

      alert("Review posted successfully!");
      setComment("");
      setRating(5);
      fetchProductDetails(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );

  if (!product) return <div className="text-center py-5">Product not found.</div>;

  return (
    <div className="bg-light min-vh-100">
      <Navigation />

      <Container className="py-5">
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-5">
          <Row className="g-0">
            <Col lg={7} className="bg-white p-3 p-md-5 border-end">
              <div className="text-center mb-4">
                <img
                  src={getImgUrl(product.images[activeImg])}
                  alt="Product"
                  className="img-fluid rounded-3"
                  style={{ maxHeight: "450px", objectFit: "contain" }}
                />
              </div>
              <div className="d-flex justify-content-center gap-3 overflow-auto py-2">
                {product.images?.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`rounded-3 border-2 border ${activeImg === i ? "border-primary" : "border-light"} cursor-pointer bg-white`}
                    style={{ width: "80px", height: "80px", flexShrink: 0, cursor: "pointer" }}
                  >
                    <img src={getImgUrl(img)} alt={`Thumb ${i}`} className="w-100 h-100 rounded-2" style={{ objectFit: "cover", padding: "2px" }} />
                  </div>
                ))}
              </div>
            </Col>

            <Col lg={5} className="p-4 p-md-5 d-flex flex-column bg-white">
              <div className="mb-auto">
                <Badge bg="primary" className="mb-2 px-3 text-uppercase">
                    {/* Access category.name because we populated it in the backend */}
                    {product.category?.name || product.category}
                </Badge>
                <h1 className="fw-bold display-6 mb-1">{product.product_name}</h1>
                <p className="text-muted mb-4">Brand: <span className="fw-bold">{product.dealerId?.brandName}</span></p>

                <div className="d-flex align-items-center gap-3 mb-4">
                  <h2 className="text-primary fw-bold mb-0">₹{product.price.toLocaleString()}</h2>
                  <div className="vr"></div>
                  <Badge bg="success" className="px-3">{product.rating} ★</Badge>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold text-muted small text-uppercase">Description</h6>
                  <p className="text-secondary" style={{ lineHeight: "1.7" }}>{product.description}</p>
                </div>
              </div>

              <div className="mt-4">
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-bold">Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={product.stock}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-25 shadow-none"
                  />
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button variant="primary" size="lg" className="fw-bold py-3" onClick={handleAddToCart} disabled={product.stock === 0}>
                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Button variant="outline-dark" size="lg" className="fw-bold py-3" onClick={handleBuyNow} disabled={product.stock === 0}>
                    Buy Now
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <Row className="g-4 mb-5">
          <Col lg={4}>
            <Card className="border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: "100px" }}>
              <h5 className="fw-bold mb-4">Customer Ratings</h5>
              <div className="text-center mb-4">
                <h1 className="display-4 fw-bold text-primary mb-0">{product.rating}</h1>
                <p className="text-muted">out of 5 stars</p>
              </div>

              {[5, 4, 3, 2, 1].map((num) => (
                <div key={num} className="d-flex align-items-center gap-2 mb-2">
                  <span className="small fw-bold" style={{ width: "30px" }}>{num}★</span>
                  <ProgressBar
                    now={product.numReviews > 0 ? (ratingStats[num] / product.numReviews) * 100 : 0}
                    variant="primary"
                    className="flex-grow-1"
                    style={{ height: "8px" }}
                  />
                  <span className="small text-muted" style={{ width: "30px" }}>{ratingStats[num]}</span>
                </div>
              ))}

              <hr className="my-4" />

              {accessToken ? (
                <Form onSubmit={submitReview}>
                  <h6 className="fw-bold mb-3">Post a Review</h6>
                  <Form.Select className="mb-3 shadow-none" value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terrible</option>
                  </Form.Select>
                  <Form.Control as="textarea" rows={3} placeholder="Share your experience..." className="mb-3 shadow-none" value={comment} onChange={(e) => setComment(e.target.value)} required />
                  <Button variant="primary" type="submit" className="w-100 fw-bold" disabled={submitting}>
                    {submitting ? "Posting..." : "Submit Review"}
                  </Button>
                </Form>
              ) : (
                <div className="text-center p-3 bg-light rounded-3">
                  <p className="small mb-2">Login to share your feedback</p>
                  <Button size="sm" onClick={() => navigate("/login")}>Login</Button>
                </div>
              )}
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="border-0 shadow-sm rounded-4 p-4 min-vh-50">
              <h5 className="fw-bold mb-4">Top Customer Reviews</h5>
              {product.reviews?.length > 0 ? (
                product.reviews.map((rev, i) => (
                  <div key={i} className="mb-4 pb-4 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center">
                        <Badge bg="success" className="me-2">{rev.rating} ★</Badge>
                        <span className="fw-bold">{rev.name}</span>
                      </div>
                      <small className="text-muted">{rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</small>
                    </div>
                    <p className="text-secondary mb-0">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-5 text-muted">No reviews yet for this product.</div>
              )}
            </Card>
          </Col>
        </Row>
        
        {/* AI Recommendations Section */}
        {suggestions.length > 0 && (
          <div className="mt-5">
            <h4 className="fw-bold mb-4">
                <span className="text-primary me-2">✦</span>
                AI Recommended for You
            </h4>
            <Row className="g-4">
              {suggestions.map((p) => (
                <Col key={p._id} xs={6} md={3}>
                  <Card 
                    className="h-100 border-0 shadow-sm rounded-4 text-center cursor-pointer overflow-hidden p-2" 
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    <div className="p-3 bg-light rounded-3 mb-2">
                      <Card.Img variant="top" src={getImgUrl(p.images[0])} style={{ height: "140px", objectFit: "contain" }} />
                    </div>
                    <Card.Body className="p-2">
                      <Card.Title className="h6 text-truncate fw-bold">{p.product_name}</Card.Title>
                      <div className="text-primary fw-bold">₹{p.price.toLocaleString()}</div>
                      <Badge bg="light" className="text-dark border mt-1">{p.rating} ★</Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default BookingPage;