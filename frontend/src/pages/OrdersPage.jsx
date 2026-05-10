import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import { 
  Container, 
  Button, 
  Card, 
  Row, 
  Col,
  Form,
  InputGroup,
  Modal
} from "react-bootstrap";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import Chat from "../components/Chat"; // Ensure the path to your Chat component is correct

// Fix for default marker icons in Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({ 
  iconUrl: markerIcon, 
  shadowUrl: markerShadow, 
  iconSize: [25, 41], 
  iconAnchor: [12, 41] 
});
L.Marker.prototype.options.icon = DefaultIcon;

const RoutingMachine = ({ from, to }) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !from || !to) return;
    const routingControl = L.Routing.control({
      waypoints: [L.latLng(from[0], from[1]), L.latLng(to[0], to[1])],
      lineOptions: { 
        styles: [{ color: "#0d6efd", weight: 5, opacity: 0.8 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createGeocoder: () => null,
      containerClassName: 'd-none'
    }).addTo(map);

    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, from, to]);
  return null;
};

const OrdersPage = () => {
  const API = import.meta.env.VITE_API_URL;
  const IMAGE_BASE_URL = API ? API.replace(/\/api\/?$/, "") : ""; 

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);
  const [systemCoords, setSystemCoords] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // NEW: State for Active Chat
  const [activeChat, setActiveChat] = useState(null);

  const statusSteps = ["Ordered", "Packed", "Shipped", "Delivered"];

  const fetchOrders = () => {
    if (!user?._id) return;
    axios.get(`${API}/orders/user/${user._id}`)
      .then(res => {
        const sortedOrders = res.data.orders ? [...res.data.orders].reverse() : [];
        setOrders(sortedOrders);
      })
      .catch(err => console.error("Error fetching orders:", err));
  };

  useEffect(() => {
    if (!user?._id) {
      navigate("/login");
      return;
    };
    fetchOrders();
  }, [user, navigate]);

  // Inside OrdersPage.jsx

const handleFeedbackSubmit = async (e) => {
  e.preventDefault();
  try {
    // Note: Changed URL to match your delivery routes
    await axios.post(`${API}/delivery/feedback`, {
      orderId: selectedOrderForFeedback._id,
      rating: rating,
      comment: comment
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}` // Ensure token is sent
      }
    });

    alert("Thank you for your feedback! ⭐");
    setShowFeedbackModal(false);
    setComment("");
    setRating(5);
    fetchOrders(); // Refresh list to hide the "Rate" button
  } catch (err) {
    console.error("Feedback Error:", err);
    alert(err.response?.data?.message || "Error submitting feedback.");
  }
};
  
  const handleLiveTrack = async (order) => {
    setLoadingMap(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const driverLat = pos.coords.latitude;
        const driverLon = pos.coords.longitude;
        setSystemCoords([driverLat, driverLon]);
        try {
          const query = encodeURIComponent(order.shipAddress);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
          const data = await res.json();
          if (data && data.length > 0) {
            setUserCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
            setShowMap(true);
          } else {
            alert("Could not locate shipping address.");
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingMap(false);
        }
      },
      () => {
        setLoadingMap(false);
        alert("Please enable location services.");
      }
    );
  };

  const filtered = orders.filter(o => 
    o.items.some(i => i.product?.product_name?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <Navigation />

      <Container className="py-5 flex-grow-1">
        {/* Toggle View: Show Chat or Order List */}
        {activeChat ? (
          <div className="animate__animated animate__fadeIn">
            <Chat 
              orderId={activeChat.orderId}
              receiverId={activeChat.riderId} // Note: You need the rider's ID from the order object
              receiverName="Delivery Partner"
              onBack={() => setActiveChat(null)}
            />
          </div>
        ) : (
          <>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
              <h3 className="fw-bold mb-0">Track Purchases</h3>
              <InputGroup style={{ maxWidth: '350px' }}>
                <Form.Control
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-start-pill border-0 shadow-sm ps-4"
                />
                <Button variant="white" className="rounded-end-pill border-0 shadow-sm bg-white text-muted">🔍</Button>
              </InputGroup>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted fs-5">No orders found.</p>
              </div>
            ) : (
              filtered.map(order => {
                const currentIdx = statusSteps.indexOf(order.status || "Ordered");
                const productData = order.items[0]?.product; 
                let rawPath = (productData?.images && productData.images.length > 0) ? productData.images[0] : productData?.image;
                const cleanPath = rawPath ? rawPath.replace(/\\/g, '/').replace(/^\/+/, "") : "";
                const displayImg = cleanPath ? `${IMAGE_BASE_URL}/${cleanPath}` : "https://placehold.co/300x300?text=No+Image";

                return (
                  <Card className="border-0 shadow-sm rounded-4 p-4 mb-4" key={order._id}>
                    <Row className="align-items-center">
                      <Col md={2} xs={4}>
                        <img 
                          src={displayImg} 
                          className="img-fluid rounded-3 shadow-sm border" 
                          alt="product" 
                          style={{ width: '100%', height: '110px', objectFit: 'cover'}}
                        />
                      </Col>
                      <Col md={6} xs={8}>
                        <h5 className="fw-bold mb-1 text-truncate">
                          {order.items.map(i => i.product?.product_name || "Unknown Product").join(", ")}
                        </h5>
                        <p className="text-muted small mb-0">
                          Total: <span className="text-dark fw-bold">₹{order.total.toLocaleString('en-IN')}</span> • ID: {order._id.slice(-6).toUpperCase()}
                        </p>
                        
                        {/* Status Tracker */}
                        <div className="position-relative mt-4 mb-5" style={{ maxWidth: '420px' }}>
                          <div className="position-absolute w-100 bg-secondary-subtle" style={{ height: '3px', top: '7px', zIndex: 1 }}>
                            <div className="bg-primary h-100" style={{ width: `${(currentIdx / (statusSteps.length - 1)) * 100}%`, transition: '0.6s' }}></div>
                          </div>
                          <div className="d-flex justify-content-between">
                            {statusSteps.map((step, i) => (
                              <div key={step} className="position-relative" style={{ zIndex: 2 }}>
                                <div className={`rounded-circle border border-2 border-white shadow-sm ${i <= currentIdx ? 'bg-primary' : 'bg-secondary-subtle'}`} style={{ width: '16px', height: '16px' }}></div>
                                <div className="position-absolute translate-middle-x start-50 pt-2 text-center" style={{ width: '70px' }}>
                                  <span className={`d-block fw-bold ${i <= currentIdx ? 'text-primary' : 'text-muted opacity-50'}`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>{step}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Col>
                      
                      <Col md={4} className="text-md-end mt-3 mt-md-0">
                        <div className="d-flex flex-column align-items-md-end gap-2">
                          {order.status === "Shipped" ? (
                            <>
                              <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold border-0" onClick={() => handleLiveTrack(order)} disabled={loadingMap}>
                                {loadingMap ? "Locating..." : "Live Route 🛣️"}
                              </Button>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="rounded-pill px-3 fw-bold mt-1 shadow-sm"
                                onClick={() => setActiveChat({
                                  orderId: order._id,
                                  riderId: order.deliveryPerson // Ensure your backend populates this field
                                })}
                              >
                                Chat with Rider 🛵
                              </Button>
                            </>
                          ) : order.status === "Delivered" ? (
                            <>
                              <span className="badge bg-success-subtle text-success px-4 py-2 rounded-pill fw-bold border border-success border-opacity-10 mb-1">✓ Delivered</span>
                              {!order.reviewed && (
                                 <Button 
                                  variant="warning" 
                                  size="sm" 
                                  className="rounded-pill px-3 fw-bold shadow-sm"
                                  onClick={() => {
                                    setSelectedOrderForFeedback(order);
                                    setShowFeedbackModal(true);
                                  }}
                                 >Rate Service ⭐</Button>
                              )}
                            </>
                          ) : (
                            <div className="small text-muted mb-0 fst-italic bg-light p-2 rounded border px-3">
                              Tracker available when Shipped
                            </div>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                );
              })
            )}
          </>
        )}
      </Container>

      {/* FEEDBACK MODAL (Stays same) */}
      <Modal show={showFeedbackModal} onHide={() => setShowFeedbackModal(false)} centered>
        <Modal.Header closeButton className="border-0 p-4 pb-0">
          <Modal.Title className="fw-bold">Rate Our Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFeedbackSubmit}>
          <Modal.Body className="px-4 pb-4">
            <Form.Group className="mb-4 text-center">
              <Form.Label className="d-block text-muted small fw-bold text-uppercase mb-3">Your Rating</Form.Label>
              <div className="d-flex justify-content-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant={rating >= star ? "warning" : "light"}
                    className="rounded-circle border-0 shadow-sm"
                    style={{ width: '45px', height: '45px' }}
                    onClick={() => setRating(star)}
                  >⭐</Button>
                ))}
              </div>
            </Form.Group>
            <Form.Group>
              <Form.Label className="text-muted small fw-bold text-uppercase">Comment</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                className="bg-light border-0 rounded-3"
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4 pt-0">
            <Button variant="primary" type="submit" className="w-100 rounded-pill py-2 fw-bold border-0 shadow">Submit Review</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MAP MODAL (Stays same) */}
      {showMap && systemCoords && userCoords && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1050 }} onClick={() => setShowMap(false)}>
          <div className="modal-dialog modal-lg modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 rounded-4 overflow-hidden shadow-lg">
              <div className="p-3 d-flex justify-content-between align-items-center bg-white border-bottom">
                <div>
                    <h6 className="fw-bold mb-0">Delivery Route</h6>
                    <small className="text-muted">Live Tracking</small>
                </div>
                <button className="btn-close" onClick={() => setShowMap(false)}></button>
              </div>
              <div style={{ height: "500px", width: "100%" }}>
                <MapContainer center={systemCoords} zoom={13} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={systemCoords}></Marker>
                  <Marker position={userCoords}></Marker>
                  <RoutingMachine from={systemCoords} to={userCoords} />
                </MapContainer>
              </div>
              <div className="p-3 bg-white text-center small text-muted border-top">
                <span className="me-3">🔵 Driver</span>
                <span>🚩 Shipping Point</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default OrdersPage;