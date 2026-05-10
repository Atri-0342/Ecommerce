import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Table, Button, Badge, Spinner, Modal, Row, Col, Tooltip, OverlayTrigger } from "react-bootstrap";
import { 
  FileDoc, 
  CheckCircle, 
  Eye, 
  DownloadSimple, 
  ArrowSquareOut, 
  WarningCircle, 
  XCircle, 
  ArrowsClockwise 
} from "@phosphor-icons/react";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import Sidebar from "./Sidebar";

const DealerManagement = () => {
  const API = import.meta.env.VITE_API_URL;
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);

  // 1. Optimized Fetch Logic (The "Refresh Thing")
  const fetchDealers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/dealers/all`);
      
      // FILTER: Only keep Pending and Approved. Rejected are hidden.
      const activeDealers = (res.data.dealers || []).filter(
        (d) => d.status !== "rejected"
      );
      
      setDealers(activeDealers);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

  // 2. Action Handler with Auto-Refresh
  const handleStatusUpdate = async (id, status) => {
    const isApprove = status === 'approve';
    const confirmMsg = isApprove 
      ? "Confirm Approval? Credentials will be sent to the merchant's email." 
      : "Reject this merchant? This will remove them from your active list.";
      
    if (window.confirm(confirmMsg)) {
      try {
        setActionLoading(true);
        await axios.put(`${API}/dealers/${status}/${id}`);
        
        // Success: Close modal and trigger the "refresh thing"
        setShowModal(false);
        await fetchDealers(); 
      } catch (err) {
        alert("Action Failed: " + (err.response?.data?.message || "Server Error"));
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getFileUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    return `${API}/${cleanPath}`;
  };

  const renderDocumentPreview = (path) => {
    if (!path) return (
      <div className="text-white opacity-25 text-center d-flex flex-column align-items-center justify-content-center h-100 p-5">
        <WarningCircle size={48} weight="thin" />
        <p className="x-small mt-2">No Document Provided</p>
      </div>
    );

    const url = getFileUrl(path);
    const extension = path.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      return <iframe src={`${url}#toolbar=0`} width="100%" height="100%" className="border-0" title="PDF" />;
    }

    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
      return (
        <div className="h-100 w-100 d-flex align-items-center justify-content-center bg-dark">
          <Zoom overlayBgColorEnd="rgba(0, 0, 0, 0.9)">
            <img src={url} alt="Proof" className="img-fluid" style={{ maxHeight: '450px', objectFit: 'contain' }} />
          </Zoom>
        </div>
      );
    }

    return (
      <div className="text-white text-center p-5">
        <FileDoc size={48} />
        <p className="mt-2">No Preview Available</p>
        <Button variant="outline-light" size="sm" href={url} download>Download File</Button>
      </div>
    );
  };

  return (
    <Sidebar>
      <div className="bg-white rounded-4 shadow-sm p-4">
        {/* Header with Manual Refresh */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-0">Merchant Management</h4>
            <p className="text-muted small mb-0">Manage applications and verified partners</p>
          </div>
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              className="rounded-circle p-2 d-flex align-items-center justify-content-center"
              onClick={fetchDealers}
              disabled={loading}
            >
              <ArrowsClockwise size={20} className={loading ? "spin-animation" : ""} />
            </Button>
            <Badge bg="primary" className="px-3 py-2 rounded-pill d-flex align-items-center">
              {dealers.filter(d => d.status === "pending").length} Pending
            </Badge>
          </div>
        </div>

        {loading && dealers.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="grow" variant="primary" size="sm" className="me-2" />
            <span className="text-muted">Syncing data...</span>
          </div>
        ) : (
          <Table hover responsive className="align-middle">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th>Business Entity</th>
                <th>Owner</th>
                <th>Compliance</th>
                <th>Status</th>
                <th className="text-end">Verification</th>
              </tr>
            </thead>
            <tbody>
              {dealers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No active merchants found.
                  </td>
                </tr>
              ) : (
                dealers.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className="fw-bold text-dark">{d.brandName}</div>
                      <div className="text-muted x-small">{d.phone}</div>
                    </td>
                    <td>
                      <div className="fw-semibold">{d.ownerName}</div>
                      <div className="text-muted x-small">{d.email}</div>
                    </td>
                    <td>
                      <Badge bg="light" text="dark" className="border fw-normal">PAN: {d.panNumber}</Badge>
                    </td>
                    <td>
                      <Badge bg={d.status === "approved" ? "success" : "warning"} className="rounded-pill">
                        {d.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <Button 
                        variant="light" 
                        size="sm" 
                        className="border shadow-sm px-3 fw-bold"
                        onClick={() => { setSelectedDealer(d); setShowModal(true); }}
                      >
                        <Eye size={16} className="me-1" /> VIEW
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* --- REVIEW MODAL --- */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-5">Verify Merchant Credentials</Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="pt-0">
          {selectedDealer && (
            <Row className="g-3">
              <Col lg={4}>
                <div className="p-3 bg-light rounded-3 border h-100 shadow-sm">
                  <h6 className="fw-bold text-uppercase x-small text-primary mb-3">Merchant Profile</h6>
                  <DetailItem label="Entity" value={selectedDealer.brandName} />
                  <DetailItem label="Owner" value={selectedDealer.ownerName} />
                  <DetailItem label="Email" value={selectedDealer.email} />
                  <DetailItem label="Phone" value={selectedDealer.phone} />
                  <hr className="my-3 opacity-10" />
                  
                  <DetailItem label="PAN Card" value={selectedDealer.panNumber} isCode />
                  <DetailItem label="Aadhaar" value={selectedDealer.aadharNumber} isCode />
                  
                  <div className="mt-4 d-grid gap-2">
                    {selectedDealer.status !== "approved" ? (
                      <>
                        <Button 
                          variant="success" 
                          className="fw-bold py-2" 
                          disabled={actionLoading}
                          onClick={() => handleStatusUpdate(selectedDealer._id, 'approve')}
                        >
                          {actionLoading ? <Spinner size="sm" /> : <><CheckCircle size={18} className="me-2" /> APPROVE</>}
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          className="fw-bold" 
                          disabled={actionLoading}
                          onClick={() => handleStatusUpdate(selectedDealer._id, 'reject')}
                        >
                          <XCircle size={18} className="me-2" /> REJECT
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="danger" 
                        className="fw-bold" 
                        disabled={actionLoading}
                        onClick={() => handleStatusUpdate(selectedDealer._id, 'reject')}
                      >
                        REVOKE ACCESS
                      </Button>
                    )}
                  </div>
                </div>
              </Col>

              <Col lg={8}>
                <div className="d-flex flex-column h-100">
                  <div className="border rounded-3 overflow-hidden bg-dark shadow-inner" style={{ minHeight: '480px' }}>
                    {renderDocumentPreview(selectedDealer.proofAttachment)}
                  </div>
                  
                  {selectedDealer.proofAttachment && (
                    <div className="d-flex gap-2 mt-3">
                      <a href={getFileUrl(selectedDealer.proofAttachment)} target="_blank" rel="noreferrer" className="btn btn-dark btn-sm flex-grow-1 fw-bold d-flex align-items-center justify-content-center py-2">
                        <ArrowSquareOut size={18} className="me-2" /> FULLSCREEN
                      </a>
                      <a href={getFileUrl(selectedDealer.proofAttachment)} download className="btn btn-outline-dark btn-sm fw-bold px-3">
                        <DownloadSimple size={20} />
                      </a>
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .x-small { font-size: 11px; }
        .detail-label { font-size: 10px; text-transform: uppercase; color: #6c757d; font-weight: 800; margin-bottom: 2px; }
        .detail-value { font-size: 14px; font-weight: 600; color: #212529; margin-bottom: 12px; }
        .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.2); }
        
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Sidebar>
  );
};

const DetailItem = ({ label, value, isCode }) => (
  <div>
    <div className="detail-label">{label}</div>
    <div className={`detail-value ${isCode ? 'font-monospace text-danger bg-white border d-inline-block px-1 rounded' : ''}`}>
      {value || "N/A"}
    </div>
  </div>
);

export default DealerManagement;