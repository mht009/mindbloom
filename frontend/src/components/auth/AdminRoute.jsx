// src/components/auth/AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminRoute = ({ redirectPath = "/" }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Check if user exists and has admin role
  if (!user || user.role !== "admin") {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;