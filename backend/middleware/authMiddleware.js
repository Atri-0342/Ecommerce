const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Dealer = require("../models/dealer");
const User = require("../models/users");
const DeliveryPerson = require("../models/DeliveryPerson");

/**
 * protect: Authenticates the token and identifies the account role.
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Extract Token
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.delivery_token) {
    token = req.cookies.delivery_token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
  }

  try {
    // 2. Verify Token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

    // 3. Targeted Identification Strategy
    let account = null;
    const roleFromToken = decoded.role; 

    if (roleFromToken === "admin") {
      account = await Admin.findById(decoded.id).select("-password");
    } else if (roleFromToken === "dealer") {
      account = await Dealer.findById(decoded.id).select("-password");
    } else if (roleFromToken === "delivery") {
      account = await DeliveryPerson.findById(decoded.id).select("-password");
    } else if (roleFromToken === "user") {
      account = await User.findById(decoded.id).select("-password");
    } else {
      const [a, d, del, u] = await Promise.all([
        Admin.findById(decoded.id).select("-password"),
        Dealer.findById(decoded.id).select("-password"),
        DeliveryPerson.findById(decoded.id).select("-password"),
        User.findById(decoded.id).select("-password")
      ]);
      account = a || d || del || u;
    }

    if (!account) {
      return res.status(401).json({ success: false, message: "Account not found" });
    }

    // 4. Determine Actual Role
    let finalRole = roleFromToken;
    if (!finalRole) {
       if (account.constructor.modelName === 'Admin') finalRole = "admin";
       else if (account.constructor.modelName === 'Dealer') finalRole = "dealer";
       else if (account.constructor.modelName === 'DeliveryPerson') finalRole = "delivery";
       else finalRole = "user";
    }

    // 5. Shared Validations
    if (finalRole === "dealer" && account.isApproved === false) {
      return res.status(403).json({ 
        success: false, 
        message: "Account pending approval. Please wait for admin verification." 
      });
    }

    if (account.isActive === false || account.status === "suspended") {
      return res.status(403).json({ success: false, message: "This account is restricted or suspended" });
    }

    // 6. Attach data to Request
    req.user = account;
    req.user.role = finalRole; 
    
    next();
  } catch (error) {
    console.error("JWT Auth Error:", error.message);
    const message = error.name === "TokenExpiredError" ? "Session expired" : "Authorization failed";
    return res.status(401).json({ success: false, message });
  }
};

// --- ROLE-BASED ACCESS CONTROL (RBAC) ---

const adminOnly = (req, res, next) => {
  const adminLevels = ["SuperAdmin", "Moderator", "Editor"];
  const isAuthorized = req.user && (req.user.role === "admin" || adminLevels.includes(req.user.access_level));
  if (isAuthorized) return next();
  res.status(403).json({ success: false, message: "Admin access required" });
};

const dealerOnly = (req, res, next) => {
  if (req.user && req.user.role === "dealer") return next();
  res.status(403).json({ success: false, message: "Dealer access required" });
};

// NEW: Hybrid access for both Admin and Dealer
const adminOrDealer = (req, res, next) => {
  const adminLevels = ["SuperAdmin", "Moderator", "Editor"];
  const isAdmin = req.user && (req.user.role === "admin" || adminLevels.includes(req.user.access_level));
  const isDealer = req.user && req.user.role === "dealer";

  if (isAdmin || isDealer) return next();
  res.status(403).json({ success: false, message: "Unauthorized. Admin or Dealer access required." });
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.access_level === "SuperAdmin") return next();
  res.status(403).json({ success: false, message: "Requires SuperAdmin privileges" });
};

const userOnly = (req, res, next) => {
  if (req.user && req.user.role === "user") return next();
  res.status(403).json({ success: false, message: "User access required" });
};

const deliveryOnly = (req, res, next) => {
  if (req.user && req.user.role === "delivery") return next();
  res.status(403).json({ success: false, message: "Delivery access required" });
};

module.exports = { 
  protect, 
  adminOnly, 
  dealerOnly, 
  adminOrDealer, // Exported
  userOnly, 
  deliveryOnly, 
  superAdminOnly 
};