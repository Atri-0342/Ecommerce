import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ✅ Components
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import AdvancedChatbot from "./AdvancedChatbot";

// ✅ Styles & Icons
import "./dealer/dashboard.css";
import { TrendingUp, Search as SearchIcon, LayoutGrid, ArrowRight, ShoppingBag } from "lucide-react";

// ✅ React Bootstrap
import {
  Container, Row, Col, Button, Card, Form, InputGroup, Spinner, Badge
} from "react-bootstrap";

// ==========================================
// 🎨 ENHANCED UI STYLES
// ==========================================
const styles = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .modern-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: #fff;
    border-radius: 16px !important;
    border: 1px solid rgba(0,0,0,0.05) !important;
  }
  .modern-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    height: 2.6rem;
    line-height: 1.3;
  }

  .hero-banner {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 80px 0;
    color: white;
    border-radius: 0 0 40px 40px;
  }
`;

const Dashboard = ({ socket }) => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const user = useSelector((state) => state.auth.user);
  const accessToken = localStorage.getItem("accessToken");

  const IMAGE_BASE_URL = API.replace(/\/api\/?$/, "");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🛠️ DEBUG: Monitor Socket Connection
  useEffect(() => {
    if (socket) {
      console.log("🔌 Dashboard: Socket received successfully", socket.id);
    } else {
      console.warn("🔌 Dashboard: Socket is still null...");
    }
  }, [socket]);

  // Inject Styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          axios.get(`${API}/categories`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          axios.get(`${API}/products/`)
        ]);
        setCategories(catRes.data?.categories || []);
        setProducts(prodRes?.data?.products || []);
      } catch (err) {
        console.error("Dashboard Load Error:", err.message);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [API, accessToken]);

  const handleProductClick = async (id) => {
    try {
      await axios.patch(`${API}/products/click/${id}`);
      navigate(`/product/${id}`);
    } catch (err) {
      navigate(`/product/${id}`);
    }
  };

  // ✅ Handle AI-triggered search/filter
  const handleAISearchTrigger = (filterCriteria) => {
    console.log("🚀 AI Filtering Dashboard:", filterCriteria);
    // Navigates to search and passes filter data as state
    navigate("/search", { 
        state: { 
            query: filterCriteria.searchQuery || "", 
            category: filterCriteria.category, 
            brand: filterCriteria.brand 
        } 
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="grow" variant="primary" />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper bg-light" style={{ minHeight: "100vh" }}>
      <Navigation />

      {/* 1️⃣ SEARCH SECTION (HERO) */}
      <div className="hero-banner text-center mb-5 shadow-sm">
        <Container>
          <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill shadow-sm">Premium Experience</Badge>
          <h1 className="display-4 fw-bold">Smart Marketplace</h1>
          <p className="lead mb-4 opacity-75">Find the best deals and trending products seamlessly.</p>
          <div className="mx-auto" style={{ maxWidth: "600px" }}>
            <InputGroup className="bg-white rounded-pill p-2 shadow-lg border-0">
              <Form.Control
                placeholder="Search for products, brands or categories..."
                className="border-0 ps-4 shadow-none rounded-pill"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigate("/search", { state: { query: search } })}
              />
              <Button variant="primary" className="rounded-pill px-4 ms-2" onClick={() => navigate("/search", { state: { query: search } })}>
                <SearchIcon size={20} />
              </Button>
            </InputGroup>
          </div>
        </Container>
      </div>

      <Container className="pb-5">
        
        {/* 2️⃣ CATEGORY SECTION */}
        <section className="mb-5">
          <SectionHeader title="Top Categories" icon={<LayoutGrid className="me-2 text-secondary" />} hideSeeAll />
          <Row className="g-3 overflow-auto flex-nowrap pb-3 no-scrollbar">
            {categories.map((cat) => (
              <Col key={cat._id} xs={5} md={3} lg={2}>
                <Card 
                  className="border-0 shadow-sm text-center h-100 modern-card cursor-pointer" 
                  onClick={() => navigate(`/category/${cat._id}`)}
                >
                  <div style={{ height: "100px", background: "#f8f9fa", borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
                    <Card.Img 
                      src={cat.image ? `${IMAGE_BASE_URL}${cat.image}` : "https://via.placeholder.com/150"} 
                      style={{ objectFit: "cover", height: "100%", width: "100%" }} 
                    />
                  </div>
                  <Card.Body className="p-2">
                    <span className="fw-bold small text-dark d-block text-truncate">{cat.name}</span>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* 3️⃣ SUGGESTED PRODUCTS */}
        {user && (
  <AISuggestionRow
    title="Suggested for You"
    endpoint={`/products/suggested/${user._id}`} // Matches the route above
    token={accessToken}
    IMAGE_BASE_URL={IMAGE_BASE_URL}
    onClick={handleProductClick}
    icon={<ShoppingBag className="text-primary me-2" />}
  />
)}

        {/* 4️⃣ Trend PRODUCTS */}
<section className="mb-5">
  <SectionHeader 
    title="Trending Products" 
    icon={<TrendingUp className="text-danger me-2" />} 
    onSeeAll={() => navigate('/search')} 
  />
  <Row className="g-4 flex-nowrap overflow-auto no-scrollbar pb-3">
    {products
      .filter(p => p.clickCount > 0) // Only show items people actually clicked
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)) // Descending order
      .slice(0, 8) // Show top 8
      .map((p) => {
        const imgPath = p.images?.[0] || p.image || "";
        const displayImg = imgPath 
          ? `${IMAGE_BASE_URL.replace(/\/+$/, "")}/${imgPath.replace(/^\/+/, "")}` 
          : "https://via.placeholder.com/300";

        return (
          <Col key={p._id} xs={9} md={4} lg={3} xl={2}>
            <Card className="h-100 border-0 shadow-sm modern-card p-2 cursor-pointer position-relative" onClick={() => handleProductClick(p._id)}>
              {/* Click Count Badge */}
              <Badge 
                bg="danger" 
                className="position-absolute top-0 start-0 m-2 shadow-sm"
                style={{ zIndex: 2, fontSize: '0.7rem' }}
              >
                🔥 {p.clickCount || 0} Views
              </Badge>

              <div className="text-center p-2 mb-1 rounded-4" style={{ height: "140px", background: "#fbfbfb" }}>
                <Card.Img src={displayImg} className="h-100 w-100" style={{ objectFit: "contain" }} />
              </div>

              <Card.Body className="p-1 d-flex flex-column text-center">
                <div className="text-muted text-uppercase mb-1" style={{ fontSize: '9px', fontWeight: '800' }}>
                  {p.category?.name || "Popular"}
                </div>
                <Card.Title className="small fw-bold mb-1 text-dark line-clamp-2">
                  {p.product_name}
                </Card.Title>
                
                <StarRating rating={p.rating || 0} />

                <div className="mt-auto">
                  <div className="text-primary fw-bold">₹{p.price.toLocaleString('en-IN')}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
  </Row>
</section>

        {/* 5️⃣ PRODUCTS (MARKETPLACE GRID) */}
        <section className="mb-5">
          <SectionHeader title="Explore Marketplace" onSeeAll={() => navigate('/search')} />
          <ProductGrid items={products.slice(0, 12)} IMAGE_BASE_URL={IMAGE_BASE_URL} onClick={handleProductClick} />
        </section>
      </Container>

      {/* 🤖 FULL-SCREEN AI CHATBOT INTEGRATION */}
      {/* 🛡️ SECURITY: Only render chatbot if socket is NOT null */}
      {socket ? (
        <AdvancedChatbot 
          socket={socket} 
          userId={user?._id} 
          onSearchTrigger={handleAISearchTrigger} 
        />
      ) : (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
            <Spinner animation="border" variant="secondary" size="sm" />
        </div>
      )}

      <Footer />
    </div>
  );
};

// ==========================================
// ⭐ STAR RATING COMPONENT
// ==========================================
const StarRating = ({ rating = 0 }) => (
  <div className="d-flex align-items-center justify-content-center mb-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <span 
        key={star} 
        style={{ 
          color: star <= Math.round(rating) && rating > 0 ? "#ffc107" : "#e4e5e9", 
          fontSize: "0.85rem",
          marginRight: "1px"
        }}
      >
        ★
      </span>
    ))}
    <span className="ms-1 text-muted" style={{ fontSize: "0.7rem", fontWeight: "600" }}>
      {rating > 0 ? rating.toFixed(1) : "0.0"}
    </span>
  </div>
);

// ==========================================
// 🛠️ REUSABLE SECTIONS
// ==========================================

const AISuggestionRow = ({ title, endpoint, token, IMAGE_BASE_URL, onClick, icon }) => {
  const [items, setItems] = useState([]);
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`${API}${endpoint}`, config);
        setItems(res.data?.products || res.data || []);
      } catch (err) { console.error(err); }
    };
    fetch();
  }, [endpoint, token, API]);

  if (items.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionHeader title={title} onSeeAll={() => navigate('/search')} icon={icon} />
      <ProductGrid items={items.slice(0, 6)} IMAGE_BASE_URL={IMAGE_BASE_URL} onClick={onClick} />
    </section>
  );
};

const ProductGrid = ({ items, IMAGE_BASE_URL, onClick }) => (
  <Row className="g-4">
    {items.map((p) => {
      const imgPath = p.images?.[0] || p.image || "";
      const displayImg = imgPath 
        ? `${IMAGE_BASE_URL.replace(/\/+$/, "")}/${imgPath.replace(/^\/+/, "")}` 
        : "https://via.placeholder.com/300";

      return (
        <Col key={p._id} xs={6} md={4} lg={3} xl={2}>
          <Card className="h-100 border-0 shadow-sm modern-card p-2 cursor-pointer" onClick={() => onClick(p._id)}>
            <div className="text-center p-2 mb-1 rounded-4" style={{ height: "140px", background: "#fbfbfb" }}>
              <Card.Img src={displayImg} className="h-100 w-100" style={{ objectFit: "contain" }} />
            </div>

            <Card.Body className="p-1 d-flex flex-column text-center">
              <div className="text-muted text-uppercase mb-1" style={{ fontSize: '9px', fontWeight: '800' }}>
                {p.category?.name || "Marketplace"}
              </div>
              <Card.Title className="small fw-bold mb-1 text-dark line-clamp-2">
                {p.product_name}
              </Card.Title>
              
              <StarRating rating={p.rating || 0} />

              <div className="mt-auto">
                <div className="text-primary fw-bold">₹{p.price.toLocaleString('en-IN')}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      );
    })}
  </Row>
);

const SectionHeader = ({ title, onSeeAll, hideSeeAll, icon }) => (
  <div className="d-flex justify-content-between align-items-center mb-4">
    <div className="d-flex align-items-center">
      {icon} <h4 className="fw-bold m-0" style={{ fontSize: '1.25rem' }}>{title}</h4>
    </div>
    {!hideSeeAll && (
      <Button variant="link" onClick={onSeeAll} className="text-decoration-none fw-bold p-0 text-primary small">
        See All <ArrowRight size={14} className="ms-1" />
      </Button>
    )}
  </div>
);

export default Dashboard;