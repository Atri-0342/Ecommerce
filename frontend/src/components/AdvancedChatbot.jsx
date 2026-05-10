
import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, X, Bot, RotateCcw } from "lucide-react"; // Added RotateCcw
import "./AdvancedChatbot.css";

const AdvancedChatbot = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef();

  // 1. Show Greeting on Open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ 
        sender: "bot", 
        text: "Hello! 👋 I'm your AI assistant. Ask me anything!" 
      }]);
    }
  }, [isOpen]);

  // 2. Listen for Answers
  useEffect(() => {
    if (!socket) return;
    
    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Optional: Listen for a server-side clear confirmation if needed
    socket.on("chat_cleared", () => {
      setMessages([{ 
        sender: "bot", 
        text: "Chat history cleared! How can I help you now?" 
      }]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("chat_cleared");
    };
  }, [socket]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Handle Send Message
  const sendMessage = () => {
    if (!input.trim() || !socket) return;

    socket.emit("send_message", { text: input });

    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");
  };

  // 4. NEW: Handle Refresh/Reset Chat
  const handleResetChat = () => {
    // Clear local UI state
    setMessages([]);
    
    // Tell the backend to clear memory if you decide to add database later
    socket.emit("clear_chat");

    // Show fresh greeting
    setTimeout(() => {
      setMessages([{ 
        sender: "bot", 
        text: "Hello! 👋 I'm your AI assistant. Ask me anything!" 
      }]);
    }, 100);
  };

  return (
    <div className="chatbot-wrapper">
      <button className="chatbot-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {isOpen && (
        <div className="chatgpt-container shadow-lg">
          <div className="chatgpt-header">
            <div className="d-flex align-items-center gap-2">
              <Bot size={20} color="white" />
              <span className="fw-bold">AI Assistant</span>
            </div>
            {/* ✅ REFRESH AND CLOSE BUTTONS */}
            <div className="header-actions">
              <RotateCcw 
                size={18} 
                className="action-icon me-2" 
                onClick={handleResetChat}
                style={{ cursor: "pointer", transition: "0.3s" }}
              />
              <X 
                size={18} 
                className="action-icon" 
                onClick={() => setIsOpen(false)} 
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>

          <div className="chatgpt-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.sender}`}>
                <div className="bubble">{msg.text}</div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="chatgpt-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your question..."
            />
            <button onClick={sendMessage} className="send-btn">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedChatbot;