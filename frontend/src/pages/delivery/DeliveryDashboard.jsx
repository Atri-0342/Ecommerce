import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { 
  Row, Col, Card, Button, Badge, Spinner, 
  Modal, Form, InputGroup, Container 
} from "react-bootstrap";
import { 
  MapPin, Phone, CheckCircle, 
  NavigationArrow, MagnifyingGlass, 
  ChatTeardropDots, Clock, HouseLine, 
  CaretRight, X
} from "@phosphor-icons/react";
import DeliverySidebar from "./DeliverySidebar";
import Chat from "./Chat";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

// --- Leaflet Setup ---
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const riderIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/71/71422.png',
  iconSize: [35, 35],
});

const customerIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1277/1277010.png',
  iconSize: [35, 35],
});

const RoutingMachine = ({ from, to }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;
    const routingControl = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: { styles: [{ color: "#0d6efd", weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: () => null,
    }).addTo(map);
    return () => map.removeControl(routingControl);
  }, [map, from, to]);
  return null;
};

const MapRefresher = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 500);
  }, [map]);
  return null;
};

const DeliveryDashboard = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const { deliveryToken, deliveryInfo } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [riderPos, setRiderPos] = useState(null);
  const [activeChat, setActiveChat] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${deliveryToken}` } };
      const { data } = await axios.get(`${API}/delivery/my-tasks`, config);

      // The backend returns { success: true, order: { ... } }
      // We wrap the single order in an array so your .map() function works
      if (data.order) {
        setActiveOrders([data.order]); 
      } else {
        setActiveOrders([]);
      }
      
      // If your backend doesn't have a separate "available" logic yet, 
      // keep this as an empty array to prevent errors.
      setAvailableOrders([]); 
      
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryToken) fetchData();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setRiderPos([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [deliveryToken]);

  const handlePickUp = async (orderId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${deliveryToken}` } };
      await axios.put(`${API}/delivery/ship/${orderId}`, {}, config);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Error picking up order");
    }
  };

  // --- UPDATED NAVIGATION LOGIC ---
  const handleCompleteDelivery = (id) => {
    // Points to SuccessVerifyOtp.jsx
    navigate(`/delivery/verify-success/${id}`);
  };

  const handleCancelTask = (id) => {
    // Points to CancelVerifyOtp.jsx
    navigate(`/delivery/verify-cancel/${id}`);
  };

  const filteredActive = activeOrders.filter(o => 
    o.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.shipAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredAvailable = availableOrders.filter(o => 
    o._id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DeliverySidebar>
      <Container className="py-3" style={{ maxWidth: "1000px" }}>
        
        {activeChat ? (
          <div className="chat-view-container shadow-sm rounded-4 bg-white overflow-hidden">
            <Chat 
              orderId={activeChat.orderId} 
              receiverId={activeChat.receiverId}
              receiverName={activeChat.name}
              onBack={() => setActiveChat(null)} 
            />
          </div>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h3 className="fw-bold m-0 text-dark">Deliveries</h3>
                <span className="text-muted small">
                  <HouseLine size={16} className="me-1" /> {deliveryInfo?.warehouse?.name || "Global Hub"}
                </span>
              </div>
              <Button variant="white" onClick={fetchData} className="shadow-sm border rounded-pill px-3">
                <Clock size={18} className="me-1" /> Refresh
              </Button>
            </div>

            <InputGroup className="mb-4 shadow-sm rounded-4 overflow-hidden border">
              <InputGroup.Text className="bg-white border-0 ps-3">
                <MagnifyingGlass size={20} weight="bold" className="text-muted" />
              </InputGroup.Text>
              <Form.Control 
                className="border-0 py-3" 
                placeholder="Search by customer or address..." 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <Row>
                <Col lg={12} className="mb-4">
                  <h6 className="fw-bold text-uppercase text-muted small mb-3">Active Deliveries ({filteredActive.length})</h6>
                  {filteredActive.map(order => (
                    <Card key={order._id} className="border-0 shadow-sm rounded-4 mb-3 overflow-hidden task-card">
                      <Card.Body className="p-0">
                        <div className="p-3 d-flex justify-content-between align-items-center bg-light border-bottom">
                          <Badge bg="soft-primary" className="text-primary rounded-pill px-3 py-2" style={{ backgroundColor: '#e0eefe' }}>
                            <NavigationArrow weight="fill" className="me-1" /> IN TRANSIT
                          </Badge>
                          <span className="small text-muted fw-bold">#{order._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="p-3 d-flex align-items-center">
                          <div className="flex-grow-1" onClick={() => { setSelectedOrder(order); setShowMapModal(true); }} style={{cursor: 'pointer'}}>
                            <h5 className="fw-bold mb-1">{order.user?.name}</h5>
                            <div className="text-muted small"><MapPin size={16} weight="fill" className="text-danger" /> {order.shipAddress}</div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button 
                              onClick={() => setActiveChat({ 
                                orderId: order._id, 
                                receiverId: order.user?._id, 
                                name: order.user?.name 
                              })} 
                              variant="light" 
                              className="rounded-circle border p-2"
                            >
                              <ChatTeardropDots size={24} className="text-primary" />
                            </Button>
                            <Button 
                              onClick={() => handleCompleteDelivery(order._id)} 
                              variant="primary" 
                              className="rounded-4 px-4 fw-bold"
                            >
                              Verify <CaretRight size={16} weight="bold" />
                            </Button>
                            <Button 
                    variant="outline-danger" 
                    onClick={() => handleCancelTask(selectedOrder?._id)} 
                    className="rounded-4 px-4 fw-bold"
                  >
                    <X size={18} className="me-1" /> Cancel Task <CaretRight size={16} weight="bold" />
                  </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Col>
              </Row>
            )}
          </>
        )}

        {/* --- MAP MODAL --- */}
        <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered className="modern-modal">
          <Modal.Body className="p-0 overflow-hidden rounded-4">
            <div style={{ height: "400px", position: "relative" }}>
              <MapContainer center={riderPos || [22.5, 88.3]} zoom={14} style={{ height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapRefresher />
                {riderPos && <Marker position={riderPos} icon={riderIcon} />}
                {selectedOrder && (
                  <>
                    <Marker position={[selectedOrder.lat || 22.58, selectedOrder.lon || 88.37]} icon={customerIcon} />
                    {riderPos && <RoutingMachine from={riderPos} to={[selectedOrder.lat || 22.58, selectedOrder.lon || 88.37]} />}
                  </>
                )}
              </MapContainer>
            </div>
            <div className="p-4">
              <div className="d-flex justify-content-between mb-3">
                <h4 className="fw-bold">{selectedOrder?.user?.name}</h4>
                <a href={`tel:${selectedOrder?.phone}`} className="btn btn-dark rounded-pill px-3">
                  <Phone size={18} className="me-2" /> Call
                </a>
              </div>
              <p className="text-muted mb-4">
                <MapPin size={18} className="me-1 text-danger" /> {selectedOrder?.shipAddress}
              </p>
              
              <Row className="g-2">
                <Col>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => handleCancelTask(selectedOrder?._id)} 
                    className="w-100 rounded-4 py-2 fw-bold"
                  >
                    <X size={18} className="me-1" /> Cancel Task
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="success" 
                    onClick={() => handleCompleteDelivery(selectedOrder?._id)} 
                    className="w-100 rounded-4 py-2 fw-bold"
                  >
                    <CheckCircle size={18} className="me-1" /> Complete Delivery
                  </Button>
                </Col>
              </Row>
            </div>
          </Modal.Body>
        </Modal>
      </Container>
    </DeliverySidebar>
  );
};

export default DeliveryDashboard;