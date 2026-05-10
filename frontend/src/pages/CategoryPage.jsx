// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { Container, Row, Col, Card, Breadcrumb, Spinner, Form } from "react-bootstrap";
// import Navigation from "../components/Navigation";
// import Footer from "../components/Footer";

// const CategoryPage = () => {
//   const { categoryName } = useParams();
//   const navigate = useNavigate();
//   const API = import.meta.env.VITE_API_URL;

//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchCategoryProducts = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(`${API}/products/category/${categoryName}`);
//         setProducts(res.data.products || []);
//       } catch (err) {
//         console.error("Error fetching category products:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCategoryProducts();
//   }, [categoryName, API]);

//   const handleProductClick = async (id) => {
//     try {
//       await axios.patch(`${API}/products/click/${id}`);
//       navigate(`/product/${id}`);
//     } catch (err) {
//       navigate(`/product/${id}`);
//     }
//   };

//   const renderStars = (rating) => {
//     const r = Math.round(Number(rating)) || 0;
//     return "★".repeat(r) + "☆".repeat(5 - r);
//   };

//   return (
//     <div className="bg-light min-vh-100">
//       <Navigation />

//       <Container className="py-4">
//         {/* 🧭 Breadcrumb like Amazon */}
//         <Breadcrumb className="small mb-4">
//           <Breadcrumb.Item onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Home</Breadcrumb.Item>
//           <Breadcrumb.Item active className="text-capitalize">{categoryName}</Breadcrumb.Item>
//         </Breadcrumb>

//         <Row>
//           {/* 🛠️ Sidebar Filters (Flipkart Style) */}
//           <Col lg={3} className="d-none d-lg-block">
//             <Card className="border-0 shadow-sm p-3 mb-4 sticky-top" style={{ top: "100px", zIndex: 10 }}>
//               <h5 className="fw-bold mb-3">Filters</h5>
//               <hr />
//               <div className="mb-4">
//                 <p className="fw-bold small mb-2">CUSTOMER RATINGS</p>
//                 {[4, 3, 2, 1].map((star) => (
//                   <Form.Check 
//                     key={star}
//                     type="checkbox"
//                     label={`${star}★ & above`}
//                     className="small mb-1"
//                   />
//                 ))}
//               </div>
//               <div>
//                 <p className="fw-bold small mb-2">PRICE RANGE</p>
//                 <Form.Range />
//                 <div className="d-flex justify-content-between small text-muted">
//                   <span>Min</span>
//                   <span>Max</span>
//                 </div>
//               </div>
//             </Card>
//           </Col>

//           {/* 📦 Product Results */}
//           <Col lg={9}>
//             <div className="d-flex justify-content-between align-items-center bg-white p-3 shadow-sm rounded mb-4">
//               <h4 className="m-0 fw-bold text-capitalize">
//                 Showing {products.length} results for "{categoryName}"
//               </h4>
//               <Form.Select size="sm" style={{ width: "150px" }}>
//                 <option>Newest First</option>
//                 <option>Price: Low to High</option>
//                 <option>Price: High to Low</option>
//               </Form.Select>
//             </div>

//             {loading ? (
//               <div className="text-center py-5">
//                 <Spinner animation="border" variant="primary" />
//               </div>
//             ) : products.length > 0 ? (
//               <Row className="g-3">
//                 {products.map((p) => (
//                   <Col key={p._id} xs={12} sm={6} md={4}>
//                     <Card 
//                       className="h-100 border-0 shadow-sm product-hover-card"
//                       onClick={() => handleProductClick(p._id)}
//                       style={{ cursor: "pointer", overflow: "hidden" }}
//                     >
//                       <div className="p-3 text-center bg-white" style={{ height: "200px" }}>
//                         <Card.Img 
//                           src={p.image ? `${API}${p.image}` : "/placeholder.jpg"} 
//                           className="h-100 w-100" 
//                           style={{ objectFit: "contain" }}
//                         />
//                       </div>
//                       <Card.Body className="d-flex flex-column border-top">
//                         <Card.Title className="h6 text-truncate mb-1">{p.product_name}</Card.Title>
//                         <div className="d-flex align-items-center mb-2">
//                           <span className="badge bg-success me-2" style={{ fontSize: "12px" }}>
//                             {p.rating || 0} ★
//                           </span>
//                           <span className="text-warning small">{renderStars(p.rating)}</span>
//                         </div>
//                         <div className="mt-auto">
//                           <span className="h5 fw-bold text-dark">₹{p.price}</span>
//                           <span className="text-muted small text-decoration-line-through ms-2">
//                             ₹{Math.floor(p.price * 1.2)}
//                           </span>
//                         </div>
//                         <p className="text-success small fw-bold mb-0 mt-1">Free Delivery</p>
//                       </Card.Body>
//                     </Card>
//                   </Col>
//                 ))}
//               </Row>
//             ) : (
//               <Card className="text-center py-5 border-0 shadow-sm">
//                 <div className="display-1 text-muted mb-3">🛍️</div>
//                 <h5>No products found in this category.</h5>
//                 <p className="text-muted">Try checking other categories!</p>
//               </Card>
//             )}
//           </Col>
//         </Row>
//       </Container>
//       <Footer />
//     </div>
//   );
// };

// export default CategoryPage;



import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Breadcrumb, Spinner, Form } from "react-bootstrap";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

const CategoryPage = () => {
  const { categoryName } = useParams(); // This holds the ID or Slug from the URL
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const [products, setProducts] = useState([]);
  const [displayName, setDisplayName] = useState(""); // ✅ State to store the real Name
  const [loading, setLoading] = useState(true);

  // 🛠️ Clean Base URL logic to prevent double slashes
  const IMAGE_BASE_URL = API.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/products/category/${categoryName}`);
        const fetchedProducts = res.data.products || [];
        setProducts(fetchedProducts);

        // ✅ Extract real category name from the first product's populated category
        if (fetchedProducts.length > 0 && fetchedProducts[0].category?.name) {
          setDisplayName(fetchedProducts[0].category.name);
        } else {
          setDisplayName("Products");
        }
      } catch (err) {
        console.error("Error fetching category products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryProducts();
  }, [categoryName, API]);

  const handleProductClick = async (id) => {
    try {
      await axios.patch(`${API}/products/click/${id}`);
      navigate(`/product/${id}`);
    } catch (err) {
      navigate(`/product/${id}`);
    }
  };

  const renderStars = (rating) => {
    const r = Math.round(Number(rating)) || 0;
    return "★".repeat(r) + "☆".repeat(5 - r);
  };

  return (
    <div className="bg-light min-vh-100">
      <Navigation />

      <Container className="py-4">
        <Breadcrumb className="small mb-4">
          <Breadcrumb.Item onClick={() => navigate("/")} style={{ cursor: "pointer" }}>Home</Breadcrumb.Item>
          {/* ✅ Use displayName instead of the ID from useParams */}
          <Breadcrumb.Item active className="text-capitalize">{displayName}</Breadcrumb.Item>
        </Breadcrumb>

        <Row>
          <Col lg={3} className="d-none d-lg-block">
            <Card className="border-0 shadow-sm p-3 mb-4 sticky-top" style={{ top: "100px", zIndex: 10 }}>
              <h5 className="fw-bold mb-3">Filters</h5>
              <hr />
              <div className="mb-4">
                <p className="fw-bold small mb-2">CUSTOMER RATINGS</p>
                {[4, 3, 2, 1].map((star) => (
                  <Form.Check key={star} type="checkbox" label={`${star}★ & above`} className="small mb-1" />
                ))}
              </div>
              <div>
                <p className="fw-bold small mb-2">PRICE RANGE</p>
                <Form.Range />
              </div>
            </Card>
          </Col>

          <Col lg={9}>
            <div className="d-flex justify-content-between align-items-center bg-white p-3 shadow-sm rounded mb-4">
              <h4 className="m-0 fw-bold text-capitalize">
                {/* ✅ Dynamic Title Fix */}
                Showing {products.length} results for "{displayName}"
              </h4>
              <Form.Select size="sm" style={{ width: "150px" }}>
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </Form.Select>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : products.length > 0 ? (
              <Row className="g-3">
                {products.map((p) => {
                  // ✅ Fix Image Path Logic
                  const rawPath = p.images?.[0] || p.image || "";
                  const cleanPath = rawPath.replace(/^\/+/, "");
                  const displayImg = cleanPath 
                    ? `${IMAGE_BASE_URL}/${cleanPath}` 
                    : "https://via.placeholder.com/300";

                  return (
                    <Col key={p._id} xs={12} sm={6} md={4}>
                      <Card 
                        className="h-100 border-0 shadow-sm product-hover-card"
                        onClick={() => handleProductClick(p._id)}
                        style={{ cursor: "pointer", overflow: "hidden" }}
                      >
                        <div className="p-3 text-center bg-white" style={{ height: "200px" }}>
                          <Card.Img 
                            src={displayImg} 
                            className="h-100 w-100" 
                            style={{ objectFit: "contain" }}
                            onError={(e) => { e.target.src = "https://placehold.co/300x300?text=Not+Found"; }}
                          />
                        </div>
                        <Card.Body className="d-flex flex-column border-top">
                          <Card.Title className="h6 text-truncate mb-1">{p.product_name}</Card.Title>
                          <div className="d-flex align-items-center mb-2">
                            <span className="badge bg-success me-2" style={{ fontSize: "12px" }}>
                              {p.rating || 0} ★
                            </span>
                            <span className="text-warning small">{renderStars(p.rating)}</span>
                          </div>
                          <div className="mt-auto">
                            <span className="h5 fw-bold text-dark">₹{p.price}</span>
                            <span className="text-muted small text-decoration-line-through ms-2">
                              ₹{Math.floor(p.price * 1.2)}
                            </span>
                          </div>
                          <p className="text-success small fw-bold mb-0 mt-1">Free Delivery</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <Card className="text-center py-5 border-0 shadow-sm">
                <div className="display-1 text-muted mb-3">🛍️</div>
                <h5>No products found in this category.</h5>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default CategoryPage;