import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  UserCircle, 
  ShieldCheck, 
  Storefront, 
  SignOut, 
  DeviceMobile,
  GearSix,
  ArrowRight
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";

// Project Imports
import Navigation from "../components/Navigation";
import { logout } from "../store/authSlice";

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);
  const API = import.meta.env.VITE_API_URL;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Edit Profile",
      desc: "Name, Phone, and Addresses",
      icon: <UserCircle size={32} weight="duotone" className="text-primary" />,
      path: "/profile/update",
    },
    {
      title: "Security Settings",
      desc: "Password & Login Activity",
      icon: <ShieldCheck size={32} weight="duotone" className="text-success" />,
      path: "/profile/security",
    },
    {
      title: "Become a Seller",
      desc: "Open your shop and sell products",
      icon: <Storefront size={32} weight="duotone" className="text-warning" />,
      path: "/seller-registration",
    }
  ];

  // --- 1. Logout Current Session ---
  const handleLogout = async () => {
    try {
      await axios.post(`${API}/users/logout`, {}, { withCredentials: true });
      dispatch(logout()); // Clears Redux State
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  };

  // --- 2. Logout All Devices ---
  const handleLogoutAll = async () => {
    const confirmAction = window.confirm(
      "Are you sure? This will sign you out of every device you are currently logged into."
    );
    
    if (confirmAction) {
      try {
        await axios.post(`${API}/users/logout-all`, {}, { withCredentials: true });
        dispatch(logout());
        toast.success("All sessions terminated");
        navigate("/login");
      } catch (err) {
        toast.error("Failed to terminate all sessions");
      }
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-5">
            
            {/* --- Section 1: Header Title --- */}
            <div className="text-center mb-4">
              <h6 className="text-uppercase fw-bold text-muted" style={{ letterSpacing: "2px" }}>
                <GearSix size={22} className="me-2 mb-1" />
                Settings
              </h6>
            </div>

            {/* --- Section 2: Welcome Highlight --- */}
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center mb-4">
              <div className="position-relative mx-auto mb-3" style={{ width: "90px", height: "90px" }}>
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt="Profile" 
                    className="rounded-circle w-100 h-100 shadow-sm border border-2 border-white object-fit-cover"
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = "https://via.placeholder.com/150"; // Fallback if link breaks
                    }}
                  />
                ) : (
                  <div 
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center w-100 h-100 shadow-sm border border-2 border-white"
                    style={{ fontSize: "2rem", fontWeight: "bold" }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Small Verified Badge */}
                <div className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white d-flex align-items-center justify-content-center shadow-sm" style={{ width: "25px", height: "25px" }}>
                   <ShieldCheck size={16} weight="fill" className="text-white" />
                </div>
              </div>
              <h3 className="fw-bold mb-1">
                Welcome, <span className="text-primary">{user?.name}</span>
              </h3>
              <p className="text-muted small mb-0">{user?.email}</p>
            </div>

            {/* --- Section 3: Feature Buttons (Column Wise) --- */}
            <div className="d-flex flex-column gap-3 mb-5">
              {menuItems.map((item, index) => (
                <div 
                  key={index} 
                  className="card border-0 shadow-sm rounded-4 p-3 hover-card"
                  onClick={() => navigate(item.path)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="bg-light p-3 rounded-circle me-3">
                      {item.icon}
                    </div>
                    <div className="flex-grow-1 text-start">
                      <h6 className="fw-bold mb-0">{item.title}</h6>
                      <small className="text-muted">{item.desc}</small>
                    </div>
                    <ArrowRight size={20} className="text-muted" />
                  </div>
                </div>
              ))}
            </div>

            {/* --- Section 4: Secure Logout Actions --- */}
            <div className="d-flex flex-column gap-3 align-items-center mt-2">
              <button 
                onClick={handleLogout}
                className="btn btn-white shadow-sm border-0 rounded-pill px-5 py-3 fw-bold text-danger w-100"
                style={{ backgroundColor: "white" }}
              >
                <SignOut size={20} weight="bold" className="me-2" />
                Logout Current Session
              </button>

              <button 
                onClick={handleLogoutAll}
                className="btn btn-outline-danger border-2 rounded-pill px-5 py-3 fw-bold w-100"
              >
                <DeviceMobile size={20} weight="bold" className="me-2" />
                Logout from All Devices
              </button>
              
              <p className="text-muted x-small mt-2 text-center" style={{ fontSize: "0.75rem" }}>
                Active Session ID: <span className="font-monospace">...{user?._id?.slice(-6)}</span>
              </p>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .hover-card { 
          transition: all 0.2s ease-in-out; 
          border: 1px solid transparent !important;
        }
        .hover-card:hover { 
          transform: scale(1.02);
          background-color: #ffffff;
          border-color: #6366f1 !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important;
        }
        .btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;