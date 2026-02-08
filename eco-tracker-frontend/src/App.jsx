import { Routes, Route } from "react-router-dom";
import Welcome from "./components/Welcome";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import UserDashboard from "./components/UserDashboard";
import EventsPage from "./components/EventsPage";
import AdminDashboard from "./components/AdminDashboard";
import OrganizerDashboard from "./components/OrganizerDashboard";
import VolunteerDashboard from "./components/VolunteerDashboard";
import EditProfile from "./components/EditProfile";
import AdminEditUser from "./components/AdminEditUser";
import EventDetail from "./components/EventDetail";
import ProtectedRoute from "./components/helper/protectedRoute";
import ForgotPassword from "./components/Forgot-password";

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Public — no login required */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* All roles (student, volunteer, organizer, admin) */}
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/event-detail" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />

        {/* Student only */}
        <Route path="/user-dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

        {/* Student + Volunteer only */}
        <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />

        {/* Organizer only */}
        <Route path="/organizer-dashboard" element={<ProtectedRoute><OrganizerDashboard /></ProtectedRoute>} />

        {/* Admin only */}
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin-edit-user" element={<ProtectedRoute><AdminEditUser /></ProtectedRoute>} />

        {/* Volunteer only */}
        <Route path="/volunteer-dashboard" element={<ProtectedRoute><VolunteerDashboard /></ProtectedRoute>} />

        {/* Student + Volunteer + Organizer (not admin) */}
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      </Routes>
    </div> 
  );
}

export default App;