import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Badge, Modal, Form, Spinner, InputGroup } from "react-bootstrap";
import { 
  Search, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Package, 
  Map as MapIcon,
  X
} from "lucide-react";
import Sidebar from "./Sidebar";

const WarehouseManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showInvModal, setShowInvModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  
  // Search & Edit
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: "", fullAddress: "", city: "", state: "", 
    country: "India", pincode: "", longitude: "", latitude: ""
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/warehouses/all`);
      setWarehouses(res.data.warehouses || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWarehouses(); }, []);

  // --- INVENTORY LOGIC ---
  const handleOpenInventory = (w) => {
    setSelectedWarehouse(w);
    setShowInvModal(true);
  };

  const handleRemoveSKU = async (productId) => {
    if (!window.confirm("Remove this SKU from the hub?")) return;
    try {
      const res = await axios.delete(`${API}/warehouses/${selectedWarehouse._id}/inventory/${productId}`);
      if (res.data.success) {
        const updatedInv = selectedWarehouse.inventory.filter(i => i.product._id !== productId);
        setSelectedWarehouse({ ...selectedWarehouse, inventory: updatedInv });
        fetchWarehouses();
      }
    } catch (err) {
      alert("Failed to remove SKU.");
    }
  };

  // --- FILTER LOGIC ---
  const filteredWarehouses = warehouses.filter((w) => {
    const search = searchTerm.toLowerCase();
    return (
      w.name?.toLowerCase().includes(search) ||
      w.address?.city?.toLowerCase().includes(search) ||
      w.address?.fullAddress?.toLowerCase().includes(search)
    );
  });

  // --- CRUD ACTIONS ---
  const handleEdit = (w) => {
    setEditMode(true);
    setCurrentId(w._id);
    setFormData({
      name: w.name,
      fullAddress: w.address?.fullAddress || "",
      city: w.address?.city || "",
      state: w.address?.state || "",
      pincode: w.address?.pincode || "",
      country: w.address?.country || "India",
      longitude: w.location?.coordinates[0] || "",
      latitude: w.location?.coordinates[1] || ""
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditMode(false);
    setCurrentId(null);
    setFormData({ name: "", fullAddress: "", city: "", state: "", country: "India", pincode: "", longitude: "", latitude: "" });
  };

  const handleAutoLocate = async () => {
    const { fullAddress, city, state, pincode } = formData;
    if (!fullAddress || !city) return alert("Enter Address and City first.");
    setGeoLoading(true);
    const query = `${fullAddress}, ${city}, ${state}, ${pincode}`;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data?.[0]) setFormData(prev => ({ ...prev, latitude: data[0].lat, longitude: data[0].lon }));
      else alert("Location not found.");
    } catch { alert("Geocoding failed."); }
    finally { setGeoLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) await axios.put(`${API}/warehouses/${currentId}`, formData);
      else await axios.post(`${API}/warehouses/create`, formData);
      handleClose();
      fetchWarehouses();
    } catch { alert("Update failed."); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Permanently delete this hub?")) {
      try {
        await axios.delete(`${API}/warehouses/${id}`);
        fetchWarehouses();
      } catch { alert("Delete failed."); }
    }
  };

  return (
    <Sidebar>
      <div className="bg-white rounded-4 shadow-sm p-4 border">
        {/* HEADER */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h4 className="fw-bold mb-0 text-dark">Warehouse Network</h4>
            <p className="text-muted small mb-0">Monitor and manage global supply chain hubs</p>
          </div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" className="rounded-3 shadow-sm" onClick={fetchWarehouses}>
              <RefreshCw size={18} className={loading ? "spinner-border spinner-border-sm border-0" : ""} />
            </Button>
            <Button variant="primary" className="fw-bold rounded-3 px-4 shadow-sm d-flex align-items-center gap-2" onClick={() => setShowModal(true)}>
              <Plus size={18} /> ADD NEW HUB
            </Button>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-4">
          <InputGroup className="shadow-sm rounded-3 overflow-hidden border" style={{ maxWidth: '450px' }}>
            <InputGroup.Text className="bg-white border-0 text-muted">
              <Search size={18} />
            </InputGroup.Text>
            <Form.Control
              placeholder="Search by name, city, or street..."
              className="border-0 shadow-none ps-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </div>

        {loading ? (
          <div className="text-center py-5 text-primary"><Spinner animation="grow" /></div>
        ) : (
          <Table hover responsive className="align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="border-0 py-3">Hub Details</th>
                <th className="border-0 py-3">Location Info</th>
                <th className="border-0 py-3"><MapPin size={14} className="me-1"/> Coordinates</th>
                <th className="border-0 py-3">Inventory</th>
                <th className="border-0 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((w) => (
                <tr key={w._id} className="border-bottom">
                  <td className="py-3">
                    <div className="fw-bold text-dark">{w.name}</div>
                    <small className="text-muted d-block">{w.address?.fullAddress}</small>
                  </td>
                  <td>
                    <span className="text-dark d-block">{w.address?.city}</span>
                    <small className="text-muted">{w.address?.state}, {w.address?.pincode}</small>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <code className="text-primary small mb-1">Lat: {w.location?.coordinates[1]}</code>
                      <code className="text-secondary small">Lon: {w.location?.coordinates[0]}</code>
                    </div>
                  </td>
                  <td>
                    <Button variant="light" size="sm" className="border rounded-pill px-3 fw-bold text-dark d-flex align-items-center gap-1" onClick={() => handleOpenInventory(w)}>
                      <Package size={14} /> {w.inventory?.length || 0} SKU
                    </Button>
                  </td>
                  <td className="text-end">
                    <div className="d-flex justify-content-end gap-1">
                      <Button variant="outline-primary" size="sm" className="border-0" onClick={() => handleEdit(w)}>
                        <Edit3 size={18} />
                      </Button>
                      <Button variant="outline-danger" size="sm" className="border-0" onClick={() => handleDelete(w._id)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* INVENTORY MODAL */}
      <Modal show={showInvModal} onHide={() => setShowInvModal(false)} centered scrollable>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold d-flex align-items-center gap-2">
            <Package className="text-primary" /> Hub Inventory
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="bg-light p-2 rounded mb-3 small text-muted text-center fw-bold uppercase">
             {selectedWarehouse?.name}
          </div>
          {selectedWarehouse?.inventory?.length > 0 ? (
            selectedWarehouse.inventory.map((item, idx) => (
              <div key={idx} className="d-flex justify-content-between align-items-center p-3 border rounded-3 mb-2 bg-white shadow-sm">
                <div>
                  <div className="fw-bold text-dark">{item.product?.product_name || "Unknown Product"}</div>
                  <Badge bg="info" className="fw-normal">In Stock: {item.quantity}</Badge>
                </div>
                <Button variant="danger" size="sm" className="rounded-circle p-1" onClick={() => handleRemoveSKU(item.product?._id)}>
                  <X size={16} />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted">No products assigned yet.</div>
          )}
        </Modal.Body>
      </Modal>

      {/* CREATE/EDIT MODAL */}
      <Modal show={showModal} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">
            {editMode ? <><Edit3 size={20} className="me-2 text-primary" /> Update Hub</> : <><Plus size={20} className="me-2 text-success" /> New Hub</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Hub Display Name</Form.Label>
              <Form.Control required placeholder="e.g. Northern Hub" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">Street Address</Form.Label>
              <Form.Control required placeholder="123 Logistics Ave" value={formData.fullAddress} onChange={e => setFormData({...formData, fullAddress: e.target.value})} />
            </Form.Group>

            <div className="row g-2 mb-3">
              <div className="col-md-4"><Form.Control placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} required /></div>
              <div className="col-md-4"><Form.Control placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required /></div>
              <div className="col-md-4"><Form.Control placeholder="Pincode" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required /></div>
            </div>

            <div className="bg-light p-3 rounded-4 mb-3 border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="small fw-bold text-secondary"><MapIcon size={14} className="me-1"/> Geographic Data</span>
                <Button variant="primary" size="sm" className="fw-bold rounded-pill px-3" onClick={handleAutoLocate} disabled={geoLoading}>
                  {geoLoading ? "Locating..." : "Auto-Fetch Coordinates"}
                </Button>
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <Form.Label className="very-small text-muted mb-0 ms-1">Latitude</Form.Label>
                  <Form.Control required placeholder="0.0000" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                </div>
                <div className="col-6">
                  <Form.Label className="very-small text-muted mb-0 ms-1">Longitude</Form.Label>
                  <Form.Control required placeholder="0.0000" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                </div>
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-100 fw-bold py-3 rounded-3 mt-2 shadow-sm border-0">
              {editMode ? "SAVE CHANGES" : "REGISTER HUB"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Sidebar>
  );
};

export default WarehouseManagement;