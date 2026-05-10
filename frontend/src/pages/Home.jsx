


import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

// ✅ 1. Import your new separated Chatbot Component
import AdvancedChatbot from "../components/AdvancedChatbot";

// ✅ Styles & Icons
//import "./dashboard.css";
import "./dealer/dashboard.css";
import { Sparkles, TrendingUp, Search as SearchIcon } from "lucide-react";

// ✅ Components
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

// ✅ React Bootstrap
import {
  Container, Row, Col, Button, Card, Form, InputGroup
} from "react-bootstrap";

const Home = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const user = useSelector((state) => state.auth.user);
  const accessToken = localStorage.getItem("accessToken");

  const IMAGE_BASE_URL = API.replace(/\/api\/?$/, "");
  const socket = useRef(null);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");

  // --- 1. INITIAL LOAD (All Products & Categories) ---
  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`${API}/products/`);
        const fetchedProducts = res?.data?.products || res?.data || [];
        setProducts(fetchedProducts);

        const categoryMap = new Map();
        fetchedProducts.forEach(p => {
          if (p.category?._id) categoryMap.set(p.category._id, p.category);
          else if (p.category) categoryMap.set(p.category, { _id: p.category, name: p.category });
        });
        setCategories(Array.from(categoryMap.values()));
      } catch (err) {
        console.error("Fetch Error:", err.message);
      }
    }
    load();
  }, [API]);

  // --- 2. SOCKET INITIALIZATION (Keep this so we can pass it to the chatbot) ---
  useEffect(() => {
    if (!user?._id) return;
    if (!socket.current) {
      socket.current = io(IMAGE_BASE_URL, {
        reconnection: true,
        transports: ["websocket", "polling"],
      });
    }
  }, [user?._id, IMAGE_BASE_URL]);

  // --- 3. EVENT HANDLERS ---
  const handleProductClick = async (id) => {
    try {
      await axios.patch(`${API}/products/click/${id}`);
      navigate(`/product/${id}`);
    } catch (err) {
      navigate(`/product/${id}`);
    }
  };

  const handleSeeAllAI = () => {
    navigate("/search", { state: { aiMode: true } });
  };
  const handleSeeAllSuggested = () => {
    navigate("/suggested-for-you");
  };
  return (
    <div className="dashboard-wrapper bg-light" style={{ minHeight: "100vh" }}>
      <Navigation />

      {/* --- HERO SECTION --- */}
      <div className="hero-section text-center py-5 bg-dark text-white mb-5 shadow">
        <Container>
          <h1 className="display-4 fw-bold">YuKTI Intelligence</h1>
          <p className="lead mb-4 opacity-75">Your behavior drives our recommendations. Experience the future of shopping.</p>
          <div className="mx-auto" style={{ maxWidth: "600px" }}>
            <InputGroup className="bg-white rounded-pill p-1">
              <Form.Control
                placeholder="Search premium products..."
                className="border-0 ps-4 shadow-none rounded-pill"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate("/search", { state: { query: search } })}
              />
              <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate("/search", { state: { query: search } })}>
                <SearchIcon size={18} />
              </Button>
            </InputGroup>
          </div>
        </Container>
      </div>

      <Container className="pb-5">
        {/* --- CATEGORIES --- */}
        <section className="mb-5">
          <SectionHeader title="Categories" hideSeeAll />
          <Row className="g-3">
            {categories.slice(0, 6).map((cat) => (
              <Col key={cat._id} xs={4} md={2}>
                <Card className="text-center p-3 border-0 shadow-sm transition-hover" onClick={() => navigate(`/category/${cat._id}`)} style={{ cursor: "pointer" }}>
                  <div className="fw-bold small text-truncate">{cat.name || "General"}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </section>




        {/* --- ⭐ TRENDING NOW (Threshold-Based Logic) --- */}
        <AISuggestionRow
          title="Trending Now"
          endpoint="/trending/now" // Calls your new /api/trending/now route
          IMAGE_BASE_URL={IMAGE_BASE_URL}
          onClick={handleProductClick}
          onSeeAll={handleSeeAllAI}
          icon={<TrendingUp className="text-danger me-2" />}
        />
        {/* --- ⭐ AI FEATURE: PERSONALIZED RECOMMENDATIONS --- */}
        {user && (
          <AISuggestionRow
            title="Suggested for You"
            endpoint="/ai/personalized" // This fetches the 6-item preview
            token={accessToken}
            onSeeAll={handleSeeAllSuggested} // ✅ Use the new dedicated handler
            IMAGE_BASE_URL={IMAGE_BASE_URL}
            onClick={handleProductClick}
            icon={<Sparkles className="text-primary me-2" />}
          />
        )}

        {/* --- ALL PRODUCTS --- */}
        <section className="mb-5">
          <SectionHeader title="Explore Marketplace" onSeeAll={() => navigate('/search')} />
          <ProductGrid items={products.slice(0, 12)} IMAGE_BASE_URL={IMAGE_BASE_URL} onClick={handleProductClick} />
        </section>
      </Container>

      {/* ✅ 2. THIS IS ALL YOU NEED NOW! It calls the external file. */}
      <AdvancedChatbot socket={socket.current} userId={user?._id} />

      <Footer />
    </div>
  );
};

const AISuggestionRow = ({ title, endpoint, token, IMAGE_BASE_URL, onClick, onSeeAll, icon }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchAI = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`${API}${endpoint}`, config);
        // Extract products or default to empty array
        setItems(res.data?.products || []);
      } catch (err) {
        console.error(`Error loading ${title}:`, err);
      } finally {
        setLoading(false);
      }
    };
    fetchAI();
  }, [endpoint, token, API]);

  // Only return null while strictly loading to prevent layout shift
  if (loading) return null;

  // Even if items are empty, keeping the structure helps debug visibility
  return (
    <section className="mb-5">
      <SectionHeader title={title} onSeeAll={onSeeAll} icon={icon} />
      <ProductGrid items={items.slice(0, 6)} IMAGE_BASE_URL={IMAGE_BASE_URL} onClick={onClick} />
    </section>
  );
};


const ProductGrid = ({ items, IMAGE_BASE_URL, onClick }) => (
  <Row className="g-4">
    {items.map((p) => {
      const imgPath = p.images?.[0] || p.image || "";
      const displayImg = imgPath ? `${IMAGE_BASE_URL.replace(/\/+$/, "")}/${imgPath.replace(/^\/+/, "")}` : "https://via.placeholder.com/300";

      return (
        <Col key={p._id} xs={6} md={4} lg={3} xl={2}>
          <Card className="h-100 border-0 shadow-sm modern-card p-2" onClick={() => onClick(p._id)} style={{ cursor: "pointer", borderRadius: "15px" }}>
            <div className="text-center mb-2" style={{ height: "140px" }}>
              <Card.Img src={displayImg} className="h-100 w-100" style={{ objectFit: "contain" }} />
            </div>
            <Card.Body className="p-2 text-center">
              <Card.Title className="small fw-bold text-truncate mb-1">{p.product_name}</Card.Title>
              <div className="text-primary fw-bold small">₹{p.price}</div>
            </Card.Body>
          </Card>
        </Col>
      );
    })}
  </Row>
);

const SectionHeader = ({ title, onSeeAll, hideSeeAll, icon }) => (
  <div className="d-flex justify-content-between align-items-center mb-3">
    <div className="d-flex align-items-center">
      {icon}
      <h4 className="fw-bold m-0">{title}</h4>
    </div>
    {!hideSeeAll && <Button variant="link" onClick={onSeeAll} className="text-decoration-none fw-bold p-0">See All →</Button>}
  </div>
);

export default Home;