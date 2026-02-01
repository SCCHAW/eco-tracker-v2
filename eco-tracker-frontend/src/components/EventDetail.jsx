import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Info
} from "lucide-react";

function EventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get event data from navigation state
  const eventData = location.state?.event;

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No event data found</p>
          <button
            onClick={() => navigate('/events')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Map API data to component format
  const [event] = useState({
    id: eventData.id,
    title: eventData.title,
    date: eventData.event_date ? new Date(eventData.event_date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }) : 'TBA',
    location: eventData.location || 'Location TBA',
    attendees: eventData.participant_count || 0,
    time: eventData.event_date ? new Date(eventData.event_date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) + ' - TBA' : 'Time TBA',
    points: eventData.eco_points_reward || 10,
    description: eventData.description || 'No description available.',
    longDescription: eventData.description || 'No detailed description available for this event.',
    organizer: eventData.organizer_name || 'Campus Eco-Club',
    organizerContact: eventData.organizer_email || 'ecoclub@mmu.edu.my',
    capacity: eventData.max_participants || 0,
    spotsLeft: eventData.spots_available || (eventData.max_participants - eventData.participant_count) || 0,
    category: eventData.event_type ? eventData.event_type.charAt(0).toUpperCase() + eventData.event_type.slice(1) : 'Event',
    status: eventData.status,
    requirements: [
      'Bring your own water bottle',
      'Wear comfortable clothing',
      'Be on time for the event'
    ],
    agenda: [
      { time: 'Check event details', activity: 'Event timing and agenda will be announced by the organizer' }
    ],
    tags: [
      eventData.event_type || 'Event',
      'Sustainability',
      'Campus Event'
    ],
    imageUrl: null
  });

  const [isRegistered, setIsRegistered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleRegister = () => {
    if (isRegistered) {
      if (window.confirm('Are you sure you want to cancel your registration?')) {
        setIsRegistered(false);
        alert('Registration cancelled successfully!');
      }
    } else {
      setIsRegistered(true);
      alert(`Successfully registered for ${event.title}! You will earn ${event.points} eco-points upon completion.`);
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      alert('Event link copied to clipboard!');
    }
  };

  const getProgressPercentage = () => {
    if (!event.capacity || event.capacity === 0) return 0;
    return ((event.capacity - event.spotsLeft) / event.capacity) * 100;
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
                      isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600'
                    } hover:scale-110 transition`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
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
                      {event.category}
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                      {event.title}
                    </h1>
                    <p className="text-gray-600 text-lg">
                      {event.description}
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
                    <p className="text-gray-800 font-medium text-sm">{event.date}</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center text-blue-600 mb-2">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Time</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{event.time}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center text-purple-600 mb-2">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Location</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{event.location}</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center text-yellow-600 mb-2">
                      <Award className="w-5 h-5 mr-2" />
                      <span className="font-semibold text-sm">Points</span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm">{event.points} eco-points</p>
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
                {event.longDescription}
              </p>

              {/* Tags */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                What to Bring
              </h2>
              <ul className="space-y-3">
                {event.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Event Agenda */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Event Agenda
              </h2>
              <div className="space-y-4">
                {event.agenda.map((item, index) => (
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
                      <p className="text-gray-800 font-medium">{item.activity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                      {event.capacity > 0 ? `${event.capacity - event.spotsLeft} / ${event.capacity}` : 'Unlimited'}
                    </span>
                  </div>
                  {event.capacity > 0 && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {event.spotsLeft > 0 ? `${event.spotsLeft} spots remaining` : 'Event is full'}
                      </p>
                    </>
                  )}
                  {event.capacity === 0 && (
                    <p className="text-sm text-gray-600 mt-2">No capacity limit</p>
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
                <button
                  onClick={handleRegistration}
                  disabled={event.status === 'cancelled' || event.status === 'completed' || (event.spotsLeft === 0 && event.capacity > 0)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition ${
                    event.status === 'cancelled' || event.status === 'completed' || (event.spotsLeft === 0 && event.capacity > 0)
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : isRegistered
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {event.status === 'cancelled' 
                    ? 'Event Cancelled' 
                    : event.status === 'completed'
                    ? 'Event Completed'
                    : event.spotsLeft === 0 && event.capacity > 0
                    ? 'Event Full'
                    : isRegistered 
                    ? 'Cancel Registration' 
                    : 'Register Now'}
                </button>
              </div>

              {/* Organizer Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Organizer
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Organized by</p>
                    <p className="text-gray-900 font-semibold">{event.organizer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <a
                      href={`mailto:${event.organizerContact}`}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      {event.organizerContact}
                    </a>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Attendees
                </h3>
                <p className="text-gray-700 mb-3">
                  <span className="text-2xl font-bold text-green-600">{event.attendees}</span> people are attending
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