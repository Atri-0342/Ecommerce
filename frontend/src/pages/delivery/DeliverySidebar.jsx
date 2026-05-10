import React from "react";
import { Nav, Button, Badge } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  Truck, House, Package, 
  ClockCounterClockwise, SignOut, User,
  ChatCircleDots, MapPin
} from "@phosphor-icons/react";
import { logout } from "../../store/authSlice";

const DeliverySidebar = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { deliveryInfo } = useSelector((state) => state.auth);

  const menuItems = [
    { name: "Active Tasks", icon: <Truck size={22} />, path: "/delivery/dashboard" },
    { name: "My Profile", icon: <User size={22} />, path: "/delivery/profile" },
  ];

  return (
    <div className="d-flex">
      {/* SIDEBAR */}
      <div 
        className="bg-success text-white d-flex flex-column vh-100 shadow-lg" 
        style={{ width: "260px", position: "fixed", left: 0, top: 0, zIndex: 1050, backgroundColor: "#1b5e20 !important" }}
      >
        <div className="p-4 border-bottom border-white border-opacity-10">
          <div className="d-flex align-items-center gap-2 mb-4">
            <div className="bg-white p-2 rounded-3">
              <Truck size={24} className="text-success" weight="bold" />
            </div>
            <span className="fs-5 fw-bold tracking-tight">YuKTI Rider</span>
          </div>

          <div className="bg-white bg-opacity-10 rounded-3 p-3 border border-white border-opacity-10">
            <h6 className="mb-0 fw-bold text-truncate">{deliveryInfo?.name}</h6>
            <div className="d-flex align-items-center gap-1 mt-1">
               <MapPin size={14} />
               <small className="opacity-75">{deliveryInfo?.warehouse?.name || "Base Warehouse"}</small>
            </div>
          </div>
        </div>

        <Nav className="flex-column p-3 gap-2 flex-grow-1">
          {menuItems.map((item) => (
            <Nav.Link
              as={Link}
              to={item.path}
              key={item.name}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 transition-all ${
                location.pathname === item.path 
                  ? "bg-white text-success shadow-sm fw-bold" 
                  : "text-white opacity-75 hover-rider-link"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Nav.Link>
          ))}
        </Nav>

        <div className="p-3 border-top border-white border-opacity-10">
          <Button 
            variant="link" 
            className="w-100 d-flex align-items-center justify-content-center gap-2 text-white text-decoration-none py-2"
            onClick={() => dispatch(logout())}
          >
            <SignOut size={20} weight="bold" /> 
            <span className="fw-bold">Logout</span>
          </Button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow-1" style={{ marginLeft: "260px", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
        <main className="p-4">
          {children}
        </main>
      </div>

      <style>{`
        .hover-rider-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default DeliverySidebar;