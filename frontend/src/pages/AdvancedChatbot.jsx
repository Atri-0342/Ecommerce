import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  X, Send, Sparkles, Plus, Trash2, 
  MessageSquare, PanelLeftClose, PanelLeftOpen, ExternalLink, Trash, Package
} from "lucide-react";
import { Button, Form, Spinner, Badge } from "react-bootstrap";

// --- Internal Product Card Component ---
const ChatProductCard = ({ product, onNavigate }) => {
  return (
    <div 
      className="bg-white rounded-4 shadow-sm border overflow-hidden flex-shrink-0 chat-prod-card" 
      style={{ width: '220px', scrollSnapAlign: 'start', cursor: 'pointer', transition: '0.3s' }}
      onClick={() => onNavigate(product._id)}
    >
      <div className="position-relative">
        <img 
          src={product.images?.[0] || "https://via.placeholder.com/200x150?text=No+Image"} 
          alt={product.product_name}
          className="w-100"
          style={{ height: '140px', objectFit: 'cover' }}
        />
        {product.rating > 0 && (
          <Badge bg="warning" text="dark" className="position-absolute top-0 end-0 m-2 shadow-sm">
            ★ {product.rating.toFixed(1)}
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h6 className="text-truncate mb-1 fw-bold" style={{ fontSize: '14px', color: '#1e293b' }}>
          {product.product_name}
        </h6>
        <p className="text-muted small mb-2 text-truncate" style={{ fontSize: '12px' }}>
          {product.brand || 'Generic'}
        </p>
        <div className="d-flex justify-content-between align-items-end mt-2">
          <span className="text-primary fw-bold" style={{ fontSize: '16px' }}>₹{product.price}</span>
          <Button variant="primary" size="sm" className="rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
            <ExternalLink size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const AdvancedChatbot = ({ socket, userId, isOpenExternal, setIsOpenExternal }) => {
  const navigate = useNavigate();
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = isOpenExternal !== undefined ? isOpenExternal : localOpen;
  const setIsOpen = setIsOpenExternal !== undefined ? setIsOpenExternal : setLocalOpen;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Session States
  const [sessions, setSessions] = useState([]); 
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  
  const scrollRef = useRef(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 1. Fetch All Sessions for Sidebar
  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const { data } = await axios.get(`http://localhost:5000/messages/sessions/${userId}`);
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (err) { console.error("Error fetching sessions:", err); }
  };

  useEffect(() => {
    if (userId && isOpen) fetchSessions();
  }, [userId, isOpen]);

  // 2. Load specific session history
  const loadSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const { data } = await axios.get(`http://localhost:5000/messages/history/${userId}/${sessionId}`);
      if (data.success) {
        const formatted = data.history.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
          products: m.products || []
        }));
        setMessages(formatted);
      }
    } catch (err) { console.error("Error loading session:", err); }
  };

  // 3. Socket Logic
  useEffect(() => {
    if (socket && userId) {
      socket.emit("join_chat", { userId });

      const handleReceive = (msg) => {
        // Prevent duplicate rendering: Only process if sender is NOT the user
        if (msg.sender === "bot" || msg.sender === "assistant") {
          setIsTyping(false);
          setMessages((prev) => [...prev, { 
            role: "assistant", 
            content: msg.text,
            products: msg.products || [] 
          }]);
          fetchSessions(); // Refresh sidebar to show latest preview
        }
      };

      socket.on("receive_message", handleReceive);
      return () => socket.off("receive_message", handleReceive);
    }
  }, [socket, userId]);

  const sendMessage = () => {
    if (!socket || !input.trim() || !userId) return;
    const userMessage = input.trim();
    
    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage, products: [] }]);
    setIsTyping(true);
    setInput(""); 
    
    // Emit to backend
    socket.emit("send_message", { userId, text: userMessage, sessionId: activeSessionId });
  };

  const startNewSession = () => {
    setActiveSessionId(null);
    setMessages([{ role: "assistant", content: "New session started! How can I help you today?", products: [] }]);
  };

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    try {
      await axios.delete(`http://localhost:5000/messages/session/${userId}/${sessionId}`);
      fetchSessions();
      if (activeSessionId === sessionId) startNewSession();
    } catch (err) { console.error(err); }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("Delete ALL chat history?")) return;
    try {
      await axios.delete(`http://localhost:5000/messages/clear/${userId}`);
      setSessions([]);
      startNewSession();
    } catch (err) { console.error(err); }
  };

  const handleProductNavigation = (productId) => {
    setIsOpen(false);
    navigate(`/product/${productId}`);
  };

  return (
    <>
      {!isOpen && (
        <div className="chatbot-bubble shadow-lg d-flex align-items-center justify-content-center scale-up" 
             onClick={() => setIsOpen(true)}
             style={{ position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', background: '#0f172a', borderRadius: '50%', cursor: 'pointer', zIndex: 9999, border: '4px solid white' }}>
          <Sparkles color="white" size={28} />
        </div>
      )}

      {isOpen && (
        <div className="ai-full-overlay anim-fade-in" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'white', zIndex: 10000, display: 'flex' }}>
          
          {/* DYNAMIC SIDEBAR */}
          <aside className="sidebar-ai" style={{ width: sidebarOpen ? '320px' : '0', background: '#f8f9fa', borderRight: '1px solid #e2e8f0', transition: '0.3s', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="p-4 flex-grow-1 overflow-auto d-flex flex-column">
              <Button variant="dark" className="w-100 rounded-pill mb-4 py-2 shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={startNewSession}>
                <Plus size={18}/> New Chat
              </Button>
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted fw-bold mb-0 small">RECENT HISTORY</p>
                {sessions.length > 0 && (
                  <Button variant="link" className="text-danger p-0" onClick={clearAllHistory} title="Clear All">
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>

              <div className="d-flex flex-column gap-2 overflow-auto custom-scrollbar pr-2">
                {sessions.length === 0 ? (
                  <div className="text-center p-3 text-muted small opacity-50">No history yet</div>
                ) : (
                  sessions.map((s, idx) => (
                    <div key={idx} 
                         onClick={() => loadSession(s.sessionId)}
                         className={`p-3 rounded-3 border d-flex align-items-center justify-content-between transition-all ${activeSessionId === s.sessionId ? 'bg-white border-primary shadow-sm' : 'bg-transparent text-secondary border-transparent'}`}
                         style={{ cursor: 'pointer' }}>
                      <div className="d-flex align-items-center gap-2 text-truncate" style={{ flex: 1 }}>
                        <MessageSquare size={16} className={activeSessionId === s.sessionId ? 'text-primary' : ''}/>
                        <span className="text-truncate fw-medium" style={{ fontSize: '13px' }}>{s.lastMessage || `Session ${idx + 1}`}</span>
                      </div>
                      <Trash size={14} className="text-muted hover-danger ml-2" onClick={(e) => deleteSession(e, s.sessionId)} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          {/* MAIN CHAT WINDOW */}
          <main className="flex-grow-1 d-flex flex-column bg-white">
            <header className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <Button variant="link" className="p-0 text-dark" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  {sidebarOpen ? <PanelLeftClose size={22} /> : <PanelLeftOpen size={22} />}
                </Button>
                <span className="fw-bold fs-5">YuKTI 2.0</span>
              </div>
              <Button variant="link" className="text-muted p-0" onClick={() => setIsOpen(false)}><X size={32} /></Button>
            </header>

            <div className="flex-grow-1 overflow-auto p-4 chat-bg-pattern" ref={scrollRef}>
              <div className="mx-auto" style={{ maxWidth: '850px' }}>
                {messages.map((m, i) => (
                  <div key={i} className={`d-flex flex-column mb-4 ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                    <div className={`p-3 px-4 shadow-sm anim-slide-up ${m.role === 'user' ? 'bg-primary text-white' : 'bg-light text-dark'}`} 
                         style={{ maxWidth: '75%', borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px' }}>
                      {m.content}
                    </div>

                    {/* PRODUCT COUNT & LIST */}
                    {m.products && m.products.length > 0 && (
                      <div className="w-100 mt-3 anim-fade-in">
                        <div className="mb-2">
                           <Badge bg="primary" className="rounded-pill px-3 py-2 d-flex align-items-center gap-2" style={{ width: 'fit-content' }}>
                             <Package size={14}/> {m.products.length} Products Found
                           </Badge>
                        </div>
                        <div className="d-flex gap-3 overflow-auto pb-3 custom-scrollbar">
                          {m.products.map((p, idx) => (
                            <ChatProductCard key={p._id || idx} product={p} onNavigate={handleProductNavigation} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="d-flex justify-content-start mb-4">
                    <div className="p-3 px-4 rounded-pill bg-light d-flex align-items-center gap-3 border shadow-xs">
                      <Spinner animation="grow" size="sm" variant="primary" />
                      <span className="small text-muted fw-bold">YuKTI is thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-top bg-white">
              <div className="mx-auto" style={{ maxWidth: '800px' }}>
                <div className="d-flex gap-2 bg-light p-2 px-3 rounded-pill border shadow-sm">
                  <Form.Control 
                    className="border-0 bg-transparent shadow-none py-2" 
                    placeholder="Search for products..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button variant="primary" className="rounded-circle p-0" style={{ width: '44px', height: '44px' }} disabled={!input.trim() || isTyping} onClick={sendMessage}>
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .hover-danger:hover { color: #ef4444 !important; }
        .chat-bg-pattern { background-color: #ffffff; background-image: radial-gradient(#e2e8f0 0.8px, transparent 0.8px); background-size: 24px 24px; }
        .anim-slide-up { animation: slideUp 0.3s ease-out; }
        .anim-fade-in { animation: fadeIn 0.4s ease-in; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
};

export default AdvancedChatbot;