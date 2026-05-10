import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { 
  LayoutDashboard, ShoppingBag, Truck, Users, 
  Store, LogOut, Search, Bell, ShieldCheck,
  PlusCircle, MessageSquare, Layers // Added Layers for Categories
} from "lucide-react";
import { logout } from "../../store/authSlice";

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { adminInfo } = useSelector((state) => state.auth);

  // --- MENU CONFIGURATION ---
  const menuItems = [
    { 
      path: "/admin-dashboard", 
      label: "Dashboard", 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      path: "/admin-categories", 
      label: "Categories", 
      icon: <Layers size={20} /> 
    },
    { 
      path: "/admin-products", 
      label: "Inventory", 
      icon: <ShoppingBag size={20} /> 
    },
    { 
      path: "/admin-orders", 
      label: "Orders", 
      icon: <Truck size={20} /> 
    },
    { 
      path: "/admin-warehouses", 
      label: "Warehouses", 
      icon: <Store size={20} /> 
    },
    { 
      path: "/admin-dealers", 
      label: "Dealers", 
      icon: <Users size={20} /> 
    },
    { 
      path: "/admin-feedback", 
      label: "Feedback", 
      icon: <MessageSquare size={20} /> 
    },
    { 
      path: "/admin-management", 
      label: "Staff Management", 
      icon: <ShieldCheck size={20} /> 
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/admin-login");
    }
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className="d-flex flex-column text-white shadow-lg sticky-top"
        style={{ width: '280px', backgroundColor: '#0f172a', height: '100vh', flexShrink: 0 }}
      >
        {/* Logo Section */}
        <div className="p-4 mb-3 border-bottom border-secondary border-opacity-25">
          <h4 className="fw-bold mb-0 text-white d-flex align-items-center gap-2">
            <div className="bg-primary rounded-3 p-1 d-flex align-items-center justify-content-center">
              <ShoppingBag size={24} color="white" />
            </div>
            YuKTI
          </h4>
          <small className="text-secondary fw-bold ms-5" style={{ fontSize: '10px', letterSpacing: '1px' }}>
            ADMIN PANEL
          </small>
        </div>

        {/* Navigation Menu */}
        <div className="flex-grow-1 px-3 overflow-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                d-flex align-items-center gap-3 px-3 py-3 mb-2 rounded-3 text-decoration-none transition-all
                ${isActive ? 'bg-primary text-white shadow-primary' : 'text-secondary hover-bg-dark'}
              `}
            >
              {item.icon}
              <span className="fw-bold">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Logout Section */}
        <div className="p-4 mt-auto border-top border-secondary border-opacity-25">
          <div 
            className="d-flex align-items-center gap-3 text-danger-emphasis hover-danger transition-all"
            style={{ cursor: 'pointer' }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className="fw-bold">Logout</span>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-grow-1 d-flex flex-column overflow-hidden">

        {/* TOPBAR */}
        <header className="bg-white px-4 py-3 d-flex justify-content-between align-items-center shadow-sm z-3">
          
          {/* Search Bar */}
          <div className="position-relative w-25 d-none d-md-block">
            <Search className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={18} />
            <input
              type="text"
              className="form-control ps-5 border-0 bg-light rounded-pill py-2"
              placeholder="Search data..."
            />
          </div>

          {/* Right Side Actions */}
          <div className="d-flex align-items-center gap-4 ms-auto">
            {/* Notifications */}
            <div className="position-relative text-muted" style={{ cursor: 'pointer' }}>
              <Bell size={22} />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white" style={{ fontSize: '10px' }}>
                3
              </span>
            </div>

            {/* Admin Profile */}
            <div className="d-flex align-items-center gap-2 ps-3 border-start">
              <div className="text-end d-none d-sm-block">
                <div className="fw-bold text-dark small leading-tight">
                  {adminInfo?.name || "Admin User"}
                </div>
                <div className="text-primary fw-bold" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                  {adminInfo?.role || "Staff"}
                </div>
              </div>

              <img
                src={`https://ui-avatars.com/api/?name=${adminInfo?.name || 'Admin'}&background=0D6EFD&color=fff&bold=true`}
                className="rounded-circle border border-2 border-primary border-opacity-10"
                width="40"
                height="40"
                alt="admin profile"
              />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT WRAPPER */}
        <section className="p-4 overflow-auto bg-light" style={{ height: 'calc(100vh - 70px)' }}>
          <div className="container-fluid p-0">
            {children}
          </div>
        </section>
      </main>

      {/* --- GLOBAL SIDEBAR STYLES --- */}
      <style>{`
        .hover-bg-dark:hover {
          background-color: #1e293b;
          color: white !important;
        }
        .hover-danger:hover {
          color: #ef4444 !important;
          transform: translateX(5px);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .shadow-primary {
          box-shadow: 0 4px 14px 0 rgba(13, 110, 253, 0.39);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .leading-tight {
          line-height: 1.2;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;