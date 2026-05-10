import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Table, Badge, Form, Spinner, Button, Modal, ListGroup, InputGroup, Row, Col } from "react-bootstrap";
import { Eye, Trash2, Search, RefreshCw, Package, Phone, MapPin, User, Building2, Mail, CreditCard, ShieldCheck } from "lucide-react";
import Sidebar from "./Sidebar";

const OrderManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  
  // State Management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Auth Config
  const getAdminConfig = () => {
    const token = localStorage.getItem("adminToken");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch Logic
  const fetchOrders = useCallback(async (isManual = false) => {
    try {
      isManual ? setRefreshing(true) : setLoading(true);
      const res = await axios.get(`${API}/orders/all`, getAdminConfig());
      const data = res.data.orders || [];
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) alert("Session Expired. Please login again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [API]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Comprehensive Search Logic (ID, Name, Email, Phone, Brand)
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const results = orders.filter(o => {
      // Search by Order/Customer Data
      const matchesBasic = (
        o._id.toLowerCase().includes(term) ||
        o.user?.name?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term) ||
        o.phone?.includes(term)
      );

      // Search by Merchant/Dealer Data
      const matchesDealer = o.items?.some(item => {
        const dealer = item.dealerId || item.product?.dealerId;
        return (
          item.product?.product_name?.toLowerCase().includes(term) ||
          dealer?.brandName?.toLowerCase().includes(term) ||
          dealer?.ownerName?.toLowerCase().includes(term)
        );
      });

      return matchesBasic || matchesDealer;
    });
    setFilteredOrders(results);
  }, [searchTerm, orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`${API}/orders/status/${orderId}`, { status: newStatus }, getAdminConfig());
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const handleDelete = async (orderId) => {
    if (window.confirm("CRITICAL: Permanently delete this order record?")) {
      try {
        await axios.delete(`${API}/orders/${orderId}`, getAdminConfig());
        setOrders(prev => prev.filter(o => o._id !== orderId));
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = { Delivered: "success", Shipped: "primary", Cancelled: "danger", Packed: "info" };
    return colors[status] || "warning";
  };

  return (
    <Sidebar>
      <div className="bg-white rounded-4 shadow-sm p-4 border">
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Live Order Console</h4>
            <p className="text-muted small mb-0">Dual-view: Customer Logistics & Merchant Fulfillment</p>
          </div>

          {/* SEARCH AND REFRESH CONTAINER */}
<div className="d-flex align-items-stretch gap-2 w-100" style={{ maxWidth: "550px" }}>
  
  {/* Search Bar - flex-grow-1 ensures it takes up the available space */}
  <InputGroup className="shadow-sm border rounded-3 overflow-hidden flex-grow-1">
    <InputGroup.Text className="bg-white border-0 py-0">
      <Search size={18} className="text-muted" />
    </InputGroup.Text>
    <Form.Control
      placeholder="Search Name, Email, Brand, or Product..."
      className="border-0 shadow-none py-2" // py-2 defines the consistent height
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{ height: "45px" }} // Explicit height for perfect matching
    />
  </InputGroup>

  {/* Refresh Button - height matches the input exactly */}
  <Button 
    variant="white" 
    className="border shadow-sm px-3 d-flex align-items-center justify-content-center bg-white" 
    style={{ 
      minWidth: "50px", 
      height: "45px", // Matches the Form.Control height
      borderRadius: "8px" 
    }}
    onClick={() => fetchOrders(true)} 
    disabled={refreshing}
  >
    <RefreshCw 
      size={18} 
      className={refreshing ? "spin-animation text-primary" : "text-dark"} 
    />
  </Button>
</div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Synchronizing secure data...</p>
          </div>
        ) : (
          <Table hover responsive className="align-middle border-top">
            <thead className="bg-light small text-uppercase fw-bold text-muted">
              <tr>
                <th style={{ width: '100px' }}>Order ID</th>
                <th>Customer Contact</th>
                <th>Merchant/Brand</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o) => {
                  // SAFE RESOLUTION: Check if items exist before accessing index 0
                  const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
                  const dealer = firstItem?.dealerId || firstItem?.product?.dealerId;
                  
                  return (
                    <tr key={o._id} className="border-bottom-0">
                      <td className="fw-bold text-primary small">#{o._id.slice(-6).toUpperCase()}</td>
                      
                      <td>
                        <div className="fw-bold text-dark">User: {o.user?.name || "Guest User"}</div>
                        <div className="text-muted small d-flex align-items-center gap-1">
                           <Mail size={12}/> {o.email || "No Email"}
                        </div>
                        <div className="text-muted small d-flex align-items-center gap-1">
                           <Phone size={12}/> {o.phone || "No Phone"}
                        </div>
                      </td>

                      <td>
                        <div className="fw-bold text-warning">Brand: {dealer?.brandName || "Unknown"}</div>
                        <div className="text-muted extra-small">Merchant: {dealer?.ownerName || "Default Vendor"}</div>
                        <div className="text-muted extra-small"><Mail size={10}/> {dealer?.email || "N/A"}</div>
                        <div className="text-muted extra-small"><Phone size={10}/> {dealer?.phone || "N/A"}</div>
                      </td>

                      <td><span className="fw-bold">₹{o.total?.toLocaleString()}</span></td>
                      
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Badge bg={getStatusColor(o.status)} className="mb-1">{o.status}</Badge>
                          <Form.Select 
                            size="sm" 
                            className="extra-small border-0 bg-light fw-bold" 
                            value={o.status} 
                            onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          >
                            {["Ordered", "Packed", "Shipped", "Delivered", "Cancelled"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </Form.Select>
                        </div>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <Button variant="link" className="p-2" onClick={() => { setSelectedOrder(o); setShowPreview(true); }}>
                            <Eye size={20} className="text-primary"/>
                          </Button>
                          <Button variant="link" className="p-2" onClick={() => handleDelete(o._id)}>
                            <Trash2 size={20} className="text-danger"/>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="6" className="text-center py-5 text-muted font-italic">No records found matching "{searchTerm}"</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* --- PREVIEW MODAL --- */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0 bg-light">
          <Modal.Title className="fw-bold">Full Transaction Audit</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedOrder && (
            <>
              <Row className="g-4 mb-4">
                <Col md={6}>
                  <div className="p-3 bg-light rounded-4 h-100 border-start border-primary border-4 shadow-sm">
  <h6 className="fw-bold text-primary mb-3 small uppercase d-flex align-items-center gap-2">
    <User size={14} /> Shipping Information
  </h6>

  {/* Row by Row matching the Merchant style */}
  <div className="small mb-1">
    <span className="text-muted">User:</span> {selectedOrder.user?.name || "Guest User"}
  </div>

  <div className="small mb-1">
    <span className="text-muted">Address:</span> {selectedOrder.shipAddress}
  </div>

  <div className="small mb-1">
    <span className="text-muted">Phone:</span> {selectedOrder.phone || "N/A"}
  </div>

  <div className="small mb-1">
    <span className="text-muted">Email:</span> {selectedOrder.email || "N/A"}
  </div>

  {/* Optional: Visual spacer to match the "KYC Status" area in merchant if needed */}
  <div className="extra-small mt-2 pt-2 border-top text-muted">
    <ShieldCheck size={12} className="me-1 text-primary"/>
    Verified Customer Account
  </div>
</div>
                </Col>

                <Col md={6}>
                  <div className="p-3 bg-light rounded-4 h-100 border-start border-warning border-4 shadow-sm">
                    <h6 className="fw-bold text-warning mb-3 small uppercase d-flex align-items-center gap-2">
                      <Building2 size={14}/> Merchant Details
                    </h6>
                    {(() => {
                      const firstItem = selectedOrder.items && selectedOrder.items.length > 0 ? selectedOrder.items[0] : null;
                      const dealer = firstItem?.dealerId || firstItem?.product?.dealerId;
                      
                      if (dealer) {
                        return (
                          <>
                            <div className="small mb-1"><span className="text-muted">Brand:</span> {dealer.brandName}</div>
                            <div className="small mb-1"><span className="text-muted">Owner:</span> {dealer.ownerName}</div>
                            <div className="small mb-1"><span className="text-muted">Email:</span> {dealer.phone}</div>
                            <div className="small mb-1"><span className="text-muted">Email:</span> {dealer.email}</div>
                            <div className="small mb-1 d-flex align-items-center gap-1">
                              <CreditCard size={12} className="text-muted"/> 
                              <span className="text-muted">PAN:</span> {dealer.panNumber || "N/A"}
                            </div>
                            <div className="extra-small mt-2 pt-2 border-top">
                              <ShieldCheck size={12} className="text-success me-1"/>
                              KYC Status: <Badge bg="success" className="py-1 px-2" style={{fontSize: '10px'}}>{dealer.status || "Approved"}</Badge>
                            </div>
                          </>
                        );
                      }
                      return <p className="text-muted small italic py-2">System Warehouse Fulfillment</p>;
                    })()}
                  </div>
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold mb-0"><Package size={16} className="me-2"/> Dispatched Items</h6>
                <Badge bg="dark" className="px-3 py-2">Payment: {selectedOrder.payment?.toUpperCase() || "N/A"}</Badge>
              </div>

              <ListGroup className="border-0 shadow-sm rounded-4 overflow-hidden">
                {selectedOrder.items?.map((item, i) => (
                  <ListGroup.Item key={i} className="d-flex justify-content-between align-items-center py-3 px-4">
                    <div>
                      {/* Note: product_name might be directly on item or inside product object depending on your populate schema */}
                      <div className="fw-bold text-dark">{item.product_name || item.product?.product_name || "Unknown Product"}</div>
                      <small className="text-muted">Quantity: {item.quantity} units @ ₹{item.price}</small>
                    </div>
                    <span className="fw-bold text-primary">₹{(item.quantity * item.price).toLocaleString()}</span>
                  </ListGroup.Item>
                ))}
                <ListGroup.Item className="bg-dark text-white d-flex justify-content-between align-items-center py-3 px-4">
                  <span className="fw-bold">ORDER TOTAL</span>
                  <span className="h4 mb-0 fw-bold">₹{selectedOrder.total?.toLocaleString()}</span>
                </ListGroup.Item>
              </ListGroup>
              
              <div className="mt-3 text-center">
                <small className="text-muted extra-small">Order Reference: {selectedOrder._id}</small>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .spin-animation { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .extra-small { font-size: 0.72rem; }
        .uppercase { text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </Sidebar>
  );
};

export default OrderManagement;