// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useSelector } from "react-redux";
// import { Table, Badge, Spinner } from "react-bootstrap";
// import { Star, MessageSquare } from "lucide-react";
// import Sidebar from "./Sidebar";

// const Feedback = () => {
//   const API = import.meta.env.VITE_API_URL;
//   const { adminToken } = useSelector((state) => state.auth);
//   const [feedbacks, setFeedbacks] = useState([]);
//   const [loading, setLoading] = useState(true);

// const fetchAllFeedbacks = async () => {
//   try {
//     const res = await axios.get(`${API}/products/admin/all-feedbacks`, {
//       headers: { Authorization: `Bearer ${adminToken}` }
//     });
    
//     // Log this to your browser console (F12) to see what actually arrives
//     console.log("Data from server:", res.data); 

//     // Ensure we are setting the array correctly
//     if (res.data.success && res.data.feedbacks) {
//       setFeedbacks(res.data.feedbacks);
//     }
//   } catch (err) {
//     console.error("Feedback fetch error", err);
//   } finally {
//     setLoading(false);
//   }
// };

//   useEffect(() => { fetchAllFeedbacks(); }, []);

//   return (
//     <Sidebar>
//       <div className="bg-white rounded-4 shadow-sm p-4">
//         <div className="d-flex align-items-center gap-3 mb-4">
//           <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
//             <MessageSquare size={24} />
//           </div>
//           <div>
//             <h4 className="fw-bold mb-0">Customer Feedback</h4>
//             <p className="text-muted small mb-0">Aggregate reviews across all product listings.</p>
//           </div>
//         </div>

//         {loading ? (
//           <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
//         ) : (
//           <Table hover responsive className="align-middle border-top">
//             <thead className="bg-light text-muted small text-uppercase">
//               <tr>
//                 <th className="py-3">Product</th>
//                 <th>Customer</th>
//                 <th>Rating</th>
//                 <th>Comment</th>
//                 <th>Date</th>
//               </tr>
//             </thead>
//             <tbody>
//               {feedbacks.length > 0 ? feedbacks.map((f) => (
//                 <tr key={f._id}>
//                   <td className="fw-bold text-dark">{f.productName}</td>
//                   <td className="text-secondary">{f.customerName}</td>
//                   <td>
//                     <Badge bg="warning" text="dark" className="px-2 py-1 d-flex align-items-center gap-1 w-fit">
//                       {f.rating} <Star size={12} fill="currentColor" />
//                     </Badge>
//                   </td>
//                   <td className="text-muted small" style={{ maxWidth: '350px' }}>
//                     {f.comment}
//                   </td>
//                   <td className="small text-secondary">
//                     {new Date(f.createdAt).toLocaleDateString()}
//                   </td>
//                 </tr>
//               )) : (
//                 <tr><td colSpan="5" className="text-center py-4 text-muted">No feedbacks recorded yet.</td></tr>
//               )}
//             </tbody>
//           </Table>
//         )}
//       </div>
//     </Sidebar>
//   );
// };

// export default Feedback;




import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Table, Badge, Spinner } from "react-bootstrap";
import { Star, MessageSquare } from "lucide-react";
import Sidebar from "./Sidebar";

const Feedback = () => {
  const API = import.meta.env.VITE_API_URL;
  const { adminToken } = useSelector((state) => state.auth);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

//   const fetchAllFeedbacks = async () => {
//     try {
//       // ✅ Hits your FeedbackController's getAllFeedbacks route
//       const res = await axios.get(`${API}/feedback/all`, {
//         headers: { Authorization: `Bearer ${adminToken}` }
//       });
      
//       // We use res.data.feedbacks because your controller returns { success, count, feedbacks }
//       setFeedbacks(res.data.feedbacks || []);
//     } catch (err) {
//       console.error("Error fetching feedbacks:", err);
//     } finally {
//       setLoading(false);
//     }
//   };
const fetchAllFeedbacks = async () => {
    try {
      setLoading(true);
      
      // DEBUG: Check if token exists before calling
      if (!adminToken) {
        console.error("No Admin Token found in Redux!");
        return;
      }

      const res = await axios.get(`${API}/feedback/all`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log("Server Response:", res.data); // Look at this in F12 Console

      if (res.data.success) {
        setFeedbacks(res.data.feedbacks || []);
      }
    } catch (err) {
      console.error("Error fetching feedbacks:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAllFeedbacks(); }, []);

  return (
    <Sidebar>
      <div className="bg-white rounded-4 shadow-sm p-4">
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
            <MessageSquare size={24} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Customer Feedback</h4>
            <p className="text-muted small mb-0">Global logs from the separate Feedback model.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <Table hover responsive className="align-middle border-top">
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="py-3">Order ID</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length > 0 ? feedbacks.map((f) => (
                <tr key={f._id}>
                  {/* Since your controller populates orderId, we can show the ID */}
                  <td className="fw-bold text-primary small">
                    #{f.orderId?._id?.slice(-6).toUpperCase() || "N/A"}
                  </td>
                  <td>
                    <div className="fw-bold">{f.userId?.name || "Guest"}</div>
                    <div className="small text-muted">{f.userId?.email}</div>
                  </td>
                  <td>
                    <Badge bg="warning" text="dark" className="px-2 py-1 d-flex align-items-center gap-1 w-fit">
                      {f.rating} <Star size={12} fill="currentColor" />
                    </Badge>
                  </td>
                  <td className="text-muted small" style={{ maxWidth: '350px' }}>
                    {f.comment}
                  </td>
                  <td className="small text-secondary">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="text-center py-4 text-muted">No feedbacks found in database.</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </div>
    </Sidebar>
  );
};

export default Feedback;