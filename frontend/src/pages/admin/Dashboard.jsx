import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux"; // Import the hook
import { Row, Col, Card, Spinner, Button } from "react-bootstrap";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, ShoppingBag, Truck, Users, 
  RefreshCw, TrendingUp, AlertCircle, Store 
} from "lucide-react";
import Sidebar from "./Sidebar";

const Dashboard = () => {
  const API = import.meta.env.VITE_API_URL;

  // 1. Get the admin token from the Redux 'auth' slice
  const adminToken = useSelector((state) => state.auth.adminToken);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalRevenue: 0,
    orderCount: 0,
    productCount: 0,
    userCount: 0,
    pendingDealers: 0,
    warehouseCount: 0,
    revenueTrend: []
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 2. Define the config with the Authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      };

      // 3. Pass 'config' to all protected routes
      // Note: If /products is public, config is optional but won't hurt.
      const [orderRes, prodRes, dealerRes, userRes, whRes] = await Promise.all([
        axios.get(`${API}/orders/all`, config),
        axios.get(`${API}/products`, config),
        axios.get(`${API}/dealers/all`, config),
        axios.get(`${API}/users`, config),
        axios.get(`${API}/warehouses/all`, config) 
      ]);

      const allOrders = orderRes.data.orders || [];
      const allProducts = prodRes.data.products || [];
      const allDealers = dealerRes.data.dealers || [];
      const allUsers = userRes.data.users || [];
      const allWarehouses = whRes.data.warehouses || [];

      // REVENUE LOGIC
      const confirmedRevenue = allOrders.reduce((sum, order) => {
        if (order.payment === "paid" || order.status === "Delivered") {
          return sum + (order.total || 0);
        }
        return sum;
      }, 0);

      // FILTER PENDING DEALERS
      const pending = allDealers.filter(d => !d.isApproved).length;

      // CHART LOGIC
      const revenueTrend = allOrders
        .filter(order => order.payment === "paid" || order.status === "Delivered")
        .slice(-10)
        .map(order => ({
          date: new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: order.total
        }));

      setData({
        totalRevenue: confirmedRevenue,
        orderCount: allOrders.length,
        productCount: allProducts.length,
        userCount: allUsers.length,
        pendingDealers: pending,
        warehouseCount: allWarehouses.length,
        revenueTrend: revenueTrend
      });

    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data if we actually have a token
    if (adminToken) {
      fetchDashboardData();
    }
  }, [adminToken]); // Re-run if token changes

  // Card Configuration
  const stats = [
    { title: "Confirmed Revenue", value: `₹${data.totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: "text-primary", bg: "bg-primary" },
    { title: "Total Orders", value: data.orderCount, icon: <Truck />, color: "text-success", bg: "bg-success" },
    { title: "Inventory", value: data.productCount, icon: <ShoppingBag />, color: "text-warning", bg: "bg-warning" },
    { title: "Warehouses", value: data.warehouseCount, icon: <Store />, color: "text-info", bg: "bg-info" },
    { title: "Total Users", value: data.userCount, icon: <Users />, color: "text-secondary", bg: "bg-secondary" },
    { title: "Pending Dealers", value: data.pendingDealers, icon: <AlertCircle />, color: "text-danger", bg: "bg-danger" },
  ];

  if (loading) return (
    <Sidebar>
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 text-muted fw-bold">Syncing Analytical Data...</p>
      </div>
    </Sidebar>
  );

  return (
    <Sidebar>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-0">Management Dashboard</h3>
          <p className="text-muted small">Monitoring orders, staff, and revenue stream</p>
        </div>
        <Button variant="white" className="border shadow-sm rounded-3 px-3" onClick={fetchDashboardData}>
          <RefreshCw size={16} className="me-2" /> Refresh Data
        </Button>
      </div>

      {/* Analytics KPI Grid */}
      <Row className="mb-4">
        {stats.map((s, i) => (
          <Col key={i} xl={2} lg={4} md={6} className="mb-3">
            <Card className="border-0 shadow-sm rounded-4 h-100">
              <Card.Body className="p-3">
                <div className={`${s.bg} bg-opacity-10 p-2 rounded-3 d-inline-block mb-2 ${s.color}`}>
                  {React.cloneElement(s.icon, { size: 18 })}
                </div>
                <div className="text-muted small fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                  {s.title}
                </div>
                <h4 className="fw-bold mb-0 text-dark">{s.value}</h4>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Revenue Area Chart */}
      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm rounded-4 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                  <TrendingUp size={20} className="text-primary"/> Revenue Growth
                </h5>
                <small className="text-muted">Tracking paid and delivered orders</small>
              </div>
            </div>
            
            <div style={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <AreaChart data={data.revenueTrend}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#64748b'}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#64748b'}}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0d6efd" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </Sidebar>
  );
};

export default Dashboard;