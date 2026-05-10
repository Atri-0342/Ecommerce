import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { 
  PaperPlaneRight, 
  User as UserIcon, 
  CaretLeft, 
  Circle,
  ArrowsClockwise // Added for refresh
} from "@phosphor-icons/react";
import { Button, Form, InputGroup, Spinner } from "react-bootstrap";

const socket = io(import.meta.env.VITE_API_URL.replace("/api", "")); 

const Chat = ({ orderId, onBack, receiverName }) => {
  const API = import.meta.env.VITE_API_URL;
  const { deliveryToken, deliveryInfo } = useSelector((state) => state.auth);
  const currentDeliveryId = deliveryInfo?._id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // New state for refresh button
  const scrollRef = useRef();

  // Function to fetch history (separated so it can be called by Refresh button)
  const fetchHistory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${deliveryToken}` } };
      const { data } = await axios.get(`${API}/delivery/chat-history/${orderId}`, config);
      setMessages(data.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!orderId || !deliveryToken) return;

    fetchHistory();

    socket.emit("join_room", orderId);

    socket.on("receive_message", (data) => {
      if (data.orderId === orderId) {
        setMessages((prev) => {
          const exists = prev.find(m => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [orderId, deliveryToken]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage("");

    try {
      const config = { headers: { Authorization: `Bearer ${deliveryToken}` } };
      const { data } = await axios.post(`${API}/delivery/send-message1`, { 
        orderId, 
        text: messageText 
      }, config);

      const socketPayload = {
        ...data.data,
        orderId,
        sender: currentDeliveryId,
      };

      socket.emit("send_message", socketPayload);
      setMessages((prev) => [...prev, data.data]);
      
    } catch (err) {
      alert("Failed to send message");
    }
  };

  return (
    <div className="chat-container d-flex flex-column shadow rounded-4 overflow-hidden bg-white border" style={{ height: "600px" }}>
      
      {/* Header Area */}
      <div className="chat-header p-3 border-bottom d-flex align-items-center justify-content-between bg-dark text-white shadow-sm">
        <div className="d-flex align-items-center flex-grow-1">
          <Button variant="link" className="p-0 me-3 text-white border-0" onClick={onBack}>
            <CaretLeft size={24} weight="bold" />
          </Button>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "42px", height: "42px" }}>
             <UserIcon size={20} weight="bold" />
          </div>
          <div className="ms-3 flex-grow-1">
            <div className="d-flex align-items-center">
                <h6 className="mb-0 fw-bold">{receiverName || "Customer"}</h6>
                {/* REFRESH BUTTON ADDED HERE */}
                <Button 
                    variant="link" 
                    className={`p-0 ms-2 text-white-50 border-0 ${refreshing ? 'spinning' : ''}`} 
                    onClick={() => fetchHistory(true)}
                    style={{ lineHeight: 0 }}
                >
                    <ArrowsClockwise size={18} weight="bold" />
                </Button>
            </div>
            <div className="d-flex align-items-center">
                <Circle size={8} weight="fill" className="text-success me-1" />
                <small className="text-white-50">Active Delivery Chat</small>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="chat-body p-3 flex-grow-1 overflow-auto" style={{ background: "#F0F2F5" }}>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderModel === "DeliveryPerson";
            return (
              <div key={index} className={`d-flex flex-column mb-3 ${isMe ? "align-items-end" : "align-items-start"}`}>
                <span className="mb-1 px-2" style={{ fontSize: "11px", fontWeight: "bold", color: "#65676B" }}>
                  {isMe ? "You (Rider)" : (receiverName || "Customer")}
                </span>
                <div 
                  className={`p-3 shadow-sm ${isMe ? "text-white" : "text-dark"}`} 
                  style={{ 
                    maxWidth: "75%", 
                    borderRadius: "20px",
                    backgroundColor: isMe ? "#0D6EFD" : "#E4E6EB",
                    borderBottomRightRadius: isMe ? "4px" : "20px",
                    borderBottomLeftRadius: isMe ? "20px" : "4px",
                  }}
                >
                  <p className="mb-0 small" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  <div className={`text-end mt-1 small`} style={{ fontSize: "10px", opacity: 0.6 }}>
                    {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="chat-footer p-3 bg-white border-top">
        <Form onSubmit={handleSendMessage}>
          <InputGroup className="bg-light rounded-pill p-1 border overflow-hidden">
            <Form.Control
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="border-0 bg-transparent px-3 shadow-none py-2"
            />
            <Button 
                type="submit" 
                variant="primary" 
                disabled={!newMessage.trim()} 
                className="rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                style={{ width: "40px", height: "40px" }}
            >
              <PaperPlaneRight size={18} weight="fill" />
            </Button>
          </InputGroup>
        </Form>
      </div>

      <style>{`
        .chat-body::-webkit-scrollbar { width: 5px; }
        .chat-body::-webkit-scrollbar-thumb { background: #ced4da; border-radius: 10px; }
        
        /* Animation for the refresh button */
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinning {
            animation: spin 0.8s linear infinite;
            color: #0D6EFD !important;
        }
      `}</style>
    </div>
  );
};

export default Chat;