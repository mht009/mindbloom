// src/components/chatbot/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch or start a new conversation on component mount
  useEffect(() => {
    const startNewConversation = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "/api/chatbot/conversation/new",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setConversationId(response.data.conversation.id);
        setMessages([
          {
            type: "assistant",
            content: response.data.message,
          },
        ]);
      } catch (error) {
        console.error("Error starting conversation:", error);
      }
    };

    startNewConversation();
  }, []);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    // Add user message to chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "user", content: userMessage },
    ]);

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/chatbot/message",
        { message: userMessage },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Add bot response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "assistant", content: response.data.message },
      ]);

      // Update conversation ID if needed
      if (response.data.conversationId && !conversationId) {
        setConversationId(response.data.conversationId);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/chatbot/start-assessment",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages([
        {
          type: "user",
          content: "I'd like to start the meditation assessment.",
        },
        { type: "assistant", content: response.data.message },
      ]);

      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          type: "assistant",
          content:
            "Sorry, I encountered an error starting the assessment. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(false);

  // Add notification animation when new message arrives and chat is closed
  useEffect(() => {
    if (messages.length > 0 && !isOpen) {
      setHasNewMessage(true);
    } else {
      setHasNewMessage(false);
    }
  }, [messages, isOpen]);

  // Add wiggle animation to catch user attention after 2 minutes of inactivity
  useEffect(() => {
    const wiggleTimer = setTimeout(() => {
      if (!isOpen && messages.length <= 1) {
        setShouldWiggle(true);
        setTimeout(() => setShouldWiggle(false), 1500);
      }
    }, 120000); // 2 minutes

    return () => clearTimeout(wiggleTimer);
  }, [isOpen, messages]);

  return (
    <div className="fixed bottom-8 right-8 z-50 font-sans">
      {/* Chatbot toggle button */}
      <button
        className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl transition-all duration-300 absolute bottom-0 right-0 z-10 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600 " +
              (hasNewMessage ? "animate-pulse" : "") +
              (shouldWiggle ? " animate-bounce" : "")
        } text-white`}
        onClick={toggleChat}
        aria-label="Toggle chat"
      >
        {isOpen ? <span className="font-bold">×</span> : <span>💬</span>}
      </button>

      {/* Chat window with animation */}
      <div
        className={`absolute bottom-20 right-0 w-1/5 h-[70vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 min-w-[300px] max-w-[450px] transform ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-blue-500 text-white flex justify-between items-center rounded-t-xl">
          <div className="flex items-center">
            <span className="text-xl mr-2">🧘</span>
            <h3 className="m-0 text-base font-medium">Mindbloom Meditation</h3>
          </div>
          <div className="flex space-x-2">
            <button
              className="bg-white text-blue-500 border-none rounded-md px-3 py-1 text-xs cursor-pointer transition-all duration-200 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              onClick={handleStartAssessment}
              disabled={isLoading}
            >
              <span className="mr-1">✨</span>
              Start Assessment
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-2xl max-w-[85%] break-words leading-relaxed text-sm ${
                message.type === "user"
                  ? "bg-blue-500 text-white self-end rounded-br-sm"
                  : "bg-gray-200 text-gray-800 self-start rounded-bl-sm"
              } animate-fade-in-down`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="p-3 rounded-2xl max-w-[85%] bg-gray-200 text-gray-800 self-start rounded-bl-sm">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form
          className="flex p-3 bg-white border-t border-gray-200"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 text-white border-none rounded-full px-4 py-2 ml-2 cursor-pointer transition-colors duration-200 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotWidget;
