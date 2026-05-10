import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select"; 
import { Form, Button, Card, Container, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { User, Envelope, Phone, Lock, House, ArrowRight } from "@phosphor-icons/react";

const DeliveryRegistration = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    assignedWarehouse: "",
  });

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingWarehouses, setFetchingWarehouses] = useState(true);

  // --- 1. FETCH & FORMAT DATA ---
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const { data } = await axios.get(`${API}/warehouses/all`);
        if (data.warehouses && Array.isArray(data.warehouses)) {
          const formattedOptions = data.warehouses.map((w) => ({
            value: w._id,
            label: `${w.name} - ${w.address?.city || 'Location'}`
          }));
          setWarehouses(formattedOptions);
        }
      } catch (err) {
        console.error("Error fetching warehouses:", err);
      } finally {
        setFetchingWarehouses(false);
      }
    };
    fetchWarehouses();
  }, [API]);

  // --- 2. HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (selectedOption) => {
    setFormData({ 
      ...formData, 
      assignedWarehouse: selectedOption ? selectedOption.value : "" 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.assignedWarehouse) return alert("Please select a warehouse from the search box.");
    
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/delivery/register`, formData);
      if (data.success) {
        alert("Registration Successful! Redirecting to login...");
        navigate("/delivery/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. CUSTOM STYLING ---
  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "transparent",
      border: "none",
      boxShadow: "none",
      minHeight: "45px",
    }),
    container: (provided) => ({
      ...provided,
      flex: 1,
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    })
  };

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="border-0 shadow-lg rounded-4">
              <div className="p-4 p-md-5 bg-white rounded-4">
                <div className="text-center mb-4">
                  <div className="bg-primary bg-opacity-10 d-inline-block p-3 rounded-circle mb-3">
                    <House size={32} weight="duotone" className="text-primary" />
                  </div>
                  <h3 className="fw-bold text-dark">Join Delivery Team</h3>
                  <p className="text-muted small">Enter your details and search for your assigned branch</p>
                </div>

                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Full Name */}
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Full Name</Form.Label>
                        <InputGroup className="bg-light rounded-3 border overflow-hidden">
                          <InputGroup.Text className="bg-transparent border-0 text-muted"><User size={18}/></InputGroup.Text>
                          <Form.Control 
                            name="name" 
                            placeholder="John Doe"
                            onChange={handleChange} 
                            required 
                            className="bg-transparent border-0 py-2 shadow-none" 
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    {/* Email Address */}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Email Address</Form.Label>
                        <InputGroup className="bg-light rounded-3 border overflow-hidden">
                          <InputGroup.Text className="bg-transparent border-0 text-muted"><Envelope size={18}/></InputGroup.Text>
                          <Form.Control 
                            type="email"
                            name="email" 
                            placeholder="john@example.com"
                            onChange={handleChange} 
                            required 
                            className="bg-transparent border-0 py-2 shadow-none" 
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    {/* Phone Number */}
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Phone Number</Form.Label>
                        <InputGroup className="bg-light rounded-3 border overflow-hidden">
                          <InputGroup.Text className="bg-transparent border-0 text-muted"><Phone size={18}/></InputGroup.Text>
                          <Form.Control 
                            type="tel"
                            name="phone" 
                            placeholder="+91 98765 43210"
                            onChange={handleChange} 
                            required 
                            className="bg-transparent border-0 py-2 shadow-none" 
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    {/* Searchable Warehouse Selection */}
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold">Search Assigned Warehouse</Form.Label>
                        <InputGroup className="bg-light rounded-3 border align-items-center">
                          <InputGroup.Text className="bg-transparent border-0 text-muted">
                            <House size={18} />
                          </InputGroup.Text>
                          <Select
                            options={warehouses}
                            isLoading={fetchingWarehouses}
                            onChange={handleSelectChange}
                            styles={customStyles}
                            placeholder="Type to search branch..."
                            isSearchable
                            isClearable
                            menuPortalTarget={document.body} 
                          />
                        </InputGroup>
                        <Form.Text className="text-muted">Can't find yours? Contact your supervisor.</Form.Text>
                      </Form.Group>
                    </Col>

                    {/* Password */}
                    <Col md={12}>
                      <Form.Group className="mb-4">
                        <Form.Label className="small fw-bold">Security Password</Form.Label>
                        <InputGroup className="bg-light rounded-3 border overflow-hidden">
                          <InputGroup.Text className="bg-transparent border-0 text-muted"><Lock size={18}/></InputGroup.Text>
                          <Form.Control 
                            type="password" 
                            name="password" 
                            placeholder="••••••••"
                            onChange={handleChange} 
                            required 
                            className="bg-transparent border-0 py-2 shadow-none" 
                          />
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100 fw-bold py-2 rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2" 
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : <>Register Account <ArrowRight weight="bold" /></>}
                  </Button>

                  <div className="text-center mt-4">
                    <p className="text-muted small mb-0">
                      Already have an account? <Link to="/delivery/login" className="text-primary fw-bold text-decoration-none">Log in</Link>
                    </p>
                  </div>
                </Form>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DeliveryRegistration;