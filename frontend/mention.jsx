import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// CommentInput component with mention functionality
const CommentInput = ({ storyId, onCommentAdded }) => {
  const [comment, setComment] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionPosition, setMentionPosition] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Handle text input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setComment(newValue);
    
    // Get cursor position
    const cursorPos = e.target.selectionStart;
    setCursorPosition(cursorPos);
    
    // Check if we need to show mention suggestions
    if (isMentionTriggered(newValue, cursorPos)) {
      const lastAt = newValue.lastIndexOf('@', cursorPos - 1);
      const query = newValue.substring(lastAt + 1, cursorPos);
      setMentionQuery(query);
      setMentionPosition(lastAt);
      
      if (query.length > 0) {
        searchUsers(query);
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  // Check if mention is triggered
  const isMentionTriggered = (text, cursorPos) => {
    // Find the last @ before cursor
    const lastAt = text.lastIndexOf('@', cursorPos - 1);
    
    // Check if @ exists and is valid (preceded by space or is at start)
    if (lastAt === -1) return false;
    if (lastAt > 0 && text[lastAt - 1] !== ' ' && text[lastAt - 1] !== '\n') return false;
    
    // Check if there's a space after @ before cursor
    const textBetween = text.substring(lastAt + 1, cursorPos);
    return !textBetween.includes(' ');
  };

  // Search for users
  const searchUsers = async (query) => {
    try {
      const token = localStorage.getItem('token'); // Assuming token is stored in localStorage
      const response = await axios.get(`/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentionUsers(response.data.users);
    } catch (error) {
      console.error('Error searching for users:', error);
    }
  };

  // Insert mention at cursor position
  const insertMention = (username) => {
    const before = comment.substring(0, mentionPosition);
    const after = comment.substring(cursorPosition);
    const newComment = `${before}@${username} ${after}`;
    setComment(newComment);
    
    // Focus back on textarea and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionPosition + username.length + 2; // @ + username + space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 0);
    
    setShowMentionSuggestions(false);
  };

  // Submit comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/stories/${storyId}/comments`,
        { body: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setComment('');
      if (onCommentAdded) {
        onCommentAdded(response.data.comment);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    }
  };

  return (
    <div className="comment-input-container">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={handleChange}
            placeholder="Write a comment..."
            className="w-full p-2 border rounded"
            rows={3}
          />
          
          {showMentionSuggestions && mentionUsers.length > 0 && (
            <div className="absolute bg-white shadow-lg border rounded mt-1 max-h-60 overflow-y-auto z-10 w-full">
              {mentionUsers.map((user) => (
                <div
                  key={user.userId}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                  onClick={() => insertMention(user.username)}
                >
                  {user.avatar && (
                    <img
                      src={user.avatar}
                      className="w-6 h-6 rounded-full mr-2"
                      alt={user.username}
                    />
                  )}
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Post Comment
        </button>
      </form>
    </div>
  );
};

// Component to display mentions where the user was tagged
const UserMentions = () => {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(null);

  useEffect(() => {
    fetchMentions();
  }, []);

  const fetchMentions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/mentions?limit=10';
      if (lastTimestamp) {
        url += `&lastFetchedTimestamp=${lastTimestamp}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMentions(prev => [...prev, ...response.data.mentions]);
      setHasMore(response.data.hasMore);
      setLastTimestamp(response.data.lastTimestamp);
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (mentionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/mentions/read', 
        { mentionIds: [mentionId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state to mark as read
      setMentions(prev => 
        prev.map(mention => 
          mention.id === mentionId ? { ...mention, read: true } : mention
        )
      );
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  };

  const navigateToMention = (mention) => {
    // Mark as read
    if (!mention.read) {
      markAsRead(mention.id);
    }
    
    // Navigate based on type
    if (mention.type === 'story') {
      window.location.href = `/stories/${mention.sourceId}`;
    } else if (mention.type === 'comment') {
      window.location.href = `/stories/${mention.content.storyId}#comment-${mention.sourceId}`;
    }
  };

  return (
    <div className="mentions-container">
      <h2 className="text-xl font-bold mb-4">Mentions</h2>
      
      {mentions.length === 0 && !loading ? (
        <p>No mentions found.</p>
      ) : (
        <div className="space-y-4">
          {mentions.map(mention => (
            <div 
              key={mention.id} 
              className={`p-4 border rounded ${!mention.read ? 'bg-blue-50' : ''}`}
              onClick={() => navigateToMention(mention)}
            >
              <div className="flex items-center mb-2">
                <span className="font-medium mr-1">{mention.mentionedBy.displayName}</span>
                <span className="text-gray-500">mentioned you in a {mention.type}</span>
                <span className="ml-auto text-sm text-gray-500">
                  {new Date(mention.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              {mention.type === 'story' ? (
                <div>
                  <div className="font-medium">{mention.content.title}</div>
                  <div className="text-gray-700 line-clamp-2">{mention.content.body}</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-500">On story: {mention.content.storyTitle}</div>
                  <div className="text-gray-700 line-clamp-2">{mention.content.body}</div>
                </div>
              )}
              
              {!mention.read && (
                <div className="mt-2 flex justify-end">
                  <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">New</span>
                </div>
              )}
            </div>
          ))}
          
          {hasMore && (
            <button 
              onClick={fetchMentions}
              className="w-full py-2 text-blue-500 hover:bg-blue-50 rounded"
            >
              Load more
            </button>
          )}
          
          {loading && <p className="text-center py-2">Loading...</p>}
        </div>
      )}
    </div>
  );
};

// Badge component to show unread mentions count in navigation
const MentionsBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Initial fetch
    fetchUnreadCount();
    
    // Set up interval to check periodically
    const intervalId = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/mentions/count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread mentions count:', error);
    }
  };
  
  if (unreadCount === 0) return null;
  
  return (
    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
      {unreadCount}
    </span>
  );
};

export { CommentInput, UserMentions, MentionsBadge };