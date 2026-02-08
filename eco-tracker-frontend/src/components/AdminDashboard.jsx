import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileCheck,
  Users,
  BarChart3,
  Settings,
  Calendar,
  Bell,
  User,
  Leaf,
  Send,
} from "lucide-react";
import {
  authAPI,
  eventAPI,
  notificationAPI,
  recyclingAPI,
  userAPI,
} from "../services/api";
import AdminUsersPage from "./AdminAllUsers";
import ReportComponent from "./report/ReportComponent";
import SystemMaintenance from "./system/SystemMaintenance";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("verify-logs");

  const userString = localStorage.getItem("user");

  const user = userString ? JSON.parse(userString) : null;
  console.log("admin user", user);
  const [username] = useState(user?.name || "Admin User");
  const [email] = useState(user?.email || "admin@ecoclub.edu");
  const [loading, setLoading] = useState(false);

  const [recyclingLogs, setRecyclingLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [approvingLog, setApprovingLog] = useState(null);
  const [ecoPointsInput, setEcoPointsInput] = useState({});

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [rejectingLog, setRejectingLog] = useState(null);

  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_users: 0,
    limit: 10,
    has_next: false,
    has_prev: false,
  });

  // Fetch events on component mount
  useEffect(() => {
    if (activeTab === "manage-events") {
      fetchEvents();
    } else if (activeTab === "verify-logs") {
      fetchRecyclingLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    const getAllSystemUsers = async () => {
      try {
        setLoading(true);
        const response = await userAPI.getAllUsers(
          pagination.current_page,
          pagination.limit
        );

        console.log("response---allusers--", response);
        setUsers(response.users || []);
        setPagination(response.pagination || pagination);
      } catch (error) {
        console.log("errors fetching users", error);
      } finally {
        setLoading(false);
      }
    };

    getAllSystemUsers();
  }, [pagination.current_page]);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const data = await eventAPI.getAllEvents();
      setEvents(data.events || []);
      setEventsError(null);
    } catch (err) {
      setEventsError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRecyclingLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await recyclingAPI.getPendingLogs();
      console.log("pending data----", data);
      setRecyclingLogs(data.logs || []);
      setLogsError(null);
    } catch (err) {
      setLogsError(err.message);
      console.error("Error fetching recycling logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      await eventAPI.adminAction(eventId, "approve");
      alert("Event approved successfully!");
      fetchEvents(); // Refresh events list
    } catch (err) {
      alert(`Error approving event: ${err.message}`);
    }
  };

  const handleCancelEvent = async (eventId) => {
    try {
      await eventAPI.adminAction(eventId, "cancel");
      alert("Event cancelled successfully!");
      fetchEvents(); // Refresh events list
    } catch (err) {
      alert(`Error cancelling event: ${err.message}`);
    }
  };

  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    priority: "normal",
  });

  const handleAnnouncementChange = (e) => {
    const { name, value } = e.target;
    setAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.message) {
      alert("Please enter both title and message.");
      return;
    }

    try {
      const data = await notificationAPI.sendToAllUsers({
        title: announcement.title,
        message: announcement.message,
        type: "admin",
      });
      alert(`Announcement sent to ${data.recipientCount} user(s)!`);
      setAnnouncement({ title: "", message: "", priority: "normal" });
    } catch (err) {
      alert(`Error sending announcement: ${err.message}`);
    }
  };

  const handleApprove = async (logId) => {
    try {
      if (
        !window.confirm("Are you sure you want to approve this recycling log?")
      ) {
        return;
      }

      const result = await recyclingAPI.approveLog(logId);

      alert(
        `Approved! ${result.eco_points_awarded} eco points awarded to user.`
      );

      // Refresh the logs list
      fetchRecyclingLogs();
    } catch (error) {
      alert(`Failed to approve: ${error.message}`);
    }
  };

  // const handleVerifyLog = async (logId) => {
  //   const points = ecoPointsInput[logId];
  //   if (!points || points <= 0) {
  //     alert("Please enter valid eco-points amount");
  //     return;
  //   }

  //   try {
  //     setApprovingLog(logId);
  //     await recyclingAPI.approveLog(logId, parseInt(points));
  //     alert("Recycling log approved successfully!");
  //     // Refresh the logs list
  //     fetchRecyclingLogs();
  //     // Clear the input
  //     setEcoPointsInput((prev) => ({ ...prev, [logId]: "" }));
  //   } catch (err) {
  //     alert(`Error approving log: ${err.message}`);
  //   } finally {
  //     setApprovingLog(null);
  //   }
  // };

  const handleRejectLog = async (logId) => {
    const reason = prompt("Enter reason for rejection (optional):");

    if (reason === null) return;

    try {
      setRejectingLog(logId);

      await recyclingAPI.rejectLog(logId, reason);

      alert("✅ Recycling log rejected successfully!");

      // Refresh the logs list
      await fetchRecyclingLogs();
    } catch (err) {
      console.error("Error rejecting log:", err);
      alert(`❌ Error rejecting log: ${err.message}`);
    } finally {
      setRejectingLog(null);
    }
  };

  const generateReport = () => {
    alert("Generating comprehensive waste collection report...");
  };

  const handleLogout = async () => {
    try {
      const response = authAPI.logout();
      console.log("response", response);
      alert(`Thank you!, ${"Account logged successfully"}!`);
      navigate("/");
    } catch (error) {
      const message = error.message;
      alert(`Error Please Try Again, ${message}!`);
    }
  };

  const handleViewEvents = (id, title, points, volunteerHours) => {
    // Show in an alert popup
    alert(
      `Event ID: ${id}\n` +
        `Event: ${title}\n` +
        `Event Eco point: ${points}\n` +
        `Volunteer Hour: ${volunteerHours}\n `
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-full">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Campus Eco-Club Sustainability Tracker
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">{user?.name}</span>
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>

              <button onClick={handleLogout}>
                <span className="text-gray-700 font-medium">{"Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          '{username.toUpperCase()}' DASHBOARD
        </h2>
        <p className="text-gray-600">System Administrator</p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab("verify-logs")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "verify-logs"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FileCheck className="w-5 h-5" />
              <span>VERIFY LOGS</span>
            </button>

            <button
              onClick={() => setActiveTab("manage-users")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "manage-users"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>USERS</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "reports"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>REPORTS</span>
            </button>

            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "system"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>SYSTEM</span>
            </button>

            <button
              onClick={() => setActiveTab("manage-events")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "manage-events"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab("announcements")}
              className={`flex items-center justify-center space-x-2 px-3 py-3 rounded-lg font-semibold transition text-sm ${
                activeTab === "announcements"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>ANNOUNCE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "verify-logs" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">
                Verify Recycling Logs
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Review and approve student recycling submissions
              </p>
            </div>
            <div className="overflow-x-auto">
              {loadingLogs ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                  <p className="mt-4 text-gray-600">
                    Loading recycling logs...
                  </p>
                </div>
              ) : logsError ? (
                <div className="p-12 text-center">
                  <p className="text-red-600">{logsError}</p>
                  <button
                    onClick={fetchRecyclingLogs}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : recyclingLogs.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-600">
                    No pending recycling logs to verify.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Weight (kg)
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Description
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Volunteer Hours
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Image
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Eco-Points
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recyclingLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">
                              {log.user_name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {log.user_role}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-800 capitalize">
                          {log.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {log.weight} kg
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.description || "No description"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.volunteer_hours || 0}
                        </td>
                        <td className="px-6 py-4">
                          {log.image_url ? (
                            <img
                              src={`http://localhost:5001${log.image_url}`}
                              alt="Recycling proof"
                              className="h-16 w-16 object-cover rounded border"
                            />
                          ) : (
                            <span className="text-gray-400">No image</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {log.event_eco_points || 0}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(log.id)}
                              disabled={approvingLog === log.id}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {approvingLog === log.id
                                ? "Approving..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={() => handleRejectLog(log.id)}
                              disabled={
                                rejectingLog === log.id ||
                                approvingLog === log.id
                              }
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() =>
                                handleViewEvents(
                                  log.event_id,
                                  log.event_title,
                                  log.event_eco_points,
                                  log.volunteer_hours
                                )
                              }
                              disabled={approvingLog === log.id}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {"View"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === "manage-users" && <AdminUsersPage />}

        {activeTab === "reports" && <ReportComponent />}

        {activeTab === "system" && <SystemMaintenance />}

        {activeTab === "manage-events" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">
                Manage All Events
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Oversee and approve all campus events
              </p>
            </div>
            {loadingEvents ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">Loading events...</p>
              </div>
            ) : eventsError ? (
              <div className="p-8 text-center">
                <p className="text-red-600">Error: {eventsError}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">No events found.</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Organized by: {event.organizer_name} •{" "}
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Location: {event.location || "N/A"} • Type:{" "}
                          {event.event_type}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          event.status === "completed"
                            ? "bg-gray-100 text-gray-700"
                            : event.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : event.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : event.status === "ongoing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {event.participant_count || 0} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Points: {event.eco_points_reward}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          navigate(`/event-detail`, { state: { event } })
                        }
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                      >
                        View Details
                      </button>
                      {event.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCancelEvent(event.id)}
                            className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                          >
                            Cancel Event
                          </button>
                        </>
                      )}
                      {event.status !== "pending" &&
                        event.status !== "cancelled" &&
                        event.status !== "completed" && (
                          <span className="px-4 py-2 text-sm text-gray-500 italic">
                            Already {event.status}
                          </span>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Send System Announcement
            </h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={announcement.title}
                  onChange={handleAnnouncementChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={announcement.priority}
                  onChange={handleAnnouncementChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  name="message"
                  value={announcement.message}
                  onChange={handleAnnouncementChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter announcement message"
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendAnnouncement}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send to All Users
                </button>
                {/* <button className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold">
                  Preview
                </button> */}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Back to Home */}
    </div>
  );
}

export default AdminDashboard;
