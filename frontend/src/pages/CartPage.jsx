import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, InputGroup, Form } from "react-bootstrap";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const CartPage = () => {
  const [items, setItems] = useState([]);
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const rawData = localStorage.getItem("cart");
    if (rawData) {
      try {
        const data = JSON.parse(rawData);
        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setItems([]);
      }
    }
  }, []);

  const updateQty = (id, newQty) => {
    if (newQty < 1) return;
    const updatedCart = items.map(item =>
      item._id === id ? { ...item, qty: Number(newQty) } : item
    );
    setItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeItem = (id) => {
    const filteredCart = items.filter(item => item._id !== id);
    setItems(filteredCart);
    localStorage.setItem("cart", JSON.stringify(filteredCart));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navigation />

      <Container className="py-5 flex-grow-1">
        <h2 className="fw-bold mb-4">Shopping Cart</h2>

        {items.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-4 p-5 text-center">
            <h4 className="text-muted">Your cart is empty</h4>
            <Button variant="primary" className="mt-3 rounded-pill" onClick={() => navigate("/")}>
              Start Shopping
            </Button>
          </Card>
        ) : (
          <Row className="g-4">
            {/* ITEM LIST */}
            <Col lg={8}>
              {items.map((item) => (
                <Card key={item._id} className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                  <Card.Body className="p-0">
                    <Row className="g-0 align-items-center">
                      {/* Image */}
                      <Col xs={4} md={3} className="bg-white p-3 d-flex justify-content-center">
                        <img
                          src={`${API}${item.image}`}
                          alt={item.product_name}
                          style={{ width: "100%", height: "100px", objectFit: "contain" }}
                        />
                      </Col>
                      
                      {/* Details */}
                      <Col xs={8} md={9} className="p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h5 className="fw-bold mb-1">{item.product_name}</h5>
                            <p className="text-primary fw-bold mb-2">₹{item.price}</p>
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="border-0" 
                            onClick={() => removeItem(item._id)}
                          >
                            ✕
                          </Button>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-2">
                          {/* Qty Controls */}
                          <div style={{ width: "120px" }}>
                            <InputGroup size="sm" className="border rounded-pill overflow-hidden">
                              <Button variant="white" className="border-0" onClick={() => updateQty(item._id, item.qty - 1)}>-</Button>
                              <Form.Control 
                                className="text-center border-0 bg-transparent fw-bold" 
                                value={item.qty} 
                                readOnly 
                              />
                              <Button variant="white" className="border-0" onClick={() => updateQty(item._id, item.qty + 1)}>+</Button>
                            </InputGroup>
                          </div>
                          
                          <div className="text-end">
                            <span className="small text-muted">Subtotal:</span>
                            <span className="fw-bold d-block">₹{item.price * item.qty}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </Col>

            {/* SUMMARY PANEL */}
            <Col lg={4}>
              <Card className="border-0 shadow-sm rounded-4 p-4 sticky-top" style={{ top: "100px" }}>
                <h5 className="fw-bold mb-4">Order Summary</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span>Price ({items.length} items)</span>
                  <span>₹{total}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span>Delivery Charges</span>
                  <span className="text-success fw-bold">FREE</span>
                </div>
                <hr className="opacity-25" />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">Total Amount</h5>
                  <h4 className="fw-bold text-primary mb-0">₹{total}</h4>
                </div>
                <Button
                  variant="primary"
                  className="w-100 rounded-pill py-3 fw-bold shadow-sm"
                  onClick={() => navigate("/payment", { state: { cart: items, total } })}
                >
                  Proceed to Checkout
                </Button>
                <div className="text-center mt-3">
                    <small className="text-muted">Safe and Secure Payments</small>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      <Footer />
    </div>
  );
};

export default CartPage;