import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    // --- USER AUTH ---
    accessToken: localStorage.getItem("accessToken") || null,
    user: JSON.parse(localStorage.getItem("user")) || null,

    // --- ADMIN AUTH ---
    adminToken: localStorage.getItem("adminToken") || null,
    adminInfo: JSON.parse(localStorage.getItem("adminInfo")) || null,

    // --- MERCHANT/DEALER AUTH ---
    merchantToken: localStorage.getItem("merchantToken") || null,
    merchantInfo: JSON.parse(localStorage.getItem("merchantInfo")) || null,

    // --- DELIVERY AUTH (New) ---
    deliveryToken: localStorage.getItem("deliveryToken") || null,
    deliveryInfo: JSON.parse(localStorage.getItem("deliveryInfo")) || null,
  },
  reducers: {
    // Regular User Success
    setAuthSuccess: (state, action) => {
      const { token, user } = action.payload;
      state.accessToken = token;
      state.user = user;
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    },

    // Admin Success
    setAdminSuccess: (state, action) => {
      const { token, admin } = action.payload;
      state.adminToken = token;
      state.adminInfo = admin;
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminInfo", JSON.stringify(admin));
    },

    // Merchant/Dealer Success
    setMerchantSuccess: (state, action) => {
      const { token, merchant } = action.payload;
      state.merchantToken = token;
      state.merchantInfo = merchant;
      localStorage.setItem("merchantToken", token);
      localStorage.setItem("merchantInfo", JSON.stringify(merchant));
    },

    // Delivery/Rider Success (New)
    setDeliverySuccess: (state, action) => {
      const { token, person } = action.payload;
      state.deliveryToken = token;
      state.deliveryInfo = person;
      localStorage.setItem("deliveryToken", token);
      localStorage.setItem("deliveryInfo", JSON.stringify(person));
    },

    // Utility reducers for specific updates
    setAccessToken: (state, action) => {
      state.accessToken = action.payload;
      localStorage.setItem("accessToken", action.payload);
    },
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    // Logout - Clears all states and storage
    logout: (state) => {
      state.accessToken = null;
      state.user = null;
      state.adminToken = null;
      state.adminInfo = null;
      state.merchantToken = null;
      state.merchantInfo = null;
      state.deliveryToken = null;
      state.deliveryInfo = null;

      localStorage.clear(); 
    },
  },
});

export const {
  setAuthSuccess,
  setAccessToken,
  setUser,
  setAdminSuccess,
  setMerchantSuccess,
  setDeliverySuccess, // Exported new reducer
  logout,
} = authSlice.actions;

export default authSlice.reducer;