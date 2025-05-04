import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import MeditationType from "./pages/MeditationType";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/Auth/ResetPassword";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Community from "./pages/Community";
import StoryDetail from "./pages/StoryDetail";
import HashtagPage from "./pages/HashtagPage";
import EditStoryModal from "./components/community/EditStoryModal";
import MyStories from "./pages/MyStories";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes (without MainLayout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/meditation/:id" element={<MeditationType />} />
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            {/* Community Routes */}
            <Route path="/community" element={<Community />} />
            <Route path="/community/story/:id" element={<StoryDetail />} />
            <Route
              path="/community/hashtag/:hashtag"
              element={<HashtagPage />}
            />
            <Route path="/community/edit/:id" element={<EditStoryModal />} />
            <Route path="/my-stories" element={<MyStories />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
