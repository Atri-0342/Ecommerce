import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { io } from "socket.io-client"; // 🔌 Import Socket.io client

// Redux Actions
import { setAccessToken, setUser } from "./store/authSlice";

// ✅ Admin Pages
import AdminRegister from "./pages/admin/AdminRegister";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import DealerManagement from "./pages/admin/DealerManagement";
import WarehouseManagement from "./pages/admin/WarehouseManagement";
import AdminManagement from "./pages/admin/AdminManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import FeedbackManagement from './pages/admin/FeedbackManagement';

// ✅ Core User Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import BookingPage from "./pages/BookingPage";
import PaymentPage from "./pages/PaymentPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import CategoryPage from "./pages/CategoryPage";
import Settings from "./pages/Settings";
import CustomerSupport from "./pages/CustomerSupport";

// ✅ Profile & Security
import UpdateProfile from "./pages/UpdateProfile";
import ChangePassword from "./pages/ChangePassword";
import SecuritySettings from "./pages/SecuritySettings";
import DeleteAccount from "./pages/DeleteAccount";

// ✅ Dealer (Merchant) Pages
import SellerLogin from "./pages/SellerLogin";
import SellerRegistration from "./pages/SellerRegistration";
import DealerForgotPassword from "./pages/DealerForgotPassword";
import DealerDashboard from "./pages/dealer/DealerDashboard";
import DealerProductManagement from "./pages/dealer/DealerProductManagement";
import DealerOrderManagement from "./pages/dealer/DealerOrderManagement";
import DealerFeedbackManagement from "./pages/dealer/DealerFeedbackManagement";
import DealerReviews from "./pages/dealer/DealerReviews";

// ✅ Delivery (Rider) Pages
import DeliveryRegistration from "./pages/delivery/DeliveryRegistration";
import DeliveryLogin from "./pages/delivery/DeliveryLogin";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";

// ✅ OTP & Recovery (User Side)
import VerifyRegisterOtp from "./pages/VerifyRegisterOtp";
import VerifyLoginOtp from "./pages/VerifyLoginOtp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SuccessVerifyOtp from "./pages/delivery/SuccessVerifyOtp";
import CancelVerifyOtp from "./pages/delivery/CancelVerifyOtp";

import Home from "./pages/Home";

function App() {
  const dispatch = useDispatch();
  const API = import.meta.env.VITE_API_URL;
  const SOCKET_URL = import.meta.env.VITE_API_URL_SOCKET || "http://localhost:5000";
  
  // 🔌 SOCKET STATE
  const [socket, setSocket] = useState(null);

  const { accessToken, adminToken, merchantToken, deliveryToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  // --- 🔌 1. SOCKET INITIALIZATION ---
  useEffect(() => {
    // Only connect if we have a user token and no existing socket
    if (accessToken && !socket) {
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });

      newSocket.on("connect", () => {
        console.log("🔌 Socket Connected to Server:", newSocket.id);
      });

      newSocket.on("connect_error", (err) => {
        console.error("🔌 Socket Connection Error:", err.message);
      });

      setSocket(newSocket);
    }

    // Cleanup: Disconnect socket on logout
    if (!accessToken && socket) {
      socket.disconnect();
      setSocket(null);
      console.log("🔌 Socket Disconnected");
    }

    return () => {
      if (socket) socket.off("connect");
    };
  }, [accessToken, socket, SOCKET_URL]);

  // --- 2. AXIOS GLOBAL INTERCEPTOR ---
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        if (config.url.includes("/delivery") && deliveryToken) {
          config.headers.Authorization = `Bearer ${deliveryToken}`;
        }
        else if ((config.url.includes("/dealers") || config.url.includes("/products/dealer") || config.url.includes("/orders/dealer-orders")) && merchantToken) {
          config.headers.Authorization = `Bearer ${merchantToken}`;
        } 
        else if (config.url.includes("/admins") && adminToken) {
          config.headers.Authorization = `Bearer ${adminToken}`;
        } 
        else if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    return () => axios.interceptors.request.eject(interceptor);
  }, [accessToken, adminToken, merchantToken, deliveryToken]);

  // --- 3. REFRESH SESSION ---
  useEffect(() => {
    const refreshApp = async () => {
      try {
        const localToken = localStorage.getItem("accessToken");
        if (localToken) {
          const res = await axios.post(`${API}/users/refresh`, {}, { withCredentials: true });
          if (res.data.accessToken) {
            dispatch(setAccessToken(res.data.accessToken));
            if (res.data.user) dispatch(setUser(res.data.user));
            localStorage.setItem("accessToken", res.data.accessToken);
          }
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
        }
      } finally {
        setLoading(false);
      }
    };
    refreshApp();
  }, [dispatch, API]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-grow text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🔓 PUBLIC AUTH ROUTES (User) */}
      <Route element={<PublicRoute accessToken={accessToken} />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-register" element={<VerifyRegisterOtp />} />
        <Route path="/verify-login" element={<VerifyLoginOtp />} />
      </Route>

      {/* 🔓 MERCHANT/SELLER PUBLIC ROUTES */}
      <Route element={<MerchantPublicRoute merchantToken={merchantToken} />}>
        <Route path="/seller-login" element={<SellerLogin />} />
        <Route path="/seller-registration" element={<SellerRegistration />} />
      </Route>
      <Route path="/dealer-forgot-password" element={<DealerForgotPassword />} />
      
      {/* 🔓 DELIVERY PUBLIC ROUTES */}
      <Route element={<DeliveryPublicRoute deliveryToken={deliveryToken} />}>
        <Route path="/delivery/login" element={<DeliveryLogin />} />
        <Route path="/delivery/register" element={<DeliveryRegistration />} />
      </Route>
      
      {/* 🔓 USER RECOVERY */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* 🛡️ ADMIN AUTH */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-register" element={<AdminRegister />} />

      {/* 🔍 SEARCH (Public) */}
      <Route path="/search" element={<Search />} />

      {/* 🔒 PROTECTED USER ROUTES */}
      <Route element={<ProtectedRoute accessToken={accessToken} />}>
        {/* ✅ Dashboard now receives the initialized socket instance */}
        <Route path="/" element={<Dashboard socket={socket} />} />
        <Route path="/dashboard" element={<Dashboard socket={socket} />} />
        
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile/update" element={<UpdateProfile />} />
        <Route path="/profile/security" element={<SecuritySettings />} />
        <Route path="/profile/security/changePassword" element={<ChangePassword />} />
        <Route path="/profile/security/deleteAccount" element={<DeleteAccount />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/product/:id" element={<BookingPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/support" element={<CustomerSupport />} />
      </Route>

      {/* 🔒 PROTECTED DEALER ROUTES */}
      <Route element={<MerchantProtectedRoute merchantToken={merchantToken} />}>
        <Route path="/dealer-dashboard" element={<DealerDashboard />} />
        <Route path="/dealer/products" element={<DealerProductManagement />} />
        <Route path="/dealer/orders" element={<DealerOrderManagement/>} />
        <Route path="/dealer/feedback" element={<DealerFeedbackManagement/>} />
        <Route path="/dealer/reviews" element={<DealerReviews/>} />
      </Route>

      {/* 🔒 PROTECTED DELIVERY ROUTES */}
      <Route element={<DeliveryProtectedRoute deliveryToken={deliveryToken} />}>
        <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
        <Route path="/delivery/verify-success/:id" element={<SuccessVerifyOtp />} />
        <Route path="/delivery/verify-cancel/:id" element={<CancelVerifyOtp />} />
      </Route>

      {/* 🔒 PROTECTED ADMIN ROUTES */}
      <Route element={<AdminProtectedRoute adminToken={adminToken} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-products" element={<ProductManagement />} />
        <Route path="/admin-orders" element={<OrderManagement />} />
        <Route path="/admin-dealers" element={<DealerManagement />} />
        <Route path="/admin-warehouses" element={<WarehouseManagement />} />
        <Route path="/admin-management" element={<AdminManagement />} />
        <Route path="/admin-categories" element={<CategoryManagement/>}/>
        <Route path="/admin-feedback" element={<FeedbackManagement />} />
      </Route>

      {/* ❌ 404 */}
      <Route path="*" element={<div className="p-5 text-center"><h3>404 Not Found</h3><p>The page you are looking for does not exist.</p></div>} />
    </Routes>
  );
}

// ================= ROUTE GUARDS =================

function PublicRoute({ accessToken }) {
  return accessToken ? <Navigate to="/" replace /> : <Outlet />;
}

function ProtectedRoute({ accessToken }) {
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminProtectedRoute({ adminToken }) {
  return adminToken ? <Outlet /> : <Navigate to="/admin-login" replace />;
}

function MerchantProtectedRoute({ merchantToken }) {
  return merchantToken ? <Outlet /> : <Navigate to="/seller-login" replace />;
}

function MerchantPublicRoute({ merchantToken }) {
  return merchantToken ? <Navigate to="/dealer-dashboard" replace /> : <Outlet />;
}

function DeliveryProtectedRoute({ deliveryToken }) {
  return deliveryToken ? <Outlet /> : <Navigate to="/delivery/login" replace />;
}

function DeliveryPublicRoute({ deliveryToken }) {
  return deliveryToken ? <Navigate to="/delivery/dashboard" replace /> : <Outlet />;
}

export default App;