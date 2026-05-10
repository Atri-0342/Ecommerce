import React, { useState, useRef, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { User, Phone, Envelope, Camera, ArrowLeft, ShieldCheck, MapPin } from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import axios from "axios";
import Navigation from "../components/Navigation";
import { setUser } from "../store/authSlice";

const UpdateProfile = () => {
  const { user, accessToken } = useSelector((state) => state.auth);
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.image || null);
  const [loading, setLoading] = useState(false);

  // Cleanup preview URL to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error("File is too large. Max limit is 2MB");
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use FormData for multi-part (text + files)
      const data = new FormData();
      data.append("name", formData.name);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      if (imageFile) {
        data.append("image", imageFile);
      }

      const response = await axios.put(`${API}/users/profile`, data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        dispatch(setUser(response.data.user));
        toast.success("Profile updated successfully!");
        setTimeout(() => navigate("/settings"), 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 pb-5" style={{ backgroundColor: "#f8fafc" }}>
      <Navigation />

      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={7} xl={6}>
            {/* Back Button */}
            <Button
              variant="link"
              className="text-decoration-none text-secondary mb-4 p-0 d-flex align-items-center gap-2 transition-all"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} weight="bold" />
              <span className="fw-semibold">Back to Settings</span>
            </Button>

            <Card className="border-0 shadow-lg rounded-4 overflow-hidden">
  {/* Header with Horizontal Layout */}
  <div
    className="p-4 p-md-5"
    style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
  >
    <div className="d-flex align-items-center gap-4">
      {/* Left side: Avatar */}
      <div className="position-relative flex-shrink-0">
        <div
          className="bg-white p-1 rounded-circle shadow-lg"
          style={{ width: "100px", height: "100px" }}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="rounded-circle w-100 h-100 object-fit-cover"
            />
          ) : (
            <div className="bg-light rounded-circle w-100 h-100 d-flex align-items-center justify-content-center">
              <User size={50} weight="duotone" className="text-primary" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="btn btn-dark btn-sm rounded-circle position-absolute bottom-0 end-0 shadow-sm d-flex align-items-center justify-content-center"
          style={{ width: "32px", height: "32px", border: "2px solid white" }}
        >
          <Camera size={16} weight="bold" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/*"
          onChange={handleImageChange}
        />
      </div>

      {/* Right side: Name and Subtext stack */}
      <div className="text-white">
        <h3 className="fw-bold mb-1 text-truncate" style={{ maxWidth: "250px" }}>
          {formData.name || user?.name || "New User"}
        </h3>
        <p className="text-white-50 small mb-0 d-flex align-items-center gap-1">
          <ShieldCheck size={16} />
          Manage your personal presence
        </p>
      </div>
    </div>
  </div>
              <Card.Body className="p-4 p-md-5 bg-white">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-4">
                    {/* Full Name */}
                    <Col md={6}>
                      <Form.Label className="fw-bold small text-secondary">FULL NAME</Form.Label>
                      <InputGroup className="border rounded-3 overflow-hidden shadow-sm">
                        <InputGroup.Text className="bg-white border-0 ps-3">
                          <User size={20} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="border-0 shadow-none py-2"
                          required
                        />
                      </InputGroup>
                    </Col>

                    {/* Phone Number */}
                    <Col md={6}>
                      <Form.Label className="fw-bold small text-secondary">PHONE NUMBER</Form.Label>
                      <InputGroup className="border rounded-3 overflow-hidden shadow-sm">
                        <InputGroup.Text className="bg-white border-0 ps-3">
                          <Phone size={20} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+1 234 567 890"
                          className="border-0 shadow-none py-2"
                          required
                        />
                      </InputGroup>
                    </Col>

                    {/* Address */}
                    <Col xs={12}>
                      <Form.Label className="fw-bold small text-secondary">RESIDENTIAL ADDRESS</Form.Label>
                      <InputGroup className="border rounded-3 overflow-hidden shadow-sm">
                        <InputGroup.Text className="bg-white border-0 ps-3 align-self-start mt-2">
                          <MapPin size={20} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          as="textarea"
                          name="address"
                          rows={3}
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Enter your full home address"
                          className="border-0 shadow-none py-2"
                          required
                        />
                      </InputGroup>
                    </Col>

                    {/* Email (Disabled Visual) */}
                    <Col xs={12}>
                      <Form.Label className="fw-bold small text-secondary">
                        EMAIL ADDRESS <span className="text-muted fw-normal">(Cannot be changed)</span>
                      </Form.Label>
                      <InputGroup className="border rounded-3 bg-light opacity-75">
                        <InputGroup.Text className="bg-transparent border-0 ps-3">
                          <Envelope size={20} className="text-muted" />
                        </InputGroup.Text>
                        <Form.Control
                          value={user?.email || ""}
                          disabled
                          className="bg-transparent border-0 shadow-none py-2 text-muted"
                        />
                      </InputGroup>
                    </Col>
                  </Row>

                  <Button
                    type="submit"
                    className="w-100 py-3 mt-5 rounded-3 fw-bold border-0 shadow-lg d-flex align-items-center justify-content-center gap-2"
                    style={{ background: "linear-gradient(to right, #4f46e5, #7c3aed)" }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      "Save Profile Details"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>

            <div className="text-center mt-4">
              <span className="badge bg-white text-success border px-3 py-2 rounded-pill shadow-sm d-inline-flex align-items-center gap-2">
                <ShieldCheck size={18} weight="fill" />
                Your data is encrypted and secure
              </span>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default UpdateProfile;