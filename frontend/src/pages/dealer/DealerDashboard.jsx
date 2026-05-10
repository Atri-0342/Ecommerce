import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Badge } from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "./Sidebar";
import { 
  Package, Receipt, CurrencyInr, 
  Plus, Headset, ArrowUpRight 
} from "@phosphor-icons/react";
import { 
  AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

const DealerDashboard = () => {
  const { merchantInfo, merchantToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [chartData, setChartData] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (merchantToken) {
      fetchDashboardData();
    }
  }, [merchantToken]);

  const fetchDashboardData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      
      const [prodRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/products/dealer/my-products`, config),
        axios.get(`${API_URL}/orders/dealer-orders`, config)
      ]);

      const orders = orderRes.data.orders || [];
      
      // 1. Calculate Summary Stats
      const activeOrders = orders.filter(o => o.status !== "Cancelled");
      const revenue = activeOrders.reduce((acc, curr) => acc + curr.total, 0);

      // 2. Process Real Data for Chart (Group by Date)
      const dailyData = processOrderData(activeOrders);

      setStats({
        totalProducts: prodRes.data.count || 0,
        totalOrders: orders.length,
        totalRevenue: revenue,
      });
      setChartData(dailyData);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to turn raw orders into graph points
  const processOrderData = (orders) => {
    if (orders.length === 0) {
      // Return a flat line if no data exists
      return [{ name: "No Data", sales: 0 }, { name: "Today", sales: 0 }];
    }

    const map = {};
    orders.forEach(order => {
      // Format date to "Mon DD" (e.g., "Oct 24")
      const date = new Date(order.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      map[date] = (map[date] || 0) + order.total;
    });

    // Convert map to array and sort by date
    return Object.keys(map).map(date => ({
      name: date,
      sales: map[date]
    })).sort((a, b) => new Date(a.name) - new Date(b.name));
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <Spinner animation="border" variant="primary" />
    </div>
  );

  return (
    <Sidebar>
      <Container fluid className="p-0">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Business Overview</h3>
            <p className="text-muted small mb-0">
              Live statistics for <span className="text-primary fw-bold">{merchantInfo?.brand}</span>
            </p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="white" className="border shadow-sm d-flex align-items-center gap-2 rounded-3">
              <Headset size={20} weight="bold" /> Support
            </Button>
            <Button variant="primary" className="shadow-sm d-flex align-items-center gap-2 rounded-3 px-4">
              <Plus size={20} weight="bold" /> New Product
            </Button>
          </div>
        </div>

        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small fw-bold mb-1">TOTAL REVENUE</p>
                    <h2 className="fw-bold mb-0">₹{stats.totalRevenue.toLocaleString()}</h2>
                  </div>
                  <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                    <CurrencyInr size={28} weight="bold" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small fw-bold mb-1">PRODUCTS</p>
                    <h2 className="fw-bold mb-0">{stats.totalProducts}</h2>
                  </div>
                  <div className="bg-success bg-opacity-10 text-success p-3 rounded-3">
                    <Package size={28} weight="bold" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="border-0 shadow-sm rounded-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small fw-bold mb-1">ORDERS</p>
                    <h2 className="fw-bold mb-0">{stats.totalOrders}</h2>
                  </div>
                  <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-3">
                    <Receipt size={28} weight="bold" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="border-0 shadow-sm rounded-4 p-4">
          <h5 className="fw-bold mb-4">Real Revenue Growth</h5>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0d6efd" 
                  strokeWidth={3}
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Container>
    </Sidebar>
  );
};

export default DealerDashboard;