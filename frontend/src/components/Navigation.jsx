import React, { useState } from "react";
import { Navbar, Nav, Container, Button, Offcanvas, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { 
  User, 
  List, 
  House, 
  ShoppingCart, 
  Package, 
  Gear, 
  SignOut, 
  Bell, 
  Headset 
} from "@phosphor-icons/react";

const Navigation = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [search, setSearch] = useState("");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const goToSearch = () => {
    if (search.trim()) {
      navigate("/search", { state: { query: search } });
      setShowSidebar(false);
    }
  };

  const avatarBaseStyle = {
    background: "#f1f5f9", 
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    border: "2px solid #fff",
    aspectRatio: "1/1",
    borderRadius: "50%",
  };

  const navIconStyle = {
    cursor: "pointer",
    color: "#475569",
    transition: "transform 0.2s, color 0.2s"
  };

  return (
    <>
      <Navbar bg="white" expand="lg" className="shadow-sm py-2 sticky-top">
        <Container>
          <Navbar.Brand 
            role="button" 
            onClick={() => navigate("/")} 
            className="fw-bold fs-3 text-primary"
            style={{ letterSpacing: "-1px" }}
          >
            YuKTI
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-3">
            {/* Desktop Navigation Icons: Home -> Cart -> Order -> Notification -> Customer Care */}
            <Nav className="d-none d-lg-flex align-items-center gap-4">
              <House size={26} style={navIconStyle} onClick={() => navigate("/")} title="Home" />
              <ShoppingCart size={26} style={navIconStyle} onClick={() => navigate("/cart")} title="Cart" />
              <Package size={26} style={navIconStyle} onClick={() => navigate("/orders")} title="Orders" />
              <Bell size={26} style={navIconStyle} onClick={() => navigate("/notifications")} title="Notifications" />
              <Headset size={26} style={navIconStyle} onClick={() => navigate("/support")} title="Customer Care" />

              <Button variant="danger" className="rounded-pill px-4 fw-bold shadow-sm ms-2" style={{ fontSize: '0.85rem' }} onClick={handleLogout}>
                Logout
              </Button>
            </Nav>

            {/* Mobile Toggle */}
            <Button variant="light" className="border-0 d-lg-none fs-4" onClick={() => setShowSidebar(true)}>
              <List size={28} />
            </Button>
          </div>
        </Container>
      </Navbar>

      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="end" style={{ width: '320px' }}>
        <Offcanvas.Header closeButton className="py-2 border-bottom">
          <Offcanvas.Title className="fw-bold text-secondary" style={{ fontSize: '11px' }}>MENU</Offcanvas.Title>
        </Offcanvas.Header>
        
        <Offcanvas.Body className="p-0 d-flex flex-column">
          
          {/* 1. Profile Header Section (Non-clickable) */}
<div 
  className="d-flex align-items-center py-4 px-3" 
  style={{ 
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)", 
    borderBottom: "1px solid #f1f5f9" 
  }}
>
  {/* Icon on the Left */}
  <div style={{ ...avatarBaseStyle, width: "60px", height: "60px", flexShrink: 0 }}>
    <User size={30} weight="duotone" />
  </div>

  {/* Name and Email on the Right, stacked vertically */}
  <div className="ms-3 text-start overflow-hidden">
    <h6 className="fw-bold mb-0 text-dark text-truncate" style={{ fontSize: "1rem" }}>
      {user?.name || "User"}
    </h6>
    <p className="mb-0 text-muted small text-truncate">
      {user?.email}
    </p>
  </div>
</div>

          <div className="px-3 mt-3 flex-grow-1">
            {/* 2. Search */}
            <InputGroup className="bg-light rounded-pill overflow-hidden border-0 p-1 mb-4">
              <Form.Control
                placeholder="Search products..."
                className="border-0 bg-transparent shadow-none ps-3"
                style={{ fontSize: '0.85rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goToSearch()}
              />
              <Button variant="primary" className="rounded-pill border-0 py-1" onClick={goToSearch} style={{ backgroundColor: "#6366f1" }}>🔍</Button>
            </InputGroup>

            {/* 3. Navigation Menu Items */}
            <div className="d-grid gap-1">
              {[
                { name: "Home", icon: <House size={22} />, path: "/" },
                { name: "My Cart", icon: <ShoppingCart size={22} />, path: "/cart" },
                { name: "My Orders", icon: <Package size={22} />, path: "/orders" },
                { name: "Notifications", icon: <Bell size={22} />, path: "/notifications" },
                { name: "Customer Care", icon: <Headset size={22} />, path: "/support" }
              ].map((item, index) => (
                <Button key={index} variant="light" className="text-start py-2 border-0 bg-transparent fw-semibold d-flex align-items-center gap-3" 
                  style={{ fontSize: '0.95rem' }} onClick={() => { navigate(item.path); setShowSidebar(false); }}>
                  {item.icon} {item.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="px-3 pb-4 mt-auto">
            <hr className="my-4 opacity-10" />

            {/* 4. Logout Button */}
            <Button variant="danger" className="w-100 py-2 mb-4 fw-bold rounded-pill shadow-sm border-0 d-flex align-items-center justify-content-center gap-2" 
              style={{ background: "#ef4444", fontSize: '0.85rem' }} onClick={handleLogout}>
              <SignOut size={18} weight="bold" /> Logout Account
            </Button>

            {/* 5. Preferences / Settings Section */}
            <p className="text-uppercase fw-bold text-muted mb-2" style={{ fontSize: '10px', letterSpacing: "1px" }}>Preferences</p>
            <div 
              className="d-flex align-items-center gap-3 p-3 rounded-4 border mb-2 shadow-sm bg-white" 
              style={{ cursor: "pointer" }}
              onClick={() => { navigate("/settings"); setShowSidebar(false); }}
            >
              <div style={{ ...avatarBaseStyle, width: "40px", height: "40px", background: "#f8fafc", border: "none" }}>
                <Gear size={20} weight="bold" />
              </div>
              <div>
                <p className="mb-0 fw-bold text-dark" style={{ fontSize: "0.85rem" }}>System Settings</p>
                <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>Manage account & data</p>
              </div>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Navigation;