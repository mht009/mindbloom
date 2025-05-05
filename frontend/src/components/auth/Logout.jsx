// src/components/LogoutButton.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LogoutButton = ({ className, onClick, children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    // Call any additional onClick handler first (e.g., for closing dropdowns)
    if (onClick) {
      onClick();
    }

    try {
      // Call the logout function from auth context
      await logout();
      // Navigate to home page after logout
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className || "text-red-600 hover:text-red-800 font-medium"}
    >
      {children || "Logout"}
    </button>
  );
};

export default LogoutButton;
