import React, { useState, useEffect } from "react";
import { 
  Container, Table, Button, Modal, Form, 
  Row, Col, Badge, Card, Spinner, InputGroup 
} from "react-bootstrap";
import { useSelector } from "react-redux";
import axios from "axios";
import Sidebar from "./Sidebar";
import { 
  Plus, PencilSimple, Trash, Eye,
  Image as ImageIcon, CloudArrowUp, 
  CheckCircle, MagnifyingGlass, ArrowsClockwise 
} from "@phosphor-icons/react";

const DealerProductManagement = () => {
  const { merchantToken } = useSelector((state) => state.auth);
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Visibility States
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Preview Management States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mainPreviewImage, setMainPreviewImage] = useState(""); 

  // Form & Search States
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    images: []
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchMyProducts();
    fetchCategories();
  }, []);

  // --- API CALLS ---

  const fetchCategories = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      const res = await axios.get(`${API_URL}/categories`, config);
      setCategories(res.data.categories || res.data);
    } catch (err) { console.error("Error fetching categories:", err); }
  };

  const fetchMyProducts = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      const res = await axios.get(`${API_URL}/products/dealer/my-products`, config);
      setProducts(res.data.products || []);
    } catch (err) { console.error("Fetch Error:", err); } 
    finally { setLoading(false); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${merchantToken}` } };
      await axios.delete(`${API_URL}/products/delete/${id}`, config);
      fetchMyProducts();
    } catch (err) { console.error(err); }
  };

  // --- HANDLERS ---

  const handleOpenPreview = (prod) => {
    setSelectedProduct(prod);
    // Set the first image as default view
    setMainPreviewImage(prod.images?.[0] ? `${API_URL}${prod.images[0]}` : "");
    setShowPreview(true);
  };

  const handleEdit = (prod) => {
    setEditId(prod._id);
    setFormData({
      product_name: prod.product_name,
      description: prod.description,
      price: prod.price,
      category: prod.category?._id || "",
      stock: prod.stock,
      images: [] 
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormData({ product_name: "", description: "", price: "", category: "", stock: "", images: [] });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, images: e.target.files });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    data.append("product_name", formData.product_name);
    data.append("description", formData.description);
    data.append("price", formData.price);
    data.append("category", formData.category);
    data.append("stock", formData.stock);
    Array.from(formData.images).forEach((file) => data.append("images", file));

    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${merchantToken}`,
          "Content-Type": "multipart/form-data" 
        } 
      };

      if (editId) {
        await axios.put(`${API_URL}/products/update/${editId}`, data, config);
      } else {
        await axios.post(`${API_URL}/products/create`, data, config);
      }

      handleCloseModal();
      fetchMyProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving product");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar>
      <Container fluid className="py-4">
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold mb-1">Product Management</h3>
            <p className="text-muted small mb-0">Manage your inventory and digital storefront</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={fetchMyProducts} className="px-3">
              <ArrowsClockwise size={20} className={loading ? "spin-animation" : ""} />
            </Button>
            <Button onClick={() => setShowModal(true)} className="d-flex align-items-center gap-2 px-4 rounded-3 shadow-sm">
              <Plus size={20} weight="bold" /> Add Product
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="border-0 shadow-sm mb-4 rounded-4">
          <Card.Body className="p-3">
            <InputGroup className="bg-light rounded-3 overflow-hidden border-0">
              <InputGroup.Text className="bg-light border-0 ps-3">
                <MagnifyingGlass size={20} className="text-muted" />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by name or category..."
                className="bg-light border-0 py-2 shadow-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </Card.Body>
        </Card>

        {/* Products Table */}
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4 py-3 border-0 text-muted small text-uppercase">Image</th>
                <th className="py-3 border-0 text-muted small text-uppercase">Product</th>
                <th className="py-3 border-0 text-muted small text-uppercase">Category</th>
                <th className="py-3 border-0 text-muted small text-uppercase">Price</th>
                <th className="py-3 border-0 text-muted small text-uppercase text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-5 text-muted">No products found.</td></tr>
              ) : (
                filteredProducts.map((prod) => (
                  <tr key={prod._id}>
                    <td className="ps-4 py-3">
                      <div className="bg-light rounded-3 overflow-hidden d-flex align-items-center justify-content-center border" style={{ width: 50, height: 50 }}>
                        {prod.images?.[0] ? (
                          <img src={`${API_URL}${prod.images[0]}`} alt="" className="w-100 h-100 object-fit-cover" />
                        ) : (
                          <ImageIcon size={20} className="text-muted" />
                        )}
                      </div>
                    </td>
                    <td>
                      <p className="mb-0 fw-bold text-dark">{prod.product_name}</p>
                      <small className="text-muted">Stock: {prod.stock} units</small>
                    </td>
                    <td><Badge bg="info" className="bg-opacity-10 text-info px-3 py-2 rounded-pill">{prod.category?.name || "Uncategorized"}</Badge></td>
                    <td className="fw-bold text-dark">₹{prod.price}</td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" size="sm" onClick={() => handleOpenPreview(prod)} className="p-2 border-0 rounded-3" title="Preview"><Eye size={18} className="text-success" /></Button>
                        <Button variant="light" size="sm" onClick={() => handleEdit(prod)} className="p-2 border-0 rounded-3" title="Edit"><PencilSimple size={18} className="text-primary" /></Button>
                        <Button variant="light" size="sm" onClick={() => deleteProduct(prod._id)} className="p-2 border-0 rounded-3" title="Delete"><Trash size={18} className="text-danger" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>

        {/* --- DYNAMIC PREVIEW MODAL --- */}
        <Modal show={showPreview} onHide={() => setShowPreview(false)} centered size="lg">
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">Quick View</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4 pt-0">
            {selectedProduct && (
              <Row className="g-4">
                <Col md={5}>
                  {/* Active Large Image */}
                  <div className="bg-white border rounded-4 overflow-hidden mb-3 shadow-sm d-flex align-items-center justify-content-center" style={{ height: '320px' }}>
                    <img 
                      src={mainPreviewImage || "https://via.placeholder.com/300"} 
                      className="w-100 h-100 object-fit-contain" 
                      alt="Large Preview"
                    />
                  </div>
                  
                  {/* Clickable Gallery Thumbnails */}
                  <div className="d-flex gap-2 overflow-auto pb-2 scrollbar-hide">
                    {selectedProduct.images?.map((img, idx) => (
                      <img 
                        key={idx} 
                        src={`${API_URL}${img}`} 
                        className={`rounded-3 border cursor-pointer ${mainPreviewImage === `${API_URL}${img}` ? 'border-primary border-2 shadow-sm' : 'opacity-75'}`}
                        style={{ width: 65, height: 65, objectFit: 'cover' }} 
                        onClick={() => setMainPreviewImage(`${API_URL}${img}`)}
                        alt={`thumb-${idx}`}
                      />
                    ))}
                  </div>
                </Col>
                <Col md={7}>
                  <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill bg-opacity-10 text-primary">
                    {selectedProduct.category?.name}
                  </Badge>
                  <h2 className="fw-bold text-dark mb-1">{selectedProduct.product_name}</h2>
                  <h3 className="text-success fw-bold mb-4">₹{selectedProduct.price}</h3>
                  
                  <div className="p-3 bg-light rounded-4 mb-4">
                    <p className="text-muted fw-bold small mb-2 text-uppercase ls-1">Description</p>
                    <p className="text-dark mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {selectedProduct.description || "No description provided for this product."}
                    </p>
                  </div>

                  <Row className="text-center g-3">
                    <Col xs={6}>
                      <div className="border rounded-4 p-3 bg-white shadow-sm">
                        <small className="text-muted d-block mb-1">Availability</small>
                        <Badge bg={selectedProduct.stock > 0 ? "success" : "danger"} className="px-3 py-1 rounded-pill">
                          {selectedProduct.stock > 0 ? `${selectedProduct.stock} In Stock` : "Out of Stock"}
                        </Badge>
                      </div>
                    </Col>
                    <Col xs={6}>
                       <div className="border rounded-4 p-3 bg-white shadow-sm">
                        <small className="text-muted d-block mb-1">Product ID</small>
                        <span className="fw-bold text-dark small">#{selectedProduct._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            )}
          </Modal.Body>
        </Modal>

        {/* --- CREATE / EDIT MODAL --- */}
        <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
          <Modal.Header closeButton className="border-0 px-4 pt-4">
            <Modal.Title className="fw-bold">
              {editId ? "Update Product" : "Create New Product"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="px-4 pb-4">
            <Form onSubmit={handleSubmit}>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Product Name</Form.Label>
                    <Form.Control required type="text" value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} className="py-2 border-light bg-light shadow-none" placeholder="e.g. Wireless Headphones" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Price (₹)</Form.Label>
                    <Form.Control required type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="py-2 border-light bg-light shadow-none" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Stock Quantity</Form.Label>
                    <Form.Control required type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="py-2 border-light bg-light shadow-none" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Category</Form.Label>
                    <Form.Select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="py-2 border-light bg-light shadow-none">
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Description</Form.Label>
                    <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="border-light bg-light shadow-none" placeholder="Describe the key features..." />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted">Product Images</Form.Label>
                    <div className="border-2 border-dashed border-light rounded-4 p-4 text-center bg-light position-relative hover-upload">
                      <CloudArrowUp size={32} className="text-primary mb-2" />
                      <p className="small text-muted mb-0">Drag and drop or click to upload</p>
                      <Form.Control type="file" multiple accept="image/*" onChange={handleFileChange} className="position-absolute top-0 start-0 opacity-0 h-100 w-100" style={{ cursor: 'pointer' }} />
                    </div>
                    {formData.images.length > 0 && (
                      <div className="mt-2 text-primary small d-flex align-items-center gap-1">
                        <CheckCircle size={14} weight="fill" /> {formData.images.length} images selected
                      </div>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex gap-2 mt-4">
                <Button variant="light" className="w-100 py-2 fw-bold text-muted" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={submitting}>
                  {submitting ? <Spinner size="sm" /> : editId ? "Update Product" : "Save Product"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>

      {/* Internal Styles */}
      <style>{`
        .spin-animation { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .cursor-pointer { cursor: pointer; transition: all 0.2s ease; }
        .cursor-pointer:hover { transform: translateY(-2px); opacity: 1 !important; }
        .ls-1 { letter-spacing: 0.5px; }
        .hover-upload { transition: background 0.3s ease; }
        .hover-upload:hover { background: #f1f3f5 !important; border-color: #dee2e6 !important; }
      `}</style>
    </Sidebar>
  );
};

export default DealerProductManagement;