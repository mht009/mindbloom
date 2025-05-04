// src/components/layout/MainLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "../../context/AuthContext";
import ChatbotWidget from "../chatbot/ChatbotWidget";

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {user && <ChatbotWidget />}
    </div>
  );
};

export default MainLayout;
