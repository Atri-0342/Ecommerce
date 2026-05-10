// import { useEffect, useState, useMemo } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";

// // Components
// import Navigation from "../components/Navigation";
// import Footer from "../components/Footer";

// // React Bootstrap
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   Button,
//   Form,
//   InputGroup,
//   Offcanvas,
//   Badge,
//   Spinner
// } from "react-bootstrap";

// // ✅ Filter Content Component (Moved outside to prevent focus loss)
// const FilterContent = ({ 
//   query, setQuery, priceRange, setPriceRange, 
//   category, setCategory, categories, 
//   brand, setBrand, brands, 
//   rating, setRating 
// }) => (
//   <div className="filter-section p-1">
//     <Form.Group className="mb-4">
//       <Form.Label className="fw-bold small text-uppercase text-muted">Keyword Search</Form.Label>
//       <InputGroup className="bg-light rounded-3 overflow-hidden border shadow-sm">
//         <Form.Control
//           placeholder="Search products..."
//           className="border-0 bg-transparent shadow-none"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           autoFocus 
//         />
//       </InputGroup>
//     </Form.Group>

//     <Form.Group className="mb-4">
//       <Form.Label className="fw-bold small text-uppercase text-muted">Price Range (₹)</Form.Label>
//       <div className="d-flex gap-2 align-items-center">
//         <Form.Control
//           type="number"
//           placeholder="Min"
//           size="sm"
//           className="rounded-3 shadow-none"
//           value={priceRange.min}
//           onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
//         />
//         <span className="text-muted">-</span>
//         <Form.Control
//           type="number"
//           placeholder="Max"
//           size="sm"
//           className="rounded-3 shadow-none"
//           value={priceRange.max}
//           onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
//         />
//       </div>
//     </Form.Group>

//     <Form.Group className="mb-4">
//       <Form.Label className="fw-bold small text-uppercase text-muted">Category</Form.Label>
//       <Form.Select 
//         className="rounded-3 shadow-none border" 
//         value={category} 
//         onChange={(e) => setCategory(e.target.value)}
//       >
//         <option value="">All Categories</option>
//         {categories.map((cat, i) => (
//           <option key={cat._id || i} value={cat._id || cat}>
//             {cat.name || cat}
//           </option>
//         ))}
//       </Form.Select>
//     </Form.Group>

//     <Form.Group className="mb-4">
//       <Form.Label className="fw-bold small text-uppercase text-muted">Brand</Form.Label>
//       <Form.Select 
//         className="rounded-3 shadow-none border" 
//         value={brand} 
//         onChange={(e) => setBrand(e.target.value)}
//       >
//         <option value="">All Brands</option>
//         {brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
//       </Form.Select>
//     </Form.Group>

//     <Form.Group className="mb-4">
//       <Form.Label className="fw-bold small text-uppercase text-muted">Minimum Rating</Form.Label>
//       <div className="d-flex flex-wrap gap-2">
//         {[4, 3, 2, 1].map((star) => (
//           <Badge
//             key={star}
//             role="button"
//             pill
//             bg={rating === star ? "primary" : "light"}
//             className={`text-${rating === star ? "white" : "dark"} border px-3 py-2`}
//             onClick={() => setRating(rating === star ? 0 : star)}
//           >
//             {star}★ & Up
//           </Badge>
//         ))}
//       </div>
//     </Form.Group>

//     <Button 
//       variant="outline-danger" 
//       size="sm" 
//       className="w-100 rounded-3 mt-2 fw-bold"
//       onClick={() => {
//         setQuery("");
//         setPriceRange({ min: 0, max: 1000000 });
//         setCategory("");
//         setBrand("");
//         setRating(0);
//       }}
//     >
//       Reset Filters
//     </Button>
//   </div>
// );

// const Search = () => {
//   const API = import.meta.env.VITE_API_URL;
//   const location = useLocation();
//   const navigate = useNavigate();

//   const [products, setProducts] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [query, setQuery] = useState(location.state?.query || "");
//   const [showFilters, setShowFilters] = useState(false);

//   const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
//   const [category, setCategory] = useState("");
//   const [brand, setBrand] = useState("");
//   const [rating, setRating] = useState(0);

//   // --- 1. Load Products ---
//   useEffect(() => {
//     const fetchProducts = async () => {
//       setLoading(true);
//       try {
//         const res = await axios.get(`${API}/products`);
//         const data = res.data.products || res.data || [];
//         setProducts(data);
//       } catch (err) {
//         console.error("Search Fetch Error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchProducts();
//   }, [API]);

//   // --- 2. Extract Categories/Brands safely ---
//   const categories = useMemo(() => {
//     const map = new Map();
//     products.forEach(p => {
//       if (p.category && typeof p.category === 'object') {
//         map.set(p.category._id, p.category);
//       } else if (p.category) {
//         map.set(p.category, { _id: p.category, name: p.category });
//       }
//     });
//     return Array.from(map.values());
//   }, [products]);

//   const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

//   // --- 3. Filter Logic ---
//   useEffect(() => {
//     const result = products.filter((p) => {
//       const productName = p.product_name || "";
//       const productBrand = p.brand || "";
//       const catName = typeof p.category === 'object' ? p.category.name : (p.category || "");

//       const matchesQuery = `${productName} ${productBrand} ${catName}`
//         .toLowerCase()
//         .includes(query.toLowerCase());

//       const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
//       const matchesCategory = category 
//         ? (typeof p.category === 'object' ? p.category._id === category : p.category === category)
//         : true;
//       const matchesBrand = brand ? p.brand === brand : true;
//       const matchesRating = p.rating >= rating;

//       return matchesQuery && matchesPrice && matchesCategory && matchesBrand && matchesRating;
//     });
//     setFiltered(result);
//   }, [query, priceRange, category, brand, rating, products]);

//   // --- 4. Helpers ---
//   const getImageUrl = (product) => {
//     const rawPath = product.images?.[0] || product.image;
//     if (!rawPath) return "/placeholder.jpg";

//     // Since there is no /api prefix, and paths usually start with /
//     // We remove any trailing slash from API and leading slash from rawPath
//     const baseUrl = API.replace(/\/+$/, ""); 
//     const cleanPath = rawPath.replace(/^\/+/, "");

//     return `${baseUrl}/${cleanPath}`;
//   };

//   const renderStars = (r) => {
//     const stars = Math.round(r || 0);
//     return (
//       <div className="text-warning mb-2" style={{ fontSize: "14px" }}>
//         {"★".repeat(stars)}{"☆".repeat(5 - stars)}
//         <span className="text-muted ms-1" style={{ fontSize: "12px" }}>({r || 0})</span>
//       </div>
//     );
//   };

//   const filterProps = {
//     query, setQuery, priceRange, setPriceRange, 
//     category, setCategory, categories, 
//     brand, setBrand, brands, 
//     rating, setRating
//   };

//   return (
//     <div className="bg-white" style={{ minHeight: "100vh" }}>
//       <Navigation />

//       <div className="bg-dark text-white py-4 shadow-sm mb-4">
//         <Container>
//           <div className="d-flex justify-content-between align-items-center">
//             <div>
//               <h2 className="fw-bold mb-0">Marketplace</h2>
//               <p className="text-white-50 mb-0 small">{filtered.length} products found</p>
//             </div>
//             <Button 
//               variant="outline-light" 
//               className="d-md-none rounded-pill px-4"
//               onClick={() => setShowFilters(true)}
//             >
//               Filters ☰
//             </Button>
//           </div>
//         </Container>
//       </div>

//       <Container fluid="lg" className="pb-5">
//         <Row>
//           <Col md={3} className="d-none d-md-block">
//             <Card className="border-0 shadow-sm rounded-4 sticky-top" style={{ top: "100px" }}>
//               <Card.Body>
//                 <h5 className="fw-bold mb-4">Refine Results</h5>
//                 <FilterContent {...filterProps} />
//               </Card.Body>
//             </Card>
//           </Col>

//           <Col md={9}>
//             {loading ? (
//               <div className="text-center py-5">
//                 <Spinner animation="border" variant="primary" />
//                 <p className="mt-3 text-muted">Scanning catalog...</p>
//               </div>
//             ) : filtered.length > 0 ? (
//               <Row className="g-4">
//                 {filtered.map((p) => (
//                   <Col key={p._id} xs={6} lg={4}>
//                     <Card 
//                       className="h-100 border-0 shadow-sm product-card-hover rounded-4 overflow-hidden"
//                       onClick={() => navigate(`/product/${p._id}`)}
//                       style={{ cursor: "pointer" }}
//                     >
//                       <div className="position-relative p-3 bg-light" style={{ height: "180px" }}>
//                         <Card.Img
//                           variant="top"
//                           src={getImageUrl(p)}
//                           className="w-100 h-100"
//                           style={{ objectFit: "contain" }}
//                           onError={(e) => { e.target.src = "/placeholder.jpg"; }}
//                         />
//                       </div>

//                       <Card.Body className="d-flex flex-column">
//                         <Badge bg="secondary" className="mb-2 align-self-start opacity-75" style={{ fontSize: '10px' }}>
//                           {typeof p.category === 'object' ? p.category.name : p.category}
//                         </Badge>
//                         <Card.Title className="h6 text-truncate fw-bold mb-1">
//                           {p.product_name}
//                         </Card.Title>
//                         {renderStars(p.rating)}
//                         <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
//                           <span className="h6 fw-bold text-primary mb-0">₹{p.price?.toLocaleString()}</span>
//                           <Button variant="link" size="sm" className="p-0 text-decoration-none fw-bold">
//                             View →
//                           </Button>
//                         </div>
//                       </Card.Body>
//                     </Card>
//                   </Col>
//                 ))}
//               </Row>
//             ) : (
//               <div className="text-center py-5 bg-light rounded-4 border border-dashed">
//                 <h4 className="text-muted fw-bold">No Matches Found</h4>
//                 <p className="text-muted">Try a different keyword or reset filters.</p>
//                 <Button variant="primary" className="rounded-pill" onClick={() => setQuery("")}>Reset Search</Button>
//               </div>
//             )}
//           </Col>
//         </Row>
//       </Container>

//       <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="start" className="rounded-end-4">
//         <Offcanvas.Header closeButton className="border-bottom">
//           <Offcanvas.Title className="fw-bold">Filters</Offcanvas.Title>
//         </Offcanvas.Header>
//         <Offcanvas.Body>
//           <FilterContent {...filterProps} />
//         </Offcanvas.Body>
//       </Offcanvas>

//       <Footer />
//     </div>
//   );
// };

// export default Search;




import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Components
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

// React Bootstrap
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Offcanvas,
  Badge,
  Spinner
} from "react-bootstrap";

// ✅ Filter Content Component (Kept outside to prevent focus loss)
const FilterContent = ({
  query, setQuery, priceRange, setPriceRange,
  category, setCategory, categories,
  brand, setBrand, brands,
  rating, setRating
}) => (
  <div className="filter-section p-1">
    <Form.Group className="mb-4">
      <Form.Label className="fw-bold small text-uppercase text-muted">Keyword Search</Form.Label>
      <InputGroup className="bg-light rounded-3 overflow-hidden border shadow-sm">
        <Form.Control
          placeholder="Search products..."
          className="border-0 bg-transparent shadow-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </InputGroup>
    </Form.Group>

    <Form.Group className="mb-4">
      <Form.Label className="fw-bold small text-uppercase text-muted">Price Range (₹)</Form.Label>
      <div className="d-flex gap-2 align-items-center">
        <Form.Control
          type="number"
          placeholder="Min"
          size="sm"
          className="rounded-3 shadow-none"
          value={priceRange.min}
          onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
        />
        <span className="text-muted">-</span>
        <Form.Control
          type="number"
          placeholder="Max"
          size="sm"
          className="rounded-3 shadow-none"
          value={priceRange.max}
          onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
        />
      </div>
    </Form.Group>

    <Form.Group className="mb-4">
      <Form.Label className="fw-bold small text-uppercase text-muted">Category</Form.Label>
      <Form.Select
        className="rounded-3 shadow-none border"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        {categories.map((cat, i) => (
          <option key={cat._id || i} value={cat._id || cat}>
            {cat.name || cat}
          </option>
        ))}
      </Form.Select>
    </Form.Group>

    <Form.Group className="mb-4">
      <Form.Label className="fw-bold small text-uppercase text-muted">Brand</Form.Label>
      <Form.Select
        className="rounded-3 shadow-none border"
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
      >
        <option value="">All Brands</option>
        {brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
      </Form.Select>
    </Form.Group>

    <Form.Group className="mb-4">
      <Form.Label className="fw-bold small text-uppercase text-muted">Minimum Rating</Form.Label>
      <div className="d-flex flex-wrap gap-2">
        {[4, 3, 2, 1].map((star) => (
          <Badge
            key={star}
            role="button"
            pill
            bg={rating === star ? "primary" : "light"}
            className={`text-${rating === star ? "white" : "dark"} border px-3 py-2`}
            onClick={() => setRating(rating === star ? 0 : star)}
          >
            {star}★ & Up
          </Badge>
        ))}
      </div>
    </Form.Group>

    <Button
      variant="outline-danger"
      size="sm"
      className="w-100 rounded-3 mt-2 fw-bold"
      onClick={() => {
        setQuery("");
        setPriceRange({ min: 0, max: 1000000 });
        setCategory("");
        setBrand("");
        setRating(0);
      }}
    >
      Reset Filters
    </Button>
  </div>
);

const Search = () => {
  const API = import.meta.env.VITE_API_URL;
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(location.state?.query || "");
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [rating, setRating] = useState(0);

  // --- ⭐ 1. Load Products (AI-Aware Logic) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const isAiMode = location.state?.aiMode;
        const token = localStorage.getItem("accessToken");

        // Switch endpoint based on navigation source
        const endpoint = (isAiMode && token)
          ? `${API}/ai/personalized`
          : `${API}/products`;

        const config = (isAiMode && token)
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};

        const res = await axios.get(endpoint, config);
        const data = res.data.products || res.data || [];
        setProducts(data);
      } catch (err) {
        console.error("Search Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [API, location.state]);

  // --- 2. Extract Categories/Brands safely ---
  const categories = useMemo(() => {
    const map = new Map();
    products.forEach(p => {
      if (p.category && typeof p.category === 'object') {
        map.set(p.category._id, p.category);
      } else if (p.category) {
        map.set(p.category, { _id: p.category, name: p.category });
      }
    });
    return Array.from(map.values());
  }, [products]);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))], [products]);

  // --- 3. Filter Logic ---
  useEffect(() => {
    const result = products.filter((p) => {
      const productName = p.product_name || "";
      const productBrand = p.brand || "";
      const catName = typeof p.category === 'object' ? p.category.name : (p.category || "");

      const matchesQuery = `${productName} ${productBrand} ${catName}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesPrice = p.price >= priceRange.min && p.price <= priceRange.max;
      const matchesCategory = category
        ? (typeof p.category === 'object' ? p.category._id === category : p.category === category)
        : true;
      const matchesBrand = brand ? p.brand === brand : true;
      const matchesRating = p.rating >= rating;

      return matchesQuery && matchesPrice && matchesCategory && matchesBrand && matchesRating;
    });
    setFiltered(result);
  }, [query, priceRange, category, brand, rating, products]);

  // --- 4. Helpers ---
  const getImageUrl = (product) => {
    const rawPath = product.images?.[0] || product.image;
    if (!rawPath) return "/placeholder.jpg";
    const baseUrl = API.replace(/\/+$/, "");
    const cleanPath = rawPath.replace(/^\/+/, "");
    return `${baseUrl}/${cleanPath}`;
  };

  const renderStars = (r) => {
    const stars = Math.round(r || 0);
    return (
      <div className="text-warning mb-2" style={{ fontSize: "14px" }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
        <span className="text-muted ms-1" style={{ fontSize: "12px" }}>({r || 0})</span>
      </div>
    );
  };

  const filterProps = {
    query, setQuery, priceRange, setPriceRange,
    category, setCategory, categories,
    brand, setBrand, brands,
    rating, setRating
  };

  return (
    <div className="bg-white" style={{ minHeight: "100vh" }}>
      <Navigation />

      {/* ⭐ Dynamic Header: Title changes based on AI Mode */}
      <div className="bg-dark text-white py-4 shadow-sm mb-4">
        <Container>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-0">
                {location.state?.aiMode ? "Calculated for You ✨" : "Marketplace"}
              </h2>
              <p className="text-white-50 mb-0 small">
                {location.state?.aiMode
                  ? "Smart AI recommendations based on your activity"
                  : `${filtered.length} products found`}
              </p>
            </div>
            <Button
              variant="outline-light"
              className="d-md-none rounded-pill px-4"
              onClick={() => setShowFilters(true)}
            >
              Filters ☰
            </Button>
          </div>
        </Container>
      </div>

      <Container fluid="lg" className="pb-5">
        <Row>
          <Col md={3} className="d-none d-md-block">
            <Card className="border-0 shadow-sm rounded-4 sticky-top" style={{ top: "100px" }}>
              <Card.Body>
                <h5 className="fw-bold mb-4">Refine Results</h5>
                <FilterContent {...filterProps} />
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">AI is calculating your top matches...</p>
              </div>
            ) : filtered.length > 0 ? (
              <Row className="g-4">
                {filtered.map((p) => (
                  <Col key={p._id} xs={6} lg={4}>
                    <Card
                      className="h-100 border-0 shadow-sm product-card-hover rounded-4 overflow-hidden"
                      onClick={() => navigate(`/product/${p._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="position-relative p-3 bg-light" style={{ height: "180px" }}>
                        <Card.Img
                          variant="top"
                          src={getImageUrl(p)}
                          className="w-100 h-100"
                          style={{ objectFit: "contain" }}
                          onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                        />
                      </div>

                      <Card.Body className="d-flex flex-column">


                        {/* ✅ Insert it right here at the top of Card.Body */}
                        {location.state?.aiMode && (
                          <Badge bg="info" className="mb-2 align-self-start shadow-sm" style={{ fontSize: '10px' }}>
                            ✨ AI Pick for You
                          </Badge>
                        )}

                        <Badge bg="secondary" className="mb-2 align-self-start opacity-75" style={{ fontSize: '10px' }}>
                          {typeof p.category === 'object' ? p.category.name : p.category}
                        </Badge>

                        {/* <Badge bg="secondary" className="mb-2 align-self-start opacity-75" style={{ fontSize: '10px' }}>
                          {typeof p.category === 'object' ? p.category.name : p.category}
                        </Badge> */}
                        <Card.Title className="h6 text-truncate fw-bold mb-1">
                          {p.product_name}
                        </Card.Title>
                        {renderStars(p.rating)}
                        <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                          <span className="h6 fw-bold text-primary mb-0">₹{p.price?.toLocaleString()}</span>
                          <Button variant="link" size="sm" className="p-0 text-decoration-none fw-bold">
                            View →
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                <h4 className="text-muted fw-bold">No Matches Found</h4>
                <p className="text-muted">Try resetting filters or changing your search.</p>
                <Button variant="primary" className="rounded-pill" onClick={() => setQuery("")}>Reset Search</Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="start" className="rounded-end-4">
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <FilterContent {...filterProps} />
        </Offcanvas.Body>
      </Offcanvas>

      <Footer />
    </div>
  );
};

export default Search;