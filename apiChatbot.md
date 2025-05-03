# Mindbloom Meditation Chatbot API Documentation

## Overview

The Mindbloom Meditation Chatbot API provides a conversational interface for users to receive personalized meditation recommendations, guidance, and information. The chatbot uses a combination of rule-based logic for assessment and Claude AI for more complex meditation questions.

## Data Retention Policy

All conversation data is automatically deleted after 30 days to ensure user privacy and data minimization.

## Authentication

All protected endpoints require a valid JWT token provided in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Rate Limiting

To prevent abuse, the chatbot API is rate-limited to 50 requests per IP address per 5-minute window.

## API Endpoints

### Send Message to Chatbot

Send a user message to the chatbot and receive a response.

```
POST /api/chatbot/message
```

**Authentication Required**: Yes

**Request Body**:

```json
{
  "message": "I'd like to learn about mindfulness meditation"
}
```

**Response**:

```json
{
  "message": "Mindfulness meditation involves paying attention to the present moment without judgment. It focuses on developing awareness of your thoughts, feelings, and sensations as they arise, then letting them pass without attachment or analysis. Would you like me to guide you through how to practice mindfulness meditation?",
  "conversationId": 123
}
```

**Usage Example**:

```javascript
// Using fetch
const response = await fetch("https://your-api.com/api/chatbot/message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your_jwt_token",
  },
  body: JSON.stringify({
    message: "I'd like to learn about mindfulness meditation",
  }),
});
const data = await response.json();
console.log(data.message);
```

### Get All User Conversations

Retrieve a list of all conversations for the authenticated user.

```
GET /api/chatbot/conversations
```

**Authentication Required**: Yes

**Response**:

```json
[
  {
    "id": 123,
    "userId": 456,
    "title": "Meditation Session",
    "isActive": true,
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-05-15T10:45:00Z"
  },
  {
    "id": 124,
    "userId": 456,
    "title": "Sleep Meditation",
    "isActive": false,
    "createdAt": "2023-05-10T20:30:00Z",
    "updatedAt": "2023-05-10T20:55:00Z"
  }
]
```

**Usage Example**:

```javascript
// Using axios
const axios = require("axios");

const getConversations = async () => {
  try {
    const response = await axios.get(
      "https://your-api.com/api/chatbot/conversations",
      {
        headers: {
          Authorization: "Bearer your_jwt_token",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching conversations:", error);
  }
};
```

### Get Specific Conversation

Retrieve a specific conversation with all its messages.

```
GET /api/chatbot/conversation/:id
```

**Authentication Required**: Yes

**URL Parameters**:

- `id`: Conversation ID

**Response**:

```json
{
  "conversation": {
    "id": 123,
    "userId": 456,
    "title": "Meditation Session",
    "isActive": true,
    "createdAt": "2023-05-15T10:30:00Z",
    "updatedAt": "2023-05-15T10:45:00Z"
  },
  "messages": [
    {
      "id": 789,
      "conversationId": 123,
      "content": "I'd like to learn about mindfulness meditation",
      "type": "user",
      "createdAt": "2023-05-15T10:30:00Z"
    },
    {
      "id": 790,
      "conversationId": 123,
      "content": "Mindfulness meditation involves paying attention to the present moment without judgment...",
      "type": "assistant",
      "createdAt": "2023-05-15T10:30:05Z"
    }
  ]
}
```

**Usage Example**:

```javascript
// Using fetch
const getConversation = async (conversationId) => {
  try {
    const response = await fetch(
      `https://your-api.com/api/chatbot/conversation/${conversationId}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer your_jwt_token",
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Start New Conversation

Create a new conversation with the chatbot.

```
POST /api/chatbot/conversation/new
```

**Authentication Required**: Yes

**Response**:

```json
{
  "conversation": {
    "id": 125,
    "userId": 456,
    "title": "Meditation Session",
    "isActive": true,
    "createdAt": "2023-05-16T09:00:00Z",
    "updatedAt": "2023-05-16T09:00:00Z"
  },
  "message": "Welcome to Mindbloom Meditation! I'm here to help you discover the right meditation practice for your needs. Would you like to take a quick assessment to find the best meditation type for you?"
}
```

**Usage Example**:

```javascript
// Using axios
const axios = require("axios");

const startNewConversation = async () => {
  try {
    const response = await axios.post(
      "https://your-api.com/api/chatbot/conversation/new",
      {},
      {
        headers: {
          Authorization: "Bearer your_jwt_token",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error starting new conversation:", error);
  }
};
```

### Update Conversation

Update conversation properties such as title or active status.

```
PUT /api/chatbot/conversation/:id
```

**Authentication Required**: Yes

**URL Parameters**:

- `id`: Conversation ID

**Request Body**:

```json
{
  "title": "Evening Meditation",
  "isActive": true
}
```

**Response**:

```json
{
  "id": 123,
  "userId": 456,
  "title": "Evening Meditation",
  "isActive": true,
  "createdAt": "2023-05-15T10:30:00Z",
  "updatedAt": "2023-05-16T15:20:00Z"
}
```

**Usage Example**:

```javascript
// Using fetch
const updateConversation = async (conversationId, title, isActive) => {
  try {
    const response = await fetch(
      `https://your-api.com/api/chatbot/conversation/${conversationId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_jwt_token",
        },
        body: JSON.stringify({
          title,
          isActive,
        }),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Delete Conversation

Delete a conversation and all its messages.

```
DELETE /api/chatbot/conversation/:id
```

**Authentication Required**: Yes

**URL Parameters**:

- `id`: Conversation ID

**Response**:

```json
{
  "message": "Conversation deleted successfully"
}
```

**Usage Example**:

```javascript
// Using axios
const axios = require("axios");

const deleteConversation = async (conversationId) => {
  try {
    const response = await axios.delete(
      `https://your-api.com/api/chatbot/conversation/${conversationId}`,
      {
        headers: {
          Authorization: "Bearer your_jwt_token",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting conversation:", error);
  }
};
```

### Start Meditation Assessment

Start the guided meditation assessment process to get personalized recommendations.

```
POST /api/chatbot/start-assessment
```

**Authentication Required**: Yes

**Response**:

```json
{
  "message": "What is your level of experience with meditation?\n\n1. I'm completely new to meditation\n2. I've tried it a few times but am not consistent\n3. I meditate regularly and have for some time\n\nPlease select the option that best applies to you by entering the corresponding number.",
  "conversationId": 125
}
```

**Usage Example**:

```javascript
// Using fetch
const startAssessment = async () => {
  try {
    const response = await fetch(
      "https://your-api.com/api/chatbot/start-assessment",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer your_jwt_token",
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Get All Meditation Types

Get information about all available meditation types.

```
GET /api/chatbot/meditation-types
```

**Authentication Required**: No

**Response**:

```json
{
  "mindfulness": {
    "name": "Mindfulness Meditation",
    "description": "Mindfulness meditation involves paying attention to the present moment without judgment...",
    "benefits": [
      "Reduces stress and anxiety",
      "Improves focus and attention",
      "..."
    ],
    "guide": "1. Find a quiet place and sit in a comfortable position with your back straight..."
  },
  "lovingKindness": {
    "name": "Loving-Kindness Meditation",
    "..."
  },
  "..."
}
```

**Usage Example**:

```javascript
// Using axios
const axios = require("axios");

const getMeditationTypes = async () => {
  try {
    const response = await axios.get(
      "https://your-api.com/api/chatbot/meditation-types"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching meditation types:", error);
  }
};
```

### Get Specific Meditation Type

Get detailed information about a specific meditation type.

```
GET /api/chatbot/meditation-type/:type
```

**Authentication Required**: No

**URL Parameters**:

- `type`: Meditation type identifier (e.g., "mindfulness", "lovingKindness")

**Response**:

```json
{
  "name": "Mindfulness Meditation",
  "description": "Mindfulness meditation involves paying attention to the present moment without judgment. It focuses on developing awareness of your thoughts, feelings, and sensations as they arise, then letting them pass without attachment or analysis.",
  "benefits": [
    "Reduces stress and anxiety",
    "Improves focus and attention",
    "Enhances emotional regulation",
    "Increases self-awareness",
    "Helps manage negative thoughts"
  ],
  "guide": "1. Find a quiet place and sit in a comfortable position with your back straight.\n2. Close your eyes or maintain a soft gaze focused slightly downward.\n3. Begin by bringing attention to your breath. Notice the sensation of breathing in and out.\n4. When your mind wanders (which is natural), gently redirect your attention back to your breath without judgment.\n5. Gradually expand your awareness to include bodily sensations, sounds, thoughts, and emotions.\n6. Observe these experiences with curiosity and without judgment, letting them come and go.\n7. Start with 5 minutes daily, gradually increasing to 20 minutes as you become more comfortable."
}
```

**Usage Example**:

```javascript
// Using fetch
const getMeditationType = async (type) => {
  try {
    const response = await fetch(
      `https://your-api.com/api/chatbot/meditation-type/${type}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
};
```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "message": "Error message describing what went wrong"
}
```

Common error status codes:

- `400` - Bad Request (Missing required fields)
- `401` - Unauthorized (Missing or invalid token)
- `403` - Forbidden (Token is valid but lacks permission)
- `404` - Not Found (Resource doesn't exist)
- `429` - Too Many Requests (Rate limit exceeded)
- `500` - Server Error (Something went wrong on the server)

## Frontend Integration Example

Here's a simple React component example that demonstrates how to integrate the meditation chatbot into a frontend application:

```jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const ChatbotInterface = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Get user's conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "https://your-api.com/api/chatbot/conversations",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setConversations(response.data);

        // If there's at least one conversation, load the most recent one
        if (response.data.length > 0) {
          const activeConversation =
            response.data.find((c) => c.isActive) || response.data[0];
          loadConversation(activeConversation.id);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    fetchConversations();
  }, []);

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (conversationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://your-api.com/api/chatbot/conversation/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.messages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
      setLoading(false);
    }
  };

  const startNewConversation = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://your-api.com/api/chatbot/conversation/new",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add new conversation to the list
      setConversations([response.data.conversation, ...conversations]);

      // Set it as current and load welcome message
      setCurrentConversation(response.data.conversation);
      setMessages([
        {
          id: Date.now(),
          conversationId: response.data.conversation.id,
          content: response.data.message,
          type: "assistant",
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error starting new conversation:", error);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !currentConversation) return;

    // Add user message to UI immediately
    const userMessage = {
      id: Date.now(),
      conversationId: currentConversation.id,
      content: inputMessage,
      type: "user",
      createdAt: new Date().toISOString(),
    };
    setMessages([...messages, userMessage]);
    setInputMessage("");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://your-api.com/api/chatbot/message",
        {
          message: inputMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add chatbot response to messages
      const botResponse = {
        id: Date.now() + 1,
        conversationId: currentConversation.id,
        content: response.data.message,
        type: "assistant",
        createdAt: new Date().toISOString(),
      };
      setMessages([...messages, userMessage, botResponse]);
      setLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
    }
  };

  const startAssessment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // If no current conversation, create one first
      if (!currentConversation) {
        await startNewConversation();
      }

      const response = await axios.post(
        "https://your-api.com/api/chatbot/start-assessment",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Add assessment messages to the conversation
      setMessages([
        ...messages,
        {
          id: Date.now(),
          conversationId: response.data.conversationId,
          content: "I'd like to start the meditation assessment.",
          type: "user",
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          conversationId: response.data.conversationId,
          content: response.data.message,
          type: "assistant",
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error starting assessment:", error);
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="sidebar">
        <button onClick={startNewConversation}>New Conversation</button>
        <button onClick={startAssessment}>Start Meditation Assessment</button>
        <div className="conversation-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${
                currentConversation?.id === conv.id ? "active" : ""
              }`}
              onClick={() => loadConversation(conv.id)}
            >
              {conv.title}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        <div className="messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={loading || !currentConversation}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim() || !currentConversation}
          >
            Send
          </button>
        </form>

        {loading && <div className="loading-indicator">Loading...</div>}
      </div>
    </div>
  );
};

export default ChatbotInterface;
```

## Data Considerations

1. **Privacy**: All conversations are automatically deleted after 30 days.
2. **Performance**: Large conversations may impact performance; consider implementing pagination for messages.
3. **AI Costs**: The chatbot uses the Claude API which has usage costs. Monitor usage and implement additional rate limiting if needed.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure your JWT token is valid and properly formatted in the Authorization header.
2. **Rate Limiting**: If you receive a 429 error, you've exceeded the rate limit. Wait before making more requests.
3. **Empty Responses**: If you receive empty responses from the chatbot, check your Claude API configuration and ensure the service is properly set up.

## Support

For issues or questions regarding the Meditation Chatbot API, please contact the development team at developer@mindbloom.com.
