import React, { useState, useEffect, useMemo } from "react";
import { 
  Container, Table, Button, Modal, Badge, 
  Card, Spinner, Row, Col, ListGroup, Form, InputGroup 
} from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "./Sidebar";
import { 
  Package, Truck, Eye, ArrowsClockwise, 
  MapPin, HouseLine, MagnifyingGlass, XCircle
} from "@phosphor-icons/react";

const DealerOrderManagement = () => {
  const { merchantToken } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      const res = await axios.get(`${API_URL}/orders/dealer-orders`, config);
      if (res.data.success) setOrders(res.data.orders);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const searchStr = searchTerm.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchStr) ||
        order.user?.name?.toLowerCase().includes(searchStr) ||
        order.phone?.includes(searchStr)
      );
    });
  }, [orders, searchTerm]);

  const updateStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      await axios.put(`${API_URL}/orders/status/${orderId}`, { status }, config);
      fetchMyOrders();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleShipmentDispatch = async (orderId) => {
    setUpdating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      const res = await axios.put(`${API_URL}/orders/ship/${orderId}`, {}, config);
      alert(`Success! Routed to ${res.data.warehouse}\nOTP: ${res.data.otp}`);
      fetchMyOrders();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || "Logistics Error");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = { Ordered: "warning", Packed: "info", Shipped: "primary", Delivered: "success", Cancelled: "danger" };
    return <Badge bg={colors[status] || "secondary"} className="px-3 py-2 rounded-pill">{status}</Badge>;
  };

  return (
    <Sidebar>
      <Container fluid className="py-4">
        {/* --- HEADER SECTION (Matches Image Top) --- */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#1a1a1a" }}>Order Management</h2>
            <p className="text-muted mb-0">Track and dispatch inventory to nearest hubs</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={fetchMyOrders} 
              disabled={loading} 
              className="d-flex align-items-center justify-content-center"
              style={{ width: "42px", height: "42px", borderRadius: "8px" }}
            >
              <ArrowsClockwise size={20} className={loading ? "spin-animation" : ""} />
            </Button>
          </div>
        </div>

        {/* --- SEARCH BOX SECTION (Matches Image Card) --- */}
        <Card className="border-0 shadow-sm rounded-4 mb-4 p-3" style={{ backgroundColor: "#fdfdfd" }}>
          <InputGroup className="bg-light rounded-3 px-2 border-0">
            <InputGroup.Text className="bg-transparent border-0 pe-0">
              <MagnifyingGlass size={20} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by Order ID, name or phone..."
              className="bg-transparent border-0 py-2 shadow-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: "1.05rem" }}
            />
          </InputGroup>
        </Card>

        {/* --- TABLE SECTION --- */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                <th className="ps-4 py-3 text-muted small text-uppercase fw-bold">Order ID</th>
                <th className="py-3 text-muted small text-uppercase fw-bold">Customer</th>
                <th className="py-3 text-muted small text-uppercase fw-bold">Items</th>
                <th className="py-3 text-muted small text-uppercase fw-bold">Status</th>
                <th className="py-3 text-muted small text-uppercase text-end pe-4 fw-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No orders found.</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="ps-4 fw-bold">#{order._id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-medium">{order.user?.name || "Guest"}</span>
                        <small className="text-muted">{order.phone}</small>
                      </div>
                    </td>
                    <td><Badge bg="light" text="dark" className="border">{order.items.length} Items</Badge></td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td className="text-end pe-4">
                      <Button variant="light" size="sm" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                        <Eye size={18} className="text-primary me-1" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>

        {/* --- FULFILLMENT MODAL --- */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">Fulfillment Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4 pt-0">
            {selectedOrder && (
              <Row className="g-4">
                <Col md={7}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <Package size={20} className="me-2 text-primary" /> Order Manifest
                  </h6>
                  <ListGroup variant="flush" className="border rounded-4 mb-3">
                    {selectedOrder.items.map((item, idx) => (
                      <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="mb-0 fw-bold">{item.product?.product_name || "Product"}</p>
                          <small className="text-muted">Quantity: {item.quantity}</small>
                        </div>
                        <span className="fw-bold">₹{item.price * item.quantity}</span>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                  <div className="p-3 bg-light rounded-4 d-flex justify-content-between border">
                    <span className="fw-bold">Subtotal:</span>
                    <span className="fw-bold text-success">₹{selectedOrder.dealerTotal || selectedOrder.total}</span>
                  </div>
                </Col>

                <Col md={5}>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3 d-flex align-items-center">
                      <MapPin size={20} className="me-2 text-primary" /> Destination
                    </h6>
                    <div className="p-3 border rounded-4 small bg-white">
                      <p className="mb-1 fw-bold">{selectedOrder.user?.name}</p>
                      <p className="mb-0 text-muted">{selectedOrder.shipAddress}</p>
                    </div>
                  </div>

                  <h6 className="fw-bold mb-3 d-flex align-items-center">
                    <Truck size={20} className="me-2 text-primary" /> Dispatch Actions
                  </h6>
                  <div className="d-grid gap-2">
                    <Button 
                      variant="info" 
                      className="text-white fw-bold py-2"
                      disabled={updating || selectedOrder.status !== "Ordered"}
                      onClick={() => updateStatus(selectedOrder._id, "Packed")}
                    >
                      <Package className="me-2" /> Mark as Packed
                    </Button>

                    <Button 
                      variant="primary" 
                      className="fw-bold py-2 shadow-sm"
                      disabled={updating || selectedOrder.status !== "Packed"}
                      onClick={() => handleShipmentDispatch(selectedOrder._id)}
                    >
                      <HouseLine className="me-2" /> Assign to Warehouse
                    </Button>

                    <Button 
                      variant="outline-danger" 
                      className="mt-1"
                      disabled={updating || ["Delivered", "Cancelled", "Shipped"].includes(selectedOrder.status)}
                      onClick={() => updateStatus(selectedOrder._id, "Cancelled")}
                    >
                      <XCircle className="me-2" /> Cancel Order
                    </Button>
                  </div>

                  {selectedOrder.status === "Shipped" && (
                    <div className="mt-3 d-flex align-items-center justify-content-center gap-2 p-2 border-top border-bottom border-primary border-opacity-10">
  {/* Label */}
  <span className="text-primary fw-bold text-uppercase small" style={{ letterSpacing: '1px' }}>
    Delivery OTP:
  </span>

  {/* OTP Value */}
  <span className="fs-4 fw-bold text-primary font-monospace" style={{ letterSpacing: '4px' }}>
    {selectedOrder.deliveryOTP || "----"}
  </span>
</div>
                  )}
                </Col>
              </Row>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </Sidebar>
  );
};

export default DealerOrderManagement;