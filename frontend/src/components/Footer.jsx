import React from "react";
import { Container, Row, Col, InputGroup, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { 
  FacebookLogo, 
  TwitterLogo, 
  InstagramLogo, 
  PaperPlaneRight 
} from "@phosphor-icons/react";

const Footer = () => {
  const navigate = useNavigate();

  // Helper to scroll to top for the Home link
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  const linkStyle = { 
    cursor: 'pointer', 
    transition: '0.2s',
    display: 'block'
  };

  return (
    <footer 
      style={{
        backgroundColor: "#0f172a", 
        color: "white",
        padding: "60px 0 30px 0",
        marginTop: "auto",           
        width: "100%",
        position: "relative",
        zIndex: 10,
        display: "block"             
      }}
    >
      <Container>
        <Row className="gy-4">
          <Col lg={4} md={12}>
            <h4 className="fw-bold text-white mb-4">
              YuKTI<span style={{ color: "#6366f1" }}>.</span>
            </h4>
            <p style={{ color: "rgba(255,255,255,0.6)", paddingRight: "3rem" }}>
              Elevating your online shopping experience with quality products and seamless service. 
              Grounded in excellence, focused on you.
            </p>
            <div className="d-flex gap-3 mt-3">
              <FacebookLogo size={24} style={{ cursor: 'pointer', opacity: 0.7 }} weight="fill" />
              <TwitterLogo size={24} style={{ cursor: 'pointer', opacity: 0.7 }} weight="fill" />
              <InstagramLogo size={24} style={{ cursor: 'pointer', opacity: 0.7 }} weight="fill" />
            </div>
          </Col>
          
          <Col xs={6} lg={2}>
  <h6 className="fw-bold text-white mb-4">Quick Links</h6>
  <ul className="list-unstyled" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "2.2" }}>
    <li style={linkStyle} onClick={scrollToTop} className="hover-white">Home</li>
    <li style={linkStyle} onClick={() => navigate("/category")} className="hover-white">Categories</li>
    <li style={linkStyle} onClick={() => navigate("/trend")} className="hover-white">Trending</li>
    <li style={linkStyle} onClick={() => navigate("/seller-registration")} className="hover-white text-warning fw-bold">Become a Seller</li>
    {/* Added Merchant Login */}
    <li 
      style={linkStyle} 
      onClick={() => navigate("/seller-login")} 
      className="hover-white text-info small fw-bold"
    >
      Merchant Login
    </li>
  </ul>
</Col>

          <Col xs={6} lg={2}>
            <h6 className="fw-bold text-white mb-4">Support</h6>
            <ul className="list-unstyled" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "2.2" }}>
              <li style={linkStyle} onClick={() => navigate("/support")} className="hover-white">Help Center</li>
              <li style={linkStyle} className="opacity-50 cursor-not-allowed">Returns</li>
              <li style={linkStyle} onClick={() => navigate("/support")} className="hover-white">Contact</li>
            </ul>
          </Col>

          <Col lg={4}>
            <h6 className="fw-bold text-white mb-4">Newsletter</h6>
            <p className="small" style={{ color: "rgba(255,255,255,0.6)" }}>Get special offers and deals.</p>
            
            <InputGroup 
              className="mt-3 overflow-hidden rounded-pill" 
              style={{ 
                border: "1px solid rgba(255,255,255,0.2)", 
                backgroundColor: "rgba(255,255,255,0.05)" 
              }}
            >
              <Form.Control 
                placeholder="Your email address" 
                className="border-0 ps-3 shadow-none" 
                style={{ 
                  color: "white",
                  fontSize: "0.9rem"
                }} 
              />
              <Button 
                variant="primary" 
                className="fw-bold border-0 px-4 d-flex align-items-center"
                style={{ backgroundColor: "#6366f1" }}
              >
                <PaperPlaneRight size={18} weight="bold" className="me-2" />
                Join
              </Button>
            </InputGroup>
          </Col>
        </Row>
        
        <hr style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "40px 0" }} />
        
        <div className="text-center small" style={{ color: "rgba(255,255,255,0.5)" }}>
          © {new Date().getFullYear()} YuKTI — All Rights Reserved.
        </div>
      </Container>

      <style>{`
        .hover-white:hover {
          color: white;
          transform: translateX(5px);
        }
      `}</style>
    </footer>
  );
};

export default Footer;