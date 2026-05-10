# 🛒 YuKTI — AI-Powered Smart Commerce & Logistics Ecosystem

YuKTI is an advanced multi-tenant MERN stack platform that combines intelligent e-commerce with a powerful logistics and warehouse management system.

The platform delivers a seamless experience for Customers, Merchants, Delivery Personnel, and Admins through:

- AI-driven personalization
- Real-time delivery tracking
- Automated warehouse routing
- Secure communication
- Smart logistics management

---

# 🚀 Project Overview

YuKTI manages the complete product lifecycle:

1. Merchant lists products
2. Admin approves products
3. Smart warehouse assignment
4. AI-assisted shopping experience
5. Automated delivery assignment
6. Real-time delivery tracking
7. OTP-based secure delivery completion

The system bridges the gap between:

- Commerce
- AI
- Logistics

---

# ✨ Features

## 🤖 AI-Powered Commerce

- Groq AI Chatbot integration
- Personalized recommendations
- Smart product search
- AI-assisted customer support

---

## 📍 Real-Time Logistics

- Live delivery tracking
- Route optimization
- Real-time delivery updates
- Leaflet.js map integration

---

## 🏢 Smart Warehouse System

- Automatic nearest warehouse selection
- Geo-location based routing
- Optimized order dispatching

---

## 🔐 Security System

- JWT Authentication
- OTP Verification
- Encrypted Socket Chat
- Role-Based Access Control (RBAC)
- Secure payment handling

---

## 💳 Payment Integration

- Razorpay Payment Gateway
- Secure online transactions

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|-------------|
| Backend | Node.js, Express.js, Mongoose, Zod |
| Frontend | React 19, Redux Toolkit, Tailwind CSS, Bootstrap 5 |
| Database | MongoDB Atlas |
| Real-Time | Socket.io |
| Maps | Leaflet.js, Leaflet-Routing-Machine |
| AI Engine | Groq SDK (LLaMA-3 / Mixtral) |
| Authentication | JWT, OTP, Bcryptjs |
| Security | Crypto Encryption |
| Email Service | Nodemailer |
| Payments | Razorpay |

---

# 👥 User Roles

## 🛡️ Admin

### Responsibilities
- Approve merchants
- Manage warehouses
- View analytics
- Moderate feedback

### Permissions
- User management
- Warehouse management
- Analytics access
- Product moderation

---

## 🏪 Merchant / Dealer

### Responsibilities
- Add products
- Manage inventory
- Handle orders

### Permissions
- Product CRUD
- Order updates
- Warehouse requests

---

## 🚚 Delivery Person

### Responsibilities
- Deliver orders
- Navigate routes
- Verify delivery

### Permissions
- Accept/cancel deliveries
- Live map access
- OTP verification

---

## 👤 User / Customer

### Responsibilities
- Purchase products
- Track deliveries
- Interact with AI assistant

### Permissions
- Cart & checkout
- Live order tracking
- Product reviews
- AI chat access

---

# 🏗️ Backend Structure

```plaintext
backend/
├── config/             # Database & service configurations
├── controllers/        # Business logic
├── middlewares/        # Authentication & security
├── models/             # MongoDB schemas
├── routes/             # API routes
├── utils/              # Helper utilities
└── server.js           # Main server entry
```

---

# 🗺️ Logistics Workflow

## 1️⃣ Order Placement
- User places order
- Razorpay payment processed

## 2️⃣ Smart Routing
- System finds nearest warehouse

## 3️⃣ Delivery Assignment
- Nearby delivery person receives request

## 4️⃣ Live Tracking
- User tracks delivery in real-time

## 5️⃣ Secure Completion
- OTP verification confirms delivery

---

# 🔐 Authentication Flow

- User Registration
- Email OTP Verification
- JWT Token Generation
- Protected Routes
- RBAC Authorization

---

# ⚙️ Installation

## 1️⃣ Clone Repository

```bash
git clone https://github.com/Atri-0342/Ecommerce.git
```

---

## 2️⃣ Move Into Project Directory

```bash
cd Ecommerce
```

---

## 3️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 4️⃣ Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside `backend/`

```env
PORT=5000

URI=your_mongodb_uri

JWT_SECRET=your_secret_key

GROQ_API_KEY=your_groq_api_key

RAZORPAY_KEY_ID=your_razorpay_key

RAZORPAY_KEY_SECRET=your_razorpay_secret

EMAIL_USER=your_email

EMAIL_PASS=your_email_password

CHAT_ENCRYPTION_KEY=your_32_character_key
```

---

# ▶️ Run Project

## Backend

```bash
cd backend
npm start
```

## Frontend

```bash
cd frontend
npm run dev
```

---

# 📦 Major Modules

## 🧠 AI Recommendation Engine
- Smart recommendations
- AI product search
- Conversational AI

---

## 📦 Warehouse Management
- Inventory handling
- Warehouse routing
- Dispatch optimization

---

## 🚚 Delivery Management
- Real-time tracking
- Route optimization
- Delivery assignment

---

## 💬 Secure Chat
- Encrypted messaging
- User ↔ Delivery communication
- Socket.io integration

---

# 📈 Future Enhancements

- Mobile Application
- Invoice Generation
- AI Demand Forecasting
- Multi-language Support
- Advanced Analytics
- Drone Delivery Simulation

---

# 🧪 Testing

- API Testing with Postman
- Payment Gateway Testing
- Authentication Testing
- Socket.io Testing
- Logistics Flow Validation

---

# 📸 Screenshots

Add screenshots here:

```plaintext
frontend/public/screenshots/
```

---

# 🤝 Contributing

```bash
# Fork the repository

# Create feature branch
git checkout -b feature-name

# Commit changes
git commit -m "Added new feature"

# Push changes
git push origin feature-name
```

---

# 📄 License

This project is licensed.

---

# 👨‍💻 Developed By

## Team YuKTI

AI-Powered Smart Commerce & Logistics Ecosystem

---

# ⭐ Support

If you like this project, give it a ⭐ on GitHub.
