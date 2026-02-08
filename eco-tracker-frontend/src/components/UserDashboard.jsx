import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Trophy,
  Award,
  Bell,
  User,
  Leaf,
  Recycle,
} from "lucide-react";

import {
  notificationAPI,
  eventAPI,
  profileAPI,
  authAPI,
  ecopointAPI,
  recyclingAPI,
} from "../services/api";
import RecyclingComponent from "./recycling-component/RecyclingLogs";
import ProfileComponent from "./profile-component/profileComponent";
import AchievementsComponent from "./achievement/AchievementComponent";

function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("events");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [profile, setProfile] = useState({
    name: user?.name || "Student User",
    email: user?.email || "student@ecoclub.edu",
    eco_points: user?.eco_points || 0,
    role: user?.role || "student",
  });

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [registeredEventsCount, setRegisteredEventsCount] = useState(0);

  const [achievements] = useState([
    {
      id: 1,
      title: "Eco Warrior",
      description: "Attended 10 events",
      icon: "🌟",
    },
    {
      id: 2,
      title: "Tree Hugger",
      description: "Planted 50 trees",
      icon: "🌳",
    },
    {
      id: 3,
      title: "Clean Champion",
      description: "Completed 5 cleanups",
      icon: "🏆",
    },
  ]);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [ecoPointsStats, setEcoPointsStats] = useState({
    eco_points: 0,
    monthly_points: 0,
    weekly_points: 0,
    events_attended: 0,
    rank: 0,
  });

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Recycling log states
  const [recyclingLogs, setRecyclingLogs] = useState([]);
  const [loadingRecyclingLogs, setLoadingRecyclingLogs] = useState(false);

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

  // Fetch notifications, events, and profile on component mount
  useEffect(() => {
    fetchNotifications();
    fetchEvents();
    fetchProfile();
    fetchEcoPoints();
    fetchLeaderboard();
    fetchRecyclingLogs();
  }, []);

  // Refetch profile when window regains focus (after returning from EditProfile)
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
    };
    const handleProfileUpdate = () => {
      fetchProfile();
    };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await notificationAPI.getAllNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      // Fetch only events the student has joined
      const response = await eventAPI.getMyRegisteredEvents();
      console.log("Registered events response:", response);
      console.log("Registered events data:", response.events);
      setEvents(response.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await profileAPI.getProfile();
      setProfile(data.user);
      console.log("setProfile==", data.user);
      // Also update localStorage to keep it in sync
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...currentUser, ...data.user })
      );
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchRegisteredEvents = async () => {
    // This is now handled in fetchEvents
    // Kept for compatibility but does nothing
  };

  const fetchEcoPoints = async () => {
    try {
      const data = await ecopointAPI.getMyPoints();
      console.log("getMyPoints====", data);
      setEcoPointsStats(data);
      setRegisteredEventsCount(data.events_attended || 0);
    } catch (error) {
      console.error("Failed to fetch eco-points:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const data = await ecopointAPI.getLeaderboard(10);
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchRecyclingLogs = async () => {
    try {
      setLoadingRecyclingLogs(true);
      const data = await recyclingAPI.getMyLogs();
      console.log("recyclingLogs===>", data.logs);
      setRecyclingLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch recycling logs:", error);
    } finally {
      setLoadingRecyclingLogs(false);
    }
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
              <span className="text-gray-700 font-medium">{profile.name}</span>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
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
          '{profile.name.toUpperCase()}' DASHBOARD
        </h2>
        <p className="text-gray-600">User Dashboard ({profile.role})</p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "events"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab("eco-points")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "eco-points"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Leaf className="w-5 h-5" />
              <span>ECO-POINTS</span>
            </button>

            <button
              onClick={() => setActiveTab("achievement")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "achievement"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Award className="w-5 h-5" />
              <span>ACHIEVEMENT</span>
            </button>

            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "leaderboard"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>LEADERBOARD</span>
            </button>

            <button
              onClick={() => setActiveTab("notification")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "notification"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>NOTIFICATION</span>
            </button>

            <button
              onClick={() => setActiveTab("recycling")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "recycling"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Recycle className="w-5 h-5" />
              <span>RECYCLING</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "profile"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <User className="w-5 h-5" />
              <span>PROFILE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeTab === "events" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Joined Events
            </h3>
            {loadingEvents ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event, index) => {
                  const eventDate = new Date(
                    event.event_date
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  const eventTime = new Date(
                    event.event_date
                  ).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={event.event_id || event.id || index}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition border-2 border-green-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8 text-green-600" />
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          ✓ Joined
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {event.event_title || event.title || "Untitled Event"}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {eventDate}
                        </p>
                        <p>
                          <span className="font-semibold">Time:</span>{" "}
                          {eventTime}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {event.event_location ||
                            event.location ||
                            "Not specified"}
                        </p>
                        <p>
                          <span className="font-semibold">Status:</span>{" "}
                          <span className="capitalize text-green-600">
                            {event.event_status || event.status || "upcoming"}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          const eventId = event.event_id || event.id;
                          console.log(
                            "Attempting to fetch event with ID:",
                            eventId
                          );
                          console.log("Full event object:", event);

                          try {
                            // Fetch the full event details using the event ID
                            const eventData = await eventAPI.getEventById(
                              eventId
                            );
                            navigate("/event-detail", {
                              state: { event: eventData.event },
                            });
                          } catch (error) {
                            console.error(
                              "Failed to fetch event details:",
                              error
                            );
                            // Fallback: use the data we have
                            navigate("/event-detail", {
                              state: {
                                event: {
                                  id: eventId,
                                  title: event.event_title || event.title,
                                  event_date: event.event_date,
                                  location:
                                    event.event_location || event.location,
                                  description:
                                    event.event_description ||
                                    event.description,
                                  status: event.event_status || event.status,
                                  organizer_name: event.organizer_name,
                                },
                              },
                            });
                          }
                        }}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                      >
                        View Full Details
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  You haven't joined any events yet.
                </p>
                <p className="text-gray-500 mt-2">
                  Browse and register for events to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "eco-points" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h3 className="text-6xl font-bold text-green-600 mb-2">
                {ecoPointsStats.eco_points || 0}
              </h3>
              <p className="text-gray-600 text-lg">Total Eco-Points</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">This Month</p>
                <p className="text-3xl font-bold text-green-600">
                  {ecoPointsStats.monthly_points || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">This Week</p>
                <p className="text-3xl font-bold text-green-600">
                  {ecoPointsStats.weekly_points || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">Events Attended</p>
                <p className="text-3xl font-bold text-green-600">
                  {registeredEventsCount}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "achievement" && (

          <AchievementsComponent/>
          
          // <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          //   {achievements.map((achievement) => (
          //     <div
          //       key={achievement.id}
          //       className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
          //     >
          //       <div className="text-5xl mb-4 text-center">
          //         {achievement.icon}
          //       </div>
          //       <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
          //         {achievement.title}
          //       </h3>
          //       <p className="text-gray-600 text-sm text-center">
          //         {achievement.description}
          //       </p>
          //     </div>
          //   ))}
          // </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loadingLeaderboard ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Loading leaderboard...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-6 py-4 text-left">Rank</th>
                      <th className="px-6 py-4 text-left">Name</th>
                      <th className="px-6 py-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.length > 0 ? (
                      leaderboard.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`border-b hover:bg-gray-50 ${
                            entry.name === profile.name ? "bg-green-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`font-bold ${
                                entry.rank <= 3
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              #{entry.rank}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">
                            {entry.name}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-green-600">
                            {entry.eco_points || 0}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-8 text-center text-gray-600"
                        >
                          No leaderboard data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "notification" && (
          <div className="bg-white rounded-lg shadow-md divide-y">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Notifications
              </h3>
            </div>
            {loadingNotifications ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-gray-800 font-bold">{notif.title}</h4>
                      <p className="text-gray-700 mt-1">{notif.message}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "recycling" && (
          <div className="space-y-6">
            <RecyclingComponent
              loadingRecyclingLogs={loadingRecyclingLogs}
              recyclingLogs={recyclingLogs}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <ProfileComponent
            profile={profile}
            registeredEventsCount={registeredEventsCount}
            handleEditProfile={() =>
              navigate("/edit-profile", { state: { role: "student" } })
            }
          />
        )}

        {/* Back to Home */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/home")}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Back to Home
          </button>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
