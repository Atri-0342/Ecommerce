import React from "react";
import { Nav, Button, Badge, Navbar, Dropdown, Container } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  Storefront, Package, Receipt, 
  ChartLineUp, SignOut, Gear, 
  ChatTeardropDots, Bell, UserCircle,
  MagnifyingGlass, User, CaretDown
} from "@phosphor-icons/react";
import { logout } from "../../store/authSlice";

const Sidebar = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { merchantInfo } = useSelector((state) => state.auth);

  const menuItems = [
  { name: "Overview", icon: <ChartLineUp size={22} />, path: "/dealer-dashboard" },
  { name: "Products", icon: <Package size={22} />, path: "/dealer/products" },
  { name: "Orders", icon: <Receipt size={22} />, path: "/dealer/orders"},
  { name: "Reviews", icon: <ChatTeardropDots size={22} />, path: "/dealer/reviews" }, // Added this
  { name: "Settings", icon: <Gear size={22} />, path: "/dealer/settings" },
  { name: "Feedback", icon: <Bell size={22} />, path: "/dealer/feedback" },
];
  return (
    <div className="d-flex">
      {/* ==========================================
          1. FIXED SIDEBAR
          ========================================== */}
      <div 
        className="bg-dark text-white d-flex flex-column vh-100 shadow-lg" 
        style={{ width: "280px", position: "fixed", left: 0, top: 0, zIndex: 1050 }}
      >
        <div className="p-4 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="bg-primary p-2 rounded-3 shadow-sm">
              <Storefront size={24} color="white" weight="bold" />
            </div>
            <span className="fs-5 fw-bold text-white tracking-tight">YuKTI Merchant</span>
          </div>

          {/* Sidebar Identity Card */}
          <div className="bg-secondary bg-opacity-10 rounded-3 p-3 border border-secondary border-opacity-25 shadow-sm">
            <p className="text-muted mb-1 text-uppercase fw-bold" style={{ fontSize: '10px' }}>Current Dealer</p>
            <h6 className="mb-0 fw-bold text-truncate text-white">{merchantInfo?.name || "Admin"}</h6>
            <small className="text-primary fw-medium">{merchantInfo?.brand || "Brand Store"}</small>
          </div>
        </div>

        {/* Navigation */}
        <Nav className="flex-column p-3 gap-2 flex-grow-1 overflow-auto">
          {menuItems.map((item) => (
            <Nav.Link
              as={Link}
              to={item.path}
              key={item.name}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${
                location.pathname === item.path 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-secondary hover-sidebar-link"
              }`}
            >
              {item.icon}
              <span className="fw-medium">{item.name}</span>
              {item.badge && (
                <Badge bg="danger" pill className="ms-auto" style={{ fontSize: '10px' }}>
                  {item.badge}
                </Badge>
              )}
            </Nav.Link>
          ))}
        </Nav>

        {/* Sidebar Footer Logout */}
        <div className="p-3 border-top border-secondary border-opacity-25">
          <Button 
            variant="outline-danger" 
            className="w-100 d-flex align-items-center justify-content-center gap-2 border-0 py-2 rounded-3"
            onClick={() => dispatch(logout())}
          >
            <SignOut size={20} weight="bold" /> 
            <span className="fw-bold">Logout</span>
          </Button>
        </div>
      </div>

      {/* ==========================================
          2. TOP NAV & CONTENT AREA
          ========================================== */}
      <div className="flex-grow-1" style={{ marginLeft: "280px", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        
        {/* --- TOP BAR (Defined here in Sidebar.jsx) --- */}
        <Navbar bg="white" className="border-bottom py-2 sticky-top px-4 shadow-sm" style={{ zIndex: 1000 }}>
          <Container fluid className="p-0 d-flex justify-content-between align-items-center">
            
            {/* Search */}
            <div className="d-flex align-items-center bg-light px-3 py-2 rounded-3 border">
              <MagnifyingGlass size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search orders, products..." 
                className="border-0 bg-transparent ps-2 small shadow-none" 
                style={{ outline: 'none', width: '300px' }} 
              />
            </div>

            {/* Profile & Notifications */}
            <div className="d-flex align-items-center gap-3">
              <Button variant="light" className="rounded-circle p-2 border position-relative">
                <Bell size={20} />
                <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-white rounded-circle"></span>
              </Button>

              <Dropdown align="end">
                <Dropdown.Toggle variant="white" className="border-0 p-0 d-flex align-items-center gap-2 shadow-none">
                  <div className="text-end d-none d-lg-block me-2">
                    <p className="mb-0 fw-bold small text-dark">{merchantInfo?.name}</p>
                    <p className="mb-0 text-muted" style={{ fontSize: '11px' }}>Store Admin</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-1 rounded-circle border border-primary border-opacity-25">
                    <UserCircle size={32} weight="duotone" className="text-primary" />
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow border-0 mt-3 rounded-3" style={{ minWidth: '200px' }}>
                  <Dropdown.Header className="fw-bold">{merchantInfo?.brand}</Dropdown.Header>
                  <Dropdown.Item className="py-2 d-flex align-items-center gap-2">
                    <User size={18} /> My Profile
                  </Dropdown.Item>
                  <Dropdown.Item className="py-2 d-flex align-items-center gap-2">
                    <Gear size={18} /> Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={() => dispatch(logout())} className="text-danger py-2 d-flex align-items-center gap-2">
                    <SignOut size={18} /> Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Container>
        </Navbar>

        {/* Content Rendered Here */}
        <main className="p-4">
          {children}
        </main>
      </div>

      <style>{`
        .hover-sidebar-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white !important;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;