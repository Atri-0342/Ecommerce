import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import io from "socket.io-client";
import { 
  PaperPlaneRight, 
  User as UserIcon, 
  CaretLeft, 
  Circle,
  ArrowsClockwise 
} from "@phosphor-icons/react";
import { Button, Form, InputGroup, Spinner, Alert } from "react-bootstrap";

// Connect to socket server
const socket = io(import.meta.env.VITE_API_URL.replace("/api", "")); 

const Chat = ({ orderId, onBack, receiverName }) => {
  const API = import.meta.env.VITE_API_URL;
  
  // --- REDUX STATE ---
  const { accessToken, user } = useSelector((state) => state.auth);
  const currentUserId = user?._id || user?.id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef();

  // 1. Fetch History Function
  const fetchHistory = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      const { data } = await axios.get(`${API}/delivery/chat-history/${orderId}`, config);
      setMessages(data.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load history", err);
      setError("Could not load chat history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and Socket setup
  useEffect(() => {
    if (!orderId || !accessToken) return;

    fetchHistory();
    socket.emit("join_room", orderId);

    socket.on("receive_message", (data) => {
      if (data.orderId === orderId) {
        setMessages((prev) => {
          // Avoid duplicate messages
          const exists = prev.find(m => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    });

    return () => socket.off("receive_message");
  }, [orderId, accessToken]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError(null);
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(""); // Optimistic clear

    try {
      const config = { headers: { Authorization: `Bearer ${accessToken}` } };
      
      const { data } = await axios.post(`${API}/delivery/send-message2`, { 
        orderId, 
        text: messageText 
      }, config);

      // Emit via socket
      socket.emit("send_message", {
        ...data.data, // use the returned data object
        orderId,
        sender: currentUserId,
        senderModel: "User", 
      });

      setMessages((prev) => [...prev, data.data]);
    } catch (err) {
      console.error("Chat Error:", err.response?.data);
      setError(err.response?.data?.message || "Failed to send message.");
    }
  };

  return (
    <div className="chat-container d-flex flex-column shadow rounded-4 overflow-hidden bg-white border mx-auto" style={{ height: "600px", maxWidth: "900px" }}>
      
      {/* HEADER - Matches Delivery App Dark Theme */}
      <div className="chat-header p-3 border-bottom d-flex align-items-center justify-content-between bg-dark text-white shadow-sm">
        <div className="d-flex align-items-center flex-grow-1">
          <Button variant="link" className="p-0 me-3 text-white border-0 shadow-none" onClick={onBack}>
            <CaretLeft size={24} weight="bold" />
          </Button>
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "42px", height: "42px" }}>
             <UserIcon size={20} weight="bold" />
          </div>
          <div className="ms-3 flex-grow-1">
            <div className="d-flex align-items-center">
              <h6 className="mb-0 fw-bold">{receiverName || "Delivery Partner"}</h6>
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
                <small className="text-white-50">Live Support</small>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES AREA */}
      <div className="chat-body p-3 flex-grow-1 overflow-auto d-flex flex-column" style={{ background: "#F0F2F5" }}>
        {error && <Alert variant="danger" className="py-2 small text-center">{error}</Alert>}
        
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderModel === "User";

            return (
              <div key={index} className={`d-flex flex-column mb-3 ${isMe ? "align-items-end" : "align-items-start"}`}>
                {/* Sender Name Label */}
                <span className="mb-1 px-2" style={{ fontSize: "11px", fontWeight: "bold", color: "#65676B" }}>
                  {isMe ? "You" : (receiverName || "Rider")}
                </span>

                {/* Message Bubble */}
                <div 
                  className={`p-3 shadow-sm ${isMe ? "text-white" : "text-dark"}`} 
                  style={{ 
                    maxWidth: "75%", 
                    borderRadius: "20px",
                    backgroundColor: isMe ? "#0D6EFD" : "#FFFFFF", 
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

      {/* INPUT FOOTER */}
      <div className="chat-footer p-3 bg-white border-top">
        <Form onSubmit={handleSendMessage}>
          <InputGroup className="bg-light rounded-pill p-1 border overflow-hidden">
            <Form.Control
              placeholder="Type your message..."
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

      {/* STYLES */}
      <style>{`
        .chat-body::-webkit-scrollbar { width: 5px; }
        .chat-body::-webkit-scrollbar-thumb { background: #ced4da; border-radius: 10px; }
        
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