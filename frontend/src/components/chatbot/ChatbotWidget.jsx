// src/components/chatbot/ChatbotWidget.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [shouldWiggle, setShouldWiggle] = useState(false);
  const [hasActiveConversation, setHasActiveConversation] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Create a ref for the input element to maintain focus
  const inputRef = useRef(null);

  // Check for active conversation on component mount instead of creating a new one
  useEffect(() => {
    checkChatbotStatus();
    fetchConversations();
  }, []);

  // Check if user has an active conversation without creating one
  const checkChatbotStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/chatbot/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.hasActiveConversation && response.data.activeConversation) {
        setHasActiveConversation(true);
        setConversationId(response.data.activeConversation.id);
        
        // Only load conversation messages if chat is opened
        if (isOpen) {
          loadConversation(response.data.activeConversation.id);
        }
      } else {
        setHasActiveConversation(false);
        setShowWelcome(true);
      }
    } catch (error) {
      console.error("Error checking chatbot status:", error);
    }
  };

  // Fetch all conversations for history
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/chatbot/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  // Load a specific conversation
  const loadConversation = async (convId) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/chatbot/conversation/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setConversationId(response.data.conversation.id);
      setMessages(
        response.data.messages.map((msg) => ({
          type: msg.type,
          content: msg.content,
        }))
      );
      setHasActiveConversation(true);
      setShowWelcome(false);

      // Set this conversation as active
      await axios.put(
        `/api/chatbot/conversation/${convId}`,
        { isActive: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowHistory(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
      // Focus input after loading conversation
      setTimeout(() => {
        if (inputRef.current && !showHistory) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Delete a conversation
  const deleteConversation = async (convId, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/chatbot/conversation/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Refresh conversation list
      fetchConversations();

      // If we deleted the current conversation, reset state
      if (convId === conversationId) {
        setConversationId(null);
        setMessages([]);
        setHasActiveConversation(false);
        setShowWelcome(true);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // Start a new conversation
  const startNewConversation = async () => {
    try {
      setIsLoading(true);
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
      setHasActiveConversation(true);
      setShowWelcome(false);

      // Refresh conversation list
      fetchConversations();
    } catch (error) {
      console.error("Error starting new conversation:", error);
    } finally {
      setIsLoading(false);
      // Focus input after starting new conversation
      setTimeout(() => {
        if (inputRef.current && !showHistory) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      if (!isOpen && !hasActiveConversation) {
        setShouldWiggle(true);
        setTimeout(() => setShouldWiggle(false), 1500);
      }
    }, 120000); // 2 minutes

    return () => clearTimeout(wiggleTimer);
  }, [isOpen, hasActiveConversation]);

  // When chat is opened, load conversation if we have an ID but no messages
  useEffect(() => {
    if (isOpen && conversationId && messages.length === 0) {
      loadConversation(conversationId);
    }
    
    // Focus input field when chat is opened
    if (isOpen && !showHistory && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300); // Short delay to allow animation to complete
    }
  }, [isOpen, conversationId, messages.length, showHistory]);

  // Refocus input after sending a message
  useEffect(() => {
    if (!isLoading && inputRef.current && !showHistory && isOpen) {
      inputRef.current.focus();
    }
  }, [isLoading, showHistory, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    // Fetch latest conversations when opening history
    if (!showHistory) {
      fetchConversations();
    } else {
      // When closing history, focus the input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
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
      
      // Prepare request data with createNewConversation flag if needed
      const requestData = {
        message: userMessage,
        conversationId: conversationId,
      };

      // If no active conversation, include createNewConversation flag
      if (!hasActiveConversation) {
        requestData.createNewConversation = true;
      }

      const response = await axios.post(
        "/api/chatbot/message",
        requestData,
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
      if (response.data.conversationId) {
        setConversationId(response.data.conversationId);
        setHasActiveConversation(true);
        setShowWelcome(false);
      }

      // Refresh conversation list to update the preview
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Check if the error is due to no active conversation
      if (error.response?.data?.noActiveConversation) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: "assistant",
            content: "It seems you don't have an active conversation. Let me start a new one for you.",
          },
        ]);
        startNewConversation();
      } else {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            type: "assistant",
            content: "Sorry, I encountered an error. Please try again later.",
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      
      // Refocus input after message is sent
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Format date for conversation history
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Focus chat input when user presses / key outside of input
    if (e.key === '/' && document.activeElement !== inputRef.current && isOpen && !showHistory) {
      e.preventDefault();
      inputRef.current.focus();
    }
    
    // ESC key to close chat
    if (e.key === 'Escape' && isOpen) {
      toggleChat();
    }
  };

  // Add global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showHistory]);

  // Custom component to render markdown messages with proper styling
  const MarkdownMessage = ({ content, type }) => {
    // Define CSS classes based on message type
    const messageClasses = `p-3 rounded-2xl max-w-[85%] break-words leading-relaxed text-sm ${
      type === "user"
        ? "bg-blue-500 text-white self-end rounded-br-sm"
        : "bg-gray-200 text-gray-800 self-start rounded-bl-sm"
    } animate-fade-in-down`;

    // Determine text color for components inside ReactMarkdown
    const textColor = type === "user" ? "text-white" : "text-gray-800";

    return (
      <div className={messageClasses}>
        <div className={textColor}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mb-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-2">{children}</ol>
              ),
              li: ({ children }) => <li className="mb-1">{children}</li>,
              h1: ({ children }) => (
                <h1 className="text-lg font-bold mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold mb-2">{children}</h3>
              ),
              strong: ({ children }) => (
                <strong className="font-bold">{children}</strong>
              ),
              em: ({ children }) => <em className="italic">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-400 pl-2 italic my-2">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-gray-50">
      <span className="text-4xl mb-4">🧘</span>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        Mindbloom Meditation
      </h3>
      <p className="text-gray-600 mb-6 max-w-xs">
        Your personal meditation guide to help you find the right practice for your needs.
      </p>
      <button
        className="bg-blue-500 text-white rounded-full px-6 py-2 shadow-md hover:bg-blue-600 transition-colors"
        onClick={startNewConversation}
        disabled={isLoading}
      >
        {isLoading ? "Starting..." : "Start Meditating"}
      </button>
    </div>
  );

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
        className={`absolute bottom-20 right-0 w-[400px] h-[75vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 transform ${
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
              onClick={toggleHistory}
              disabled={isLoading}
            >
              <span className="mr-1">📚</span>
              History
            </button>
            <button
              className="bg-white text-blue-500 border-none rounded-md px-3 py-1 text-xs cursor-pointer transition-all duration-200 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              onClick={startNewConversation}
              disabled={isLoading}
            >
              <span className="mr-1">➕</span>
              New Chat
            </button>
          </div>
        </div>

        {/* Conversation History */}
        {showHistory ? (
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Conversation History
            </h4>
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No previous conversations found.
              </p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="p-3 bg-white rounded-lg shadow-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => loadConversation(conv.id)}
                  >
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(conv.updatedAt)}
                      </p>
                      {conv.Messages && conv.Messages.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {conv.Messages[0].content}
                        </p>
                      )}
                    </div>
                    <button
                      className="ml-2 text-red-500 hover:text-red-700 p-1"
                      onClick={(e) => deleteConversation(conv.id, e)}
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Messages area */
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 bg-gray-50">
            {showWelcome && messages.length === 0 ? (
              <WelcomeScreen />
            ) : (
              <>
                {messages.map((message, index) => (
                  <MarkdownMessage
                    key={index}
                    content={message.content}
                    type={message.type}
                  />
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
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input form - only show when not in history view */}
        {!showHistory && (
          <form
            className="flex p-3 bg-white border-t border-gray-200"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message... (or press '/' to focus)"
              disabled={isLoading}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-full text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              ref={inputRef}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-500 text-white border-none rounded-full px-4 py-2 ml-2 cursor-pointer transition-colors duration-200 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatbotWidget;