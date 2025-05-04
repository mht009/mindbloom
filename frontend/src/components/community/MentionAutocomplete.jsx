// src/components/community/MentionAutocomplete.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import UserAvatar from "./UserAvatar";

const MentionAutocomplete = ({
  value,
  onChange,
  placeholder = "Write something...",
  rows = 3,
  className = "",
}) => {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef(null);
  const resultListRef = useRef(null);

  // Search for mentions when the query changes
  useEffect(() => {
    if (mentionQuery.length > 0) {
      fetchMentionSuggestions(mentionQuery);
    } else {
      setMentionResults([]);
    }
  }, [mentionQuery]);

  // Close mentions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        resultListRef.current &&
        !resultListRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setShowMentions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch mention suggestions from the API
  const fetchMentionSuggestions = async (query) => {
    try {
      const response = await axios.get(`/api/users/mentions?query=${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.data && response.data.suggestions) {
        setMentionResults(response.data.suggestions);
        setSelectedIndex(0); // Reset selection to first item
      }
    } catch (error) {
      console.error("Error fetching mention suggestions:", error);
      setMentionResults([]);
    }
  };

  // Handle text input and detect @ mentions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(position);

    // Check for mention pattern (@username) before cursor
    const textBeforeCursor = newValue.substring(0, position);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  // Insert the selected mention into the text
  const insertMention = (username) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);

    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Replace the @partial with @username
      const newText =
        textBeforeCursor.substring(0, lastAtIndex) +
        `@${username} ` +
        textAfterCursor;

      onChange(newText);

      // Calculate new cursor position after the inserted mention
      const newPosition = lastAtIndex + username.length + 2; // +2 for @ and space

      // Set cursor position after insertion
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    }

    setShowMentions(false);
  };

  // Handle keyboard navigation in mention results
  const handleKeyDown = (e) => {
    if (!showMentions || mentionResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, mentionResults.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (mentionResults[selectedIndex]) {
          insertMention(mentionResults[selectedIndex].username);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowMentions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      />

      {showMentions && mentionResults.length > 0 && (
        <div
          ref={resultListRef}
          className="absolute z-10 mt-1 w-full max-w-md bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200"
        >
          <ul>
            {mentionResults.map((user, index) => (
              <li
                key={user.userId}
                className={`px-3 py-2 cursor-pointer flex items-center ${
                  index === selectedIndex ? "bg-indigo-50" : "hover:bg-gray-50"
                }`}
                onClick={() => insertMention(user.username)}
              >
                <UserAvatar
                  userId={user.userId}
                  className="w-6 h-6 rounded-full mr-2"
                />
                <div>
                  <span className="font-medium text-gray-800">
                    {user.username}
                  </span>
                  {user.displayName !== user.username && (
                    <span className="text-gray-500 text-xs ml-2">
                      {user.displayName}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">Type @ to mention users</p>
    </div>
  );
};

export default MentionAutocomplete;
