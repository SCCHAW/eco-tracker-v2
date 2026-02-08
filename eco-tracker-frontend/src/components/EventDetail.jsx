import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { eventAPI } from "../services/api";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  Award,
  Share2,
  Heart,
  CheckCircle,
  Info,
} from "lucide-react";

function EventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  // Get event data from navigation state
  const eventData = location.state?.event;

  // State management
  const [eventDetails, setEventDetails] = useState(eventData || null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [loading, setLoading] = useState(false);

  // Early return if no event data
  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No event data found</p>
          <button
            onClick={() => navigate("/events")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Computed values with safe fallbacks
  const eventId = eventData?.id;
  const participantCount = eventDetails?.participant_count || 0;
  const maxParticipants = eventDetails?.max_participants || 0;
  const spotsLeft =
    maxParticipants > 0 ? maxParticipants - participantCount : 0;

  const category = eventData?.event_type
    ? eventData.event_type.charAt(0).toUpperCase() +
      eventData.event_type.slice(1)
    : "Event";

  const date = eventData?.event_date
    ? new Date(eventData.event_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBA";

  const time =
    eventData?.event_time ||
    (eventData?.event_date
      ? new Date(eventData.event_date).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " - TBA"
      : "Time TBA");

  const requirements = eventData?.requirements
    ? eventData.requirements
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    : ["Details will be announced by the organizer"];

  // Ensure agenda is always an array
  const agenda = Array.isArray(eventData?.agenda) ? eventData.agenda : [];

  // API calls
  const checkRegistration = async () => {
    if (!eventId) {
      setCheckingRegistration(false);
      return;
    }

    try {
      const data = await eventAPI.getMyRegisteredEvents();
      const registered = data?.events?.some((e) => e.id === eventId) || false;
      setIsRegistered(registered);
    } catch (err) {
      console.error("Error checking registration:", err);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const fetchEventDetails = async () => {
    if (!eventId) return;

    try {
      setLoading(true);
      const data = await eventAPI.getEventById(eventId);
      if (data?.event) {
        setEventDetails(data.event);
      }
    } catch (err) {
      console.error("Error fetching event details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (eventId) {
      fetchEventDetails();
      checkRegistration();
    }
  }, [eventId]);

  // Event handlers
  const handleRegister = async () => {
    if (!eventId) return;

    if (isRegistered) {
      if (
        window.confirm("Are you sure you want to cancel your registration?")
      ) {
        try {
          await eventAPI.unregisterFromEvent(eventId);
          setIsRegistered(false);
          alert("Registration cancelled successfully!");
          await checkRegistration();
          await fetchEventDetails();
        } catch (err) {
          alert(`Error cancelling registration: ${err.message}`);
        }
      }
    } else {
      try {
        await eventAPI.registerForEvent(eventId);
        setIsRegistered(true);
        alert(
          `Successfully registered for ${eventData.title}! You will earn ${eventData.eco_points_reward} eco-points upon completion.`
        );
        await checkRegistration();
        await fetchEventDetails();
      } catch (err) {
        alert(`Error registering for event: ${err.message}`);
      }
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: eventData.title,
          text: eventData.description,
          url: window.location.href,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Event link copied to clipboard!");
    }
  };

  const getProgressPercentage = () => {
    if (maxParticipants === 0 || participantCount === 0) return 0;
    return (participantCount / maxParticipants) * 100;
  };

  const isEventDisabled =
    checkingRegistration ||
    eventData?.status === "cancelled" ||
    eventData?.status === "completed" ||
    (spotsLeft === 0 && maxParticipants > 0 && !isRegistered);

  const getButtonText = () => {
    if (checkingRegistration) return "Checking...";
    if (eventData?.status === "cancelled") return "Event Cancelled";
    if (eventData?.status === "completed") return "Event Completed";
    if (spotsLeft === 0 && maxParticipants > 0 && !isRegistered)
      return "Event Full";
    return isRegistered ? "Cancel Registration" : "Register Now";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Hero */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Event Image */}
              <div className="h-64 md:h-96 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center relative">
                <Calendar className="w-32 h-32 text-white opacity-30" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={handleFavorite}
                    className={`p-3 rounded-full ${
                      isFavorite
                        ? "bg-red-500 text-white"
                        : "bg-white text-gray-600"
                    } hover:scale-110 transition`}
                  >
                    <Heart
                      className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 bg-white text-gray-600 rounded-full hover:scale-110 transition"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Event Title & Category */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-3">
                      {category}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {eventData.title}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {eventData.description}
                    </p>
                  </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center text-green-600 mb-2">
                      <Calendar className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Date</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{date}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center text-blue-600 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Time</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{time}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center text-purple-600 mb-2">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Location</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">
                      {eventData.location || "TBA"}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center text-yellow-600 mb-2">
                      <Award className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Points</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">
                      {eventData.eco_points_reward || 0} eco-points
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* About This Event */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="w-6 h-6 mr-2 text-green-600" />
                About This Event
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {eventData.description}
              </p>

              {/* Tags */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {eventData.event_type && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      #{eventData.event_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What to Bring
              </h2>
              <ul className="space-y-3">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Event Agenda - Only show if agenda exists */}
            {agenda.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Event Agenda
                </h2>
                <div className="space-y-4">
                  {agenda.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start border-l-4 border-green-500 pl-4 py-2"
                    >
                      <div className="flex-shrink-0 w-32 md:w-40">
                        <span className="text-green-600 font-semibold text-sm">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-800 font-medium">
                          {item.activity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Registration Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Registration
                </h3>

                {/* Capacity Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Spots Filled</span>
                    <span className="font-semibold text-gray-800">
                      {maxParticipants > 0
                        ? `${participantCount} / ${maxParticipants}`
                        : "Unlimited"}
                    </span>
                  </div>
                  {maxParticipants > 0 && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {spotsLeft > 0
                          ? `${spotsLeft} spots remaining`
                          : "Event is full"}
                      </p>
                    </>
                  )}
                  {maxParticipants === 0 && (
                    <p className="text-sm text-gray-600 mt-2">
                      No capacity limit
                    </p>
                  )}
                </div>

                {/* Registration Status */}
                {isRegistered && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center text-green-700">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">You're registered!</span>
                    </div>
                  </div>
                )}

                {/* Registration Button */}
                {user?.role === "admin" || user?.role === "organizer" ? null : (
                  <button
                    onClick={handleRegister}
                    disabled={isEventDisabled}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                      isEventDisabled
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : isRegistered
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    {getButtonText()}
                  </button>
                )}
              </div>

              {/* Organizer Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Organizer
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Organized by</p>
                    <p className="text-gray-900 font-semibold">
                      {eventData.organizer_name || "TBA"}
                    </p>
                  </div>
                  {eventData.organizer_email && (
                    <div>
                      <p className="text-sm text-gray-600">Contact</p>
                      <a
                        href={`mailto:${eventData.organizer_email}`}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        {eventData.organizer_email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Attendees */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Attendees
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="text-2xl font-bold text-green-600">
                    {participantCount}
                  </span>{" "}
                  people are attending
                </p>
                <p className="text-sm text-gray-600">
                  Join this amazing community of eco-conscious individuals!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EventDetail;
