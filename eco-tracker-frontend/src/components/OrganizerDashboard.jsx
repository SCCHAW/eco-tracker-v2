import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Bell, User, Leaf, Plus, Edit, Send } from "lucide-react";
import {
  authAPI,
  eventAPI,
  notificationAPI,
  profileAPI,
} from "../services/api";
import ProfileComponent from "./profile-component/profileComponent";

function OrganizerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("events");

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [profile, setProfile] = useState({
    name: user?.name || "Organizer User",
    email: user?.email || "organizer@example.com",
    eco_points: user?.eco_points || 0,
    role: user?.role || "organizer",
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "cleanup",
    date: "",
    time: "",
    location: "",
    description: "",
    points: "",
    participantsNeeded: "",
    agenda: "",
    requirements: "",
  });

  const [eventNotification, setEventNotification] = useState({
    eventId: "",
    title: "",
    message: "",
  });

  // Fetch events, notifications, and profile on component mount
  useEffect(() => {
    fetchEvents();
    fetchNotifications();
    fetchProfile();
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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventAPI.getMyOrganizedEvents();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateEvent = async () => {
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.event_type,
        location: newEvent.location,
        event_date: newEvent.date,
        event_time: newEvent.time || null,
        max_participants: parseInt(newEvent.participantsNeeded) || null,
        eco_points_reward: parseInt(newEvent.points) || 10,
        agenda: newEvent.agenda || null,
        requirements: newEvent.requirements || null,
      };

      await eventAPI.createEvent(eventData);
      alert(
        `Event "${newEvent.title}" created successfully and is pending admin approval!`
      );
      setNewEvent({
        title: "",
        event_type: "cleanup",
        date: "",
        time: "",
        location: "",
        description: "",
        points: "",
        participantsNeeded: "",
        agenda: "",
        requirements: "",
      });

      // Refresh events list
      fetchEvents();
    } catch (err) {
      alert(`Error creating event: ${err.message}`);
    }
  };

  const handleUpdateEventStatus = async (eventId, newStatus) => {
    try {
      await eventAPI.updateEvent(eventId, { status: newStatus });
      alert("Event status updated successfully!");

      // Refresh events list
      fetchEvents();
    } catch (err) {
      alert(`Error updating event status: ${err.message}`);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, value } = e.target;
    setEventNotification((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async () => {
    const selectedEvent = events.find(
      (e) => e.id === parseInt(eventNotification.eventId)
    );
    if (
      !selectedEvent ||
      !eventNotification.title ||
      !eventNotification.message
    ) {
      alert("Please select an event, enter a title and message.");
      return;
    }

    try {
      const data = await notificationAPI.sendToEventParticipants(
        eventNotification.eventId,
        {
          title: eventNotification.title,
          message: eventNotification.message,
        }
      );
      alert(
        `Notification sent to ${data.recipientCount} participant(s) of "${selectedEvent.title}"!`
      );
      setEventNotification({ eventId: "", title: "", message: "" });
    } catch (err) {
      alert(`Error sending notification: ${err.message}`);
    }
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

  const handleEventDetails = async (eventId, event) => {
    console.log("Attempting to fetch event with ID:", eventId);

    try {
      // Fetch the full event details using the event ID
      const eventData = await eventAPI.getEventById(eventId);
      navigate("/event-detail", { state: { event: eventData.event } });
    } catch (error) {
      console.error("Failed to fetch event details:", error);
      // Fallback: use the data we have
      navigate("/event-detail", {
        state: {
          event: {
            id: eventId,
            title: event.event_title || event.title,
            event_date: event.event_date,
            location: event.event_location || event.location,
            description: event.event_description || event.description,
            status: event.event_status || event.status,
            organizer_name: event.organizer_name,
          },
        },
      });
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
              <span className="text-gray-700 font-medium">{user?.name}</span>
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
        <p className="text-gray-600">Event Organizer Dashboard</p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
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
              onClick={() => setActiveTab("create-event")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "create-event"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>CREATE EVENT</span>
            </button>

            <button
              onClick={() => setActiveTab("update-status")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "update-status"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Edit className="w-5 h-5" />
              <span>UPDATE STATUS</span>
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
              onClick={() => setActiveTab("send-notification")}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === "send-notification"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Send className="w-5 h-5" />
              <span>NOTIFY USER</span>
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
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">All Events</h3>
              <div className="text-sm text-gray-600">
                Total Events: {events.length}
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error: {error}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  No events found. Create your first event!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  return (
                    <div
                      key={event.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Calendar className="w-8 h-8 text-green-600" />
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            event.status === "completed"
                              ? "bg-gray-100 text-gray-700"
                              : event.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : event.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {event.location || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Participants:</span>{" "}
                          {event.participant_count || 0}
                        </p>
                        <p>
                          <span className="font-semibold">Points:</span>{" "}
                          {event.eco_points_reward}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEventDetails(event.id, event)}
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "create-event" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Create New Event
            </h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Event Type
                </label>
                <select
                  name="event_type"
                  value={newEvent.event_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                >
                  <option value="cleanup">Cleanup</option>
                  <option value="awareness">Awareness</option>
                  <option value="workshop">Workshop</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Event Date
                </label>
                <input
                  type="date"
                  name="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={newEvent.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Event Time
                </label>
                <input
                  type="time"
                  name="time"
                  value={newEvent.time}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Start time"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter event location"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Eco-Points
                </label>
                <input
                  type="number"
                  name="points"
                  value={newEvent.points}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter points for this event"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Participants Needed
                </label>
                <input
                  type="number"
                  name="participantsNeeded"
                  value={newEvent.participantsNeeded}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter number of participants needed"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  name="description"
                  value={newEvent.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter event description"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Event Agenda
                </label>
                <textarea
                  rows={3}
                  name="agenda"
                  value={newEvent.agenda}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter agenda items (one per line)&#10;Example:&#10;09:00 AM - Registration&#10;10:00 AM - Opening Ceremony&#10;11:00 AM - Main Activity"
                ></textarea>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  What to Bring / Requirements
                </label>
                <textarea
                  rows={3}
                  name="requirements"
                  value={newEvent.requirements}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter requirements (one per line)&#10;Example:&#10;- Bring your own water bottle&#10;- Wear comfortable clothing&#10;- Sun protection"
                ></textarea>
              </div>
              <button
                onClick={handleCreateEvent}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Create Event
              </button>
            </div>
          </div>
        )}

        {activeTab === "update-status" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Update Event Status
            </h3>
            <div className="space-y-4">
              {events
                .filter((event) => event.status !== "pending")
                .map((event) => (
                  <div key={event.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleDateString()} •{" "}
                          {event.location || "N/A"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          event.status === "completed"
                            ? "bg-gray-100 text-gray-700"
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
                    <div className="flex gap-2">
                      <select
                      disabled={event.status === "completed"}
                        id={`status-${event.id}`}
                        defaultValue={event.status}
                        className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        disabled={event.status === "completed"}
                        onClick={() => {
                          const selectElement = document.getElementById(
                            `status-${event.id}`
                          );
                          const newStatus = selectElement.value;
                          handleUpdateEventStatus(event.id, newStatus);
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              {events.filter((event) => event.status !== "pending").length ===
                0 && (
                <p className="text-center text-gray-600 py-4">
                  No approved events to update.
                </p>
              )}
            </div>
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

        {activeTab === "profile" && (
          <ProfileComponent
            roles={profile.role}
            profile={profile}
            events={events}
            handleEditProfile={() =>
              navigate("/edit-profile", { state: { role: "organizer" } })
            }
          />
        )}

        {activeTab === "send-notification" && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Send Notification to Event Participants
            </h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Select Event
                </label>
                <select
                  name="eventId"
                  value={eventNotification.eventId}
                  onChange={handleNotificationChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                >
                  <option value="">Choose an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.participant_count || 0}{" "}
                      participants
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={eventNotification.title}
                  onChange={handleNotificationChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter notification title..."
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">
                  Notification Message
                </label>
                <textarea
                  rows={6}
                  name="message"
                  value={eventNotification.message}
                  onChange={handleNotificationChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                  placeholder="Enter notification message for event participants..."
                ></textarea>
              </div>
              <button
                onClick={handleSendNotification}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send Notification
              </button>
            </div>
          </div>
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

export default OrganizerDashboard;
