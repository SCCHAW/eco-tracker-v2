import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Bell,
  User,
  Leaf,
  Clock,
  History,
  CheckCircle,
} from "lucide-react";
import {
  authAPI,
  eventAPI,
  notificationAPI,
  profileAPI,
  recyclingAPI,
} from "../services/api";
import RecyclingComponent from "./recycling-component/RecyclingLogs";
import PastEventVolunteerHours from "./past-event-component/PastEventVolunteerHours";
import ProfileComponent from "./profile-component/profileComponent";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("view-events");
  const [recyclingLogs, setRecyclingLogs] = useState([]);
  const [loadingRecyclingLogs, setLoadingRecyclingLogs] = useState(false);
  const [loadingPastEventLogs, setLoadingPastEventLogs] = useState(false);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [profile, setProfile] = useState({
    name: user?.name || "Volunteer User",
    email: user?.email || "volunteer@ecoclub.org",
    eco_points: user?.eco_points || 0,
    role: user?.role || "volunteer",
  });

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

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [totalVolunteerHours, setTotalVolunteerHours] = useState(0);

  // Fetch notifications and profile on component mount
  useEffect(() => {
    fetchNotifications();
    fetchProfile();
    fetchEvents();
    fetchRegisteredEvents();
    fetchRecyclingLogs();
  }, []);

  // Refetch profile when window regains focus (after returning from EditProfile)
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
      fetchEvents(); // Refetch events to update available slots
      fetchRegisteredEvents();
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

  const fetchRecyclingLogs = async () => {
    try {
      setLoadingRecyclingLogs(true);
      const data = await recyclingAPI.getMyLogs();
      console.log("recyclingLogs===>", data.logs);
      setRecyclingLogs(data.logs || []);
      const totalPoints = data.logs.reduce(
        (sum, log) => sum + (log.volunteer_hours || 0),
        0
      );

      console.log("totalPoints==>", totalPoints);
      setTotalVolunteerHours(totalPoints);
    } catch (error) {
      console.error("Failed to fetch recycling logs:", error);
    } finally {
      setLoadingRecyclingLogs(false);
    }
  };

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

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      // Fetch all available events (upcoming and ongoing)
      const data = await eventAPI.getAllEvents({ upcoming: true });
      // Filter to only show approved events
      const availableEvents = (data.events || []).filter(
        (event) =>
          event.status === "approved" ||
          event.status === "upcoming" ||
          event.status === "ongoing"
      );
      console.log("All upcoming events:", availableEvents);
      setUpcomingEvents(availableEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const data = await eventAPI.getMyRegisteredEvents();
      console.log("Registered events:", data.events);
      setRegisteredEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch registered events:", error);
    }
  };

  const [volunteerHours, setVolunteerHours] = useState({
    event: "",
    date: "",
    hours: "",
    description: "",
  });

  const totalHours = registeredEvents.length * 3; // Estimate 3 hours per event

  const handleHoursChange = (e) => {
    const { name, value } = e.target;
    setVolunteerHours((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogHours = () => {
    alert(`Volunteer hours logged for "${volunteerHours.event}"!`);
    setVolunteerHours({ event: "", date: "", hours: "", description: "" });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = () => {
    navigate("/edit-profile", { state: { role: "volunteer" } });
  };

  const handleRegisterEvent = (eventId) => {
    alert(`Successfully registered for event #${eventId}!`);
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
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
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
        <p className="text-gray-600">Volunteer Dashboard</p>
        <div className="mt-4 bg-blue-50 rounded-lg p-4 inline-block">
          <p className="text-sm text-gray-600">Total Volunteer Hours</p>
          <p className="text-3xl font-bold text-blue-600">
            {totalVolunteerHours} hours
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab("view-events")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "view-events"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>VIEW EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab("joined-events")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "joined-events"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>JOINED EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab("log-hours")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "log-hours"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>RECYCLING LOGS</span>
            </button>

            <button
              onClick={() => setActiveTab("past-events")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "past-events"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <History className="w-5 h-5" />
              <span>PAST EVENTS</span>
            </button>

            <button
              onClick={() => setActiveTab("notification")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "notification"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>NOTIFICATIONS</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white"
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
        {activeTab === "view-events" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              All Available Events
            </h3>
            {loadingEvents ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading events...</p>
              </div>
            ) : (
              (() => {
                // Filter out events that the volunteer has already joined
                const unregisteredEvents = upcomingEvents.filter(
                  (event) =>
                    !registeredEvents.some((re) => re.event_id === event.id)
                );

                return unregisteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unregisteredEvents.map((event) => {
                      const eventDate = new Date(
                        event.event_date
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      const availableSlots = event.max_participants
                        ? event.max_participants -
                          (event.participant_count || 0)
                        : "Open";

                      return (
                        <div
                          key={event.id}
                          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Calendar className="w-8 h-8 text-blue-600" />
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                              {availableSlots === "Open"
                                ? "Open"
                                : `${availableSlots} slots`}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">
                            {event.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600 mb-4">
                            <p>
                              <span className="font-semibold">Date:</span>{" "}
                              {eventDate}
                            </p>
                            <p>
                              <span className="font-semibold">Location:</span>{" "}
                              {event.location}
                            </p>
                            <p>
                              <span className="font-semibold">Status:</span>{" "}
                              <span className="capitalize">{event.status}</span>
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              navigate("/event-detail", { state: { event } })
                            }
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                          >
                            View & Register
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">
                      No events available to join.
                    </p>
                    <p className="text-gray-500 mt-2">
                      You have joined all available events or check back soon
                      for new events!
                    </p>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {activeTab === "joined-events" && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Joined Events
            </h3>
            {registeredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map((event) => {
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
                          ✓ Registered
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-800 mb-3">
                        {event.event_title || event.title || "Untitled Event"}
                      </h4>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                          <span className="capitalize text-blue-600">
                            {event.event_status || event.status || "upcoming"}
                          </span>
                        </p>
                        {(event.event_description || event.description) && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {event.event_description || event.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          const eventId = event.event_id || event.id;
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
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
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
                  You haven't registered for any events yet.
                </p>
                <p className="text-gray-500 mt-2">
                  Browse available events in the "VIEW EVENTS" tab!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "log-hours" && (
          <div className="space-y-6">
            <RecyclingComponent
              loadingRecyclingLogs={loadingRecyclingLogs}
              recyclingLogs={recyclingLogs}
              headerColor={"bg-blue-600"}
            />
          </div>
        )}

        {activeTab === "past-events" && (
          <div className="space-y-6">
            <PastEventVolunteerHours
              totalVolunteerHours={totalVolunteerHours}
              registeredEvents={recyclingLogs}
              loadingPastEventLogs={loadingPastEventLogs}
              headerColor={"bg-blue-600"}
            />
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
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Bell className="w-5 h-5 text-blue-600" />
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

        {activeTab === "profile" && (
          <ProfileComponent
            profile={profile}
            totalVolunteerHours={totalVolunteerHours}
            handleEditProfile={handleUpdateProfile}
          />
        )}
      </main>

      {/* Back to Home */}
      <div className="text-center pb-8">
        <button
          onClick={() => navigate("/home")}
          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default VolunteerDashboard;
