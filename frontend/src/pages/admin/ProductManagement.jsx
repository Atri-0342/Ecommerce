import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Button, Badge, Spinner, Form, InputGroup, Modal, Row, Col } from "react-bootstrap";
import { Search, Edit3, Save, Mail, ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import Sidebar from "./Sidebar";

const ProductManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  // Ensure base URL for images doesn't have double slashes
  const IMAGE_BASE_URL = API.endsWith('/') ? API.slice(0, -1) : API;
  
  const { adminToken } = useSelector((state) => state.auth);
  const config = { headers: { Authorization: `Bearer ${adminToken}` } };

  const [prods, setProds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [showEdit, setShowEdit] = useState(false);

  // Form State
  const [curr, setCurr] = useState({ 
    product_name: "", price: "", discountPrice: "", stock: "", description: "", category: "" 
  });
  const [editFiles, setEditFiles] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Pass 'config' to both requests to avoid 401 Unauthorized
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/products`, config),
        axios.get(`${API}/categories`, config) 
      ]);
      setProds(prodRes.data.products || []);
      setCategories(catRes.data.categories || catRes.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if(adminToken) fetchData(); 
  }, [adminToken]);
const handleDelete = async (id) => {
  if (window.confirm("Are you sure you want to delete this product?")) {
    try {
      await axios.delete(`${API}/products/delete/${id}`, config);
      alert("Product deleted successfully!");
      fetchData(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  }
};
  const handleEditClick = (product) => {
    setCurr({ 
      ...product, 
      category: product.category?._id || product.category // Extract ID if populated
    });
    setEditFiles(null);
    setShowEdit(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    formData.append("product_name", curr.product_name);
    formData.append("price", curr.price);
    formData.append("discountPrice", curr.discountPrice);
    formData.append("stock", curr.stock);
    formData.append("description", curr.description);
    formData.append("category", curr.category);

    if (editFiles) {
      for (let i = 0; i < editFiles.length; i++) {
        formData.append("images", editFiles[i]);
      }
    }

    try {
      await axios.put(`${API}/products/update/${curr._id}`, formData, {
        headers: { ...config.headers, "Content-Type": "multipart/form-data" }
      });
      setShowEdit(false);
      fetchData();
      alert("Product updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const notifyDealer = async (dealerEmail, productName) => {
    try {
      await axios.post(`${API}/admins/notify-dealer`, { email: dealerEmail, product: productName }, config);
      alert(`Notification sent to dealer for ${productName}`);
    } catch (err) {
      alert("Notification failed to send.");
    }
  };

  const filteredProds = prods.filter(p =>
    p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dealerId?.brandName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.dealerId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sidebar>
      <div className="p-4">
        {/* --- HEADER SECTION --- */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">Product Management</h2>
            <p className="text-muted">Manage your inventory and digital storefront</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              className="d-flex align-items-center justify-content-center bg-white shadow-sm"
              onClick={fetchData}
              disabled={loading}
              style={{ width: '45px', height: '42px', borderRadius: '10px' }}
            >
              <RefreshCw size={20} className={loading ? "spin-icon" : ""} />
            </Button>
          </div>
        </div>

        {/* --- SEARCH BAR SECTION --- */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 border">
          <InputGroup className="bg-light rounded-3 px-2 border-0">
            <InputGroup.Text className="bg-transparent border-0 text-muted">
              <Search size={20} />
            </InputGroup.Text>
            <Form.Control 
              placeholder="Search by name, brand, or email..." 
              className="bg-transparent border-0 py-2 shadow-none" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </InputGroup>
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="bg-white rounded-4 shadow-sm p-4 border">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead>
                <tr className="text-muted small fw-bold" style={{ borderBottom: '2px solid #f8f9fa' }}>
                  <th className="border-0 pb-3">PRODUCT INFO</th>
                  <th className="border-0 pb-3">DEALER & CONTACT</th>
                  <th className="border-0 pb-3">CATEGORY</th>
                  <th className="border-0 pb-3">PRICE (INR)</th>
                  <th className="border-0 pb-3">STOCK STATUS</th>
                  <th className="border-0 pb-3 text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProds.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={`${IMAGE_BASE_URL}${p.images?.[0]}`} 
                          className="rounded border shadow-sm" 
                          style={{width: '50px', height: '50px', objectFit: 'cover'}} 
                          onError={(e) => { e.target.src = "https://via.placeholder.com/50"; }}
                        />
                        <div>
                          <div className="fw-bold text-dark">{p.product_name}</div>
                          <div className="text-muted small truncate-text" style={{maxWidth: '180px'}}>
                            {p.description?.substring(0, 35)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-primary">{p.dealerId?.brandName || "N/A"}</span>
                        <span className="text-muted small d-flex align-items-center gap-1">
                          <Mail size={12} /> {p.dealerId?.email || "No Email"}
                        </span>
                        <small className="text-dark">Owner: {p.dealerId?.ownerName || "N/A"}</small>
                      </div>
                    </td>
                    <td>
                      <Badge bg="light" className="text-dark border px-3 py-2 fw-normal">
                        {p.category?.name || "Uncategorized"}
                      </Badge>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">₹{p.price}</div>
                      {p.discountPrice > 0 && <small className="text-success fw-bold">Sale: ₹{p.discountPrice}</small>}
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <Badge 
                          bg={p.stock === 0 ? "danger" : p.stock < 10 ? "warning" : "success"} 
                          className="px-3 py-2 shadow-sm"
                          style={{ minWidth: '95px' }}
                        >
                          {p.stock === 0 ? "OUT OF STOCK" : `${p.stock} In Stock`}
                        </Badge>
                        
                        {p.stock === 0 && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="rounded-circle p-1"
                            title="Notify Dealer"
                            onClick={() => notifyDealer(p.dealerId?.email, p.product_name)}
                          >
                            <Mail size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="text-end">
  <div className="d-flex justify-content-end gap-2">
    {/* Edit Button */}
    <Button 
      variant="outline-primary" 
      size="sm" 
      className="rounded-3" 
      onClick={() => handleEditClick(p)}
    >
      <Edit3 size={16} />
    </Button>

    {/* Delete Button */}
    <Button 
      variant="outline-danger" 
      size="sm" 
      className="rounded-3" 
      onClick={() => handleDelete(p._id)}
    >
      <Trash2 size={16} />
    </Button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 shadow-sm">
          <Modal.Title className="fw-bold">Update Inventory Item</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateSubmit}>
          <Modal.Body className="p-4 bg-light bg-opacity-10">
            <Row className="g-3">
              <Col md={12}>
                <Form.Label className="small fw-bold">Product Name</Form.Label>
                <Form.Control 
                  value={curr.product_name} 
                  onChange={e => setCurr({...curr, product_name: e.target.value})} 
                  required 
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Price (₹)</Form.Label>
                <Form.Control 
                  type="number" 
                  value={curr.price} 
                  onChange={e => setCurr({...curr, price: e.target.value})} 
                  required 
                />
              </Col>
              <Col md={6}>
    <Form.Label className="small fw-bold text-success">Discounted Price (₹)</Form.Label>
    <Form.Control 
      type="number" 
      placeholder="Leave 0 if no discount"
      value={curr.discountPrice} 
      onChange={e => setCurr({...curr, discountPrice: e.target.value})} 
    />
    {curr.discountPrice > 0 && (
      <Form.Text className="text-success small">
        Savings: ₹{curr.price - curr.discountPrice}
      </Form.Text>
    )}
  </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Stock Inventory</Form.Label>
                <Form.Control 
                  type="number" 
                  value={curr.stock} 
                  onChange={e => setCurr({...curr, stock: e.target.value})} 
                  required 
                />
              </Col>
              <Col md={6}>
                <Form.Label className="small fw-bold">Category</Form.Label>
                <Form.Select 
                  value={curr.category} 
                  onChange={e => setCurr({...curr, category: e.target.value})} 
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-bold">Update Images</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white"><ImageIcon size={18}/></InputGroup.Text>
                  <Form.Control 
                    type="file" 
                    multiple 
                    onChange={e => setEditFiles(e.target.files)} 
                    accept="image/*"
                  />
                </InputGroup>
              </Col>
              <Col md={12}>
                <Form.Label className="small fw-bold">Product Description</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  value={curr.description} 
                  onChange={e => setCurr({...curr, description: e.target.value})} 
                />
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="border-0 p-4">
            <Button variant="light" className="px-4" onClick={() => setShowEdit(false)}>Discard</Button>
            <Button variant="primary" type="submit" className="px-5 shadow-sm fw-bold">
              <Save size={18} className="me-2"/> Save Changes
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .truncate-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .table > :not(caption) > * > * { padding: 1rem 0.5rem; }
      `}</style>
    </Sidebar>
  );
};

export default ProductManagement;