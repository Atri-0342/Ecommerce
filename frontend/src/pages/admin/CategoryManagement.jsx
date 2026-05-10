import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { 
  Plus, Edit2, Trash2, RefreshCw, Search, 
  Upload, Calendar, X, ToggleLeft, ToggleRight 
} from "lucide-react";
import { toast } from "react-hot-toast";
import Sidebar from "./Sidebar";
import { 
  Table, Button, Spinner, Form, 
  InputGroup, Card, Modal, Row, Col 
} from "react-bootstrap";

const CategoryManagement = () => {
  const API = "http://localhost:5000";
  const { adminToken } = useSelector((state) => state.auth);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/categories`, { 
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true 
      });
      if (data.success) setCategories(data.categories);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [adminToken, API]);

  useEffect(() => {
    if (adminToken) fetchCategories();
  }, [fetchCategories, adminToken]);

  const handleToggleStatus = async (category) => {
    try {
      const newStatus = !category.isActive;
      await axios.put(`${API}/categories/update/${category._id}`, 
        { isActive: newStatus }, 
        { headers: { Authorization: `Bearer ${adminToken}` }, withCredentials: true }
      );
      toast.success(`${category.name} is now ${newStatus ? 'Active' : 'Inactive'}`);
      fetchCategories();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    data.append("name", formData.name);
    data.append("description", formData.description);
    data.append("isActive", formData.isActive);
    if (selectedFile) data.append("image", selectedFile);

    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${adminToken}` },
        withCredentials: true
      };
      if (editingId) {
        await axios.put(`${API}/categories/update/${editingId}`, data, config);
        toast.success("Updated!");
      } else {
        await axios.post(`${API}/categories/create`, data, config);
        toast.success("Created!");
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await axios.delete(`${API}/categories/delete/${id}`, { 
        headers: { Authorization: `Bearer ${adminToken}` },
        withCredentials: true 
      });
      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error("Delete operation failed");
    }
  };

  const handleEdit = (cat) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, description: cat.description, isActive: cat.isActive });
    setPreviewUrl(`${API}${cat.image}`); 
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", isActive: true });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingId(null);
    setShowModal(false);
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Sidebar>
      <div className="p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Category Hub</h3>
            <p className="text-muted small">Manage your store product hierarchy.</p>
          </div>
          <Button variant="primary" className="rounded-pill px-4 shadow-sm fw-bold" onClick={() => setShowModal(true)}>
            <Plus size={18} className="me-2"/> Add Category
          </Button>
        </div>

        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="p-3 bg-white border-bottom">
            <Row className="g-3">
              <Col md={4}>
                <InputGroup className="bg-light border-0 rounded-pill px-3">
                  <InputGroup.Text className="bg-transparent border-0 text-muted"><Search size={18}/></InputGroup.Text>
                  <Form.Control 
                    placeholder="Quick search..." 
                    className="bg-transparent border-0 shadow-none ps-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col className="text-end">
                <Button variant="white" className="border rounded-pill px-3 shadow-sm" onClick={fetchCategories}>
                  <RefreshCw size={16} className={loading ? "spin me-2" : "me-2"} /> Refresh
                </Button>
              </Col>
            </Row>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="bg-light text-muted small text-uppercase fw-bold">
                <tr>
                  <th className="ps-4">Preview</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th className="text-center">Actions</th> {/* Updated Header */}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat._id}>
                      <td className="ps-4">
                        <div className="rounded-3 border overflow-hidden" style={{ width: '48px', height: '48px' }}>
                          <img 
                            src={`${API}${cat.image}`} 
                            className="w-100 h-100 object-fit-cover"
                            alt={cat.name}
                            onError={(e) => (e.target.src = "https://placehold.co/100?text=None")}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{cat.name}</div>
                        <div className="text-muted extra-small">ID: {cat._id.slice(-6)}</div>
                      </td>
                      <td>
                        <div 
                          onClick={() => handleToggleStatus(cat)} 
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          {cat.isActive ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-muted" />}
                          <span className={`ms-2 extra-small fw-bold ${cat.isActive ? 'text-success' : 'text-muted'}`}>
                            {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-secondary small text-truncate" style={{ maxWidth: '180px' }}>
                          {cat.description || "No description provided"}
                        </div>
                      </td>
                      <td className="text-center">
                        {/* REPLACED 3-DOT WITH DIRECT BUTTONS */}
                        <div className="justify-content-center gap-2">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="rounded-circle p-2" 
                            style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleEdit(cat)}
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            className="rounded-circle p-2" 
                            style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDelete(cat._id)}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {/* Modal Logic Remains the Same */}
        <Modal show={showModal} onHide={resetForm} centered backdrop="static">
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold fs-5">{editingId ? "Update Category" : "New Category"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Name</Form.Label>
                <Form.Control required className="rounded-3" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Description</Form.Label>
                <Form.Control as="textarea" rows={2} className="rounded-3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </Form.Group>
              <Form.Group className="mb-3 d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                <span className="small fw-bold">Active Status</span>
                <Form.Check type="switch" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
              </Form.Group>
              <div className="p-3 bg-light rounded-4 border border-dashed text-center">
                {previewUrl && <img src={previewUrl} className="rounded mb-2 d-block mx-auto" width="80" height="80" style={{objectFit: 'cover'}} alt="Preview" />}
                <Form.Control type="file" size="sm" accept="image/*" onChange={handleFileChange} />
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0">
              <Button variant="light" className="rounded-pill px-4" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" type="submit" className="rounded-pill px-4 shadow fw-bold" disabled={submitting}>
                {submitting ? <Spinner size="sm"/> : "Save"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        <style>{`
          .spin { animation: rotate 1s linear infinite; }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .extra-small { font-size: 0.7rem; }
          .border-dashed { border-style: dashed !important; }
          .table hover tbody tr:hover { background-color: #f1f4f9; }
        `}</style>
      </div>
    </Sidebar>
  );
};

export default CategoryManagement;