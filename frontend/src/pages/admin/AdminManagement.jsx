import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Badge, Spinner, Form, InputGroup, Card, Modal, Row, Col } from "react-bootstrap";
import { Search, ShieldCheck, Trash2, UserPlus, Mail, RefreshCw, Edit3, ShieldAlert } from "lucide-react";
import Sidebar from "./Sidebar"; 
import { useSelector } from "react-redux";

const AdminManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  const { adminInfo } = useSelector((state) => state.auth);

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    access_level: "Moderator",
    phoneNumber: ""
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admins`);
      if (res.data.success) setAdmins(res.data.admins);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setIsEditing(true);
      setSelectedId(admin._id);
      setFormData({
        full_name: admin.full_name,
        email: admin.email,
        access_level: admin.access_level,
        phoneNumber: admin.phoneNumber || "",
        password: "" 
      });
    } else {
      setIsEditing(false);
      setFormData({ full_name: "", email: "", password: "", access_level: "Moderator", phoneNumber: "" });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (isEditing && !payload.password) delete payload.password;

      if (isEditing) {
        await axios.put(`${API}/admins/update/${selectedId}`, payload);
      } else {
        await axios.post(`${API}/admins/create`, payload);
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleToggleStatus = async (id) => {
    if (id === adminInfo?.id) return alert("You cannot suspend yourself!");
    try {
      const res = await axios.patch(`${API}/admins/toggle-status/${id}`);
      setAdmins(admins.map(a => a._id === id ? { ...a, isActive: res.data.isActive } : a));
    } catch (err) { alert("Permission denied."); }
  };

  const handleDelete = async (id) => {
    if (id === adminInfo?.id) return alert("You cannot delete yourself!");
    if (window.confirm("Permanent deletion: Are you sure?")) {
      try {
        await axios.delete(`${API}/admins/delete/${id}`);
        setAdmins(admins.filter(a => a._id !== id));
      } catch (err) { alert("Delete failed."); }
    }
  };

  const filteredAdmins = admins.filter(a => {
    const s = searchTerm.toLowerCase();
    return a.full_name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s) || a.access_level?.toLowerCase().includes(s);
  });

  return (
    <Sidebar>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Staff Management</h3>
            <p className="text-muted small">Manage all administrator roles and access</p>
          </div>
          <Button variant="primary" className="d-flex align-items-center gap-2 shadow-sm" onClick={() => handleOpenModal()}>
            <UserPlus size={18} /> Add Admin
          </Button>
        </div>

        <Card className="border-0 shadow-sm rounded-4 overflow-hidden">
          <Card.Header className="bg-white py-3 border-0">
            <div className="d-flex justify-content-between align-items-center">
              <InputGroup className="bg-light border rounded-3 w-50">
                <InputGroup.Text className="bg-transparent border-0 text-muted"><Search size={18} /></InputGroup.Text>
                <Form.Control placeholder="Search by name, email or role..." className="bg-transparent border-0 shadow-none" onChange={(e) => setSearchTerm(e.target.value)} />
              </InputGroup>
              <Button variant="light" onClick={fetchAdmins} className="text-primary border"><RefreshCw size={18} /></Button>
            </div>
          </Card.Header>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <Table hover responsive className="align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4 py-3 text-muted small text-uppercase">Admin Details</th>
                  <th className="text-muted small text-uppercase">Role</th>
                  <th className="text-muted small text-uppercase">Status</th>
                  <th className="text-end pe-4 text-muted small text-uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className={admin._id === adminInfo?.id ? "table-light" : ""}>
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-light p-2 rounded-circle border">
                          {admin.access_level === 'SuperAdmin' ? <ShieldAlert className="text-danger" size={20} /> : <ShieldCheck className="text-primary" size={20} />}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{admin.full_name} {admin._id === adminInfo?.id && <Badge bg="secondary" className="ms-1">You</Badge>}</div>
                          <div className="text-muted small"><Mail size={12} /> {admin.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge bg={admin.access_level === 'SuperAdmin' ? "danger" : "primary"} className="rounded-pill px-3">{admin.access_level}</Badge>
                    </td>
                    <td>
                      <Form.Check type="switch" checked={admin.isActive} onChange={() => handleToggleStatus(admin._id)} label={admin.isActive ? "Active" : "Suspended"} className={admin.isActive ? "text-success fw-medium" : "text-danger fw-medium"} />
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-1">
                        <Button variant="link" className="text-primary" onClick={() => handleOpenModal(admin)}><Edit3 size={18} /></Button>
                        <Button variant="link" className="text-danger" onClick={() => handleDelete(admin._id)}><Trash2 size={18} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton><Modal.Title className="fw-bold">{isEditing ? "Edit Admin" : "Add Admin"}</Modal.Title></Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6} className="mb-3"><Form.Label className="small fw-bold">Full Name</Form.Label><Form.Control required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} /></Col>
              <Col md={6} className="mb-3"><Form.Label className="small fw-bold">Email</Form.Label><Form.Control type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></Col>
              <Col md={6} className="mb-3"><Form.Label className="small fw-bold">Password {isEditing && "(Leave blank to keep)"}</Form.Label><Form.Control type="password" required={!isEditing} onChange={e => setFormData({...formData, password: e.target.value})} /></Col>
              <Col md={6} className="mb-3">
                <Form.Label className="small fw-bold">Access Level</Form.Label>
                <Form.Select value={formData.access_level} onChange={e => setFormData({...formData, access_level: e.target.value})}>
                  <option value="Editor">Editor</option><option value="Moderator">Moderator</option><option value="SuperAdmin">SuperAdmin</option>
                </Form.Select>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer><Button variant="light" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" type="submit">{isEditing ? "Update" : "Create"}</Button></Modal.Footer>
        </Form>
      </Modal>
    </Sidebar>
  );
};

export default AdminManagement;