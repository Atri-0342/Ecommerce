import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Modal, Form, Table, Row, Col } from "react-bootstrap";
import Sidebar from "./Sidebar";

const AddProduct = () => {
  const API = import.meta.env.VITE_API_URL;

  const [show, setShow] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    product_name: "",
    price: "",
    discountPrice: "",
    description: "",
    stock: "",
    categoryId: "",
    brand: "",
    images: []
  });

  // ✅ GET PRODUCTS
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data.products || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ GET CATEGORIES
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ✅ SUBMIT PRODUCT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "images") {
        formData.images.forEach((img) => data.append("images", img));
      } else {
        data.append(key, formData[key]);
      }
    });

    try {
      await axios.post(`${API}/products/create`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true // 🔥 IMPORTANT (for auth)
      });

      alert("Product Added ✅");
      setShow(false);
      fetchProducts();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding product");
    }
  };

  return (
    <Sidebar>
      <div className="d-flex justify-content-between mb-4">
        <h4>Product Management</h4>
        <Button onClick={() => setShow(true)}>+ Add Product</Button>
      </div>

      {/* ✅ PRODUCT LIST */}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.product_name}</td>
              <td>₹{p.price}</td>
              <td>{p.stock}</td>
              <td>{p.category?.name}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* ✅ MODAL */}
      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Add Product</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Control
                  placeholder="Product Name"
                  required
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                />
              </Col>

              <Col md={6}>
                <Form.Control
                  type="number"
                  placeholder="Price"
                  required
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </Col>

              <Col md={6} className="mt-3">
                <Form.Control
                  type="number"
                  placeholder="Stock"
                  required
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </Col>

              <Col md={6} className="mt-3">
                <Form.Select
                  required
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              <Col md={12} className="mt-3">
                <Form.Control
                  as="textarea"
                  placeholder="Description"
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Col>

              <Col md={12} className="mt-3">
                <Form.Control
                  type="file"
                  multiple
                  onChange={(e) =>
                    setFormData({ ...formData, images: Array.from(e.target.files) })
                  }
                />
              </Col>
            </Row>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShow(false)}>Close</Button>
            <Button type="submit">Add Product</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Sidebar>
  );
};

export default AddProduct;