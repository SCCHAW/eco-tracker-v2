import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { eventAPI } from "../services/api";

function EventsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('view');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch only approved upcoming events
      const data = await eventAPI.getAllEvents({ upcoming: true });
      // Filter to only show upcoming or ongoing approved events (not pending or cancelled)
      const approvedEvents = data.events.filter(
        event => event.status === 'upcoming' || event.status === 'ongoing'
      );
      setEvents(approvedEvents);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const data = await eventAPI.getMyRegisteredEvents();
      setJoinedEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching registered events:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted!');
  };

  const handleJoinEvent = async (event) => {
    try {
      const alreadyJoined = joinedEvents.find(e => e.id === event.id);
      if (alreadyJoined) {
        alert(`You are already registered for ${event.title}!`);
        return;
      }

      await eventAPI.registerForEvent(event.id);
      alert(`You have successfully registered for ${event.title}!`);
      
      // Refresh registered events
      fetchRegisteredEvents();
    } catch (err) {
      alert(`Error registering for event: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Events</h1>

        {/* Main Container */}
        <div className="bg-white rounded-3xl p-8 shadow-lg relative">
          {/* Top Navigation Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === 'view'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              View Events
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === 'register'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Register Event
            </button>
            <button
              onClick={() => setActiveTab('submit')}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === 'submit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Submit Recycling Log
            </button>
          </div>

          {/* Content Area */}
          {activeTab === 'view' && (
            <div className="flex gap-6">
              {/* Left Sidebar - Event List */}
              <div className="w-64 bg-green-100 rounded-2xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-gray-600">Loading...</p>
                ) : error ? (
                  <p className="text-center text-red-600">Error: {error}</p>
                ) : events.length === 0 ? (
                  <p className="text-center text-gray-600">No events available</p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition ${
                        selectedEvent?.id === event.id
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-800 hover:bg-green-50'
                      }`}
                    >
                      {event.title}
                    </button>
                  ))
                )}
              </div>

              {/* Right Panel - Event Details */}
              <div className="flex-1 bg-green-50 rounded-2xl p-8 min-h-96">
                {selectedEvent ? (
                  <div className="flex flex-col h-full">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                      {selectedEvent.title} Details
                    </h2>
                    <div className="space-y-4 text-gray-800 flex-1">
                      <p className="text-lg leading-relaxed">{selectedEvent.description || 'No description available.'}</p>
                      <div className="mt-6 space-y-2">
                        <p><span className="font-semibold">Date:</span> {new Date(selectedEvent.event_date).toLocaleDateString()}</p>
                        <p><span className="font-semibold">Location:</span> {selectedEvent.location || 'N/A'}</p>
                        <p><span className="font-semibold">Eco-Points:</span> +{selectedEvent.eco_points_reward} points</p>
                        <p><span className="font-semibold">Current Participants:</span> {selectedEvent.participant_count || 0}</p>
                        {selectedEvent.max_participants && (
                          <p><span className="font-semibold">Available Spots:</span> {selectedEvent.spots_available} spots left</p>
                        )}
                      </div>
                    </div>
                    
                    {/* View More Details Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => navigate('/event-detail', { 
                          state: { 
                            event: {
                              id: selectedEvent.id,
                              title: selectedEvent.title,
                              date: new Date(selectedEvent.event_date).toLocaleDateString(),
                              location: selectedEvent.location,
                              attendees: selectedEvent.participant_count || 0,
                              points: selectedEvent.eco_points_reward,
                              capacity: selectedEvent.max_participants,
                              spotsLeft: selectedEvent.spots_available,
                              description: selectedEvent.description
                            }
                          } 
                        })}
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg"
                      >
                        View More Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-600 text-lg">Select an event to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="bg-green-50 rounded-2xl p-8 min-h-96">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Join an Event</h2>
              {loading ? (
                <p className="text-center text-gray-600">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-center text-gray-600">No events available to join.</p>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                          <p className="text-gray-600 mb-3">{event.description || 'No description available.'}</p>
                          <div className="space-y-1 text-sm text-gray-700">
                            <p><span className="font-semibold">Date:</span> {new Date(event.event_date).toLocaleDateString()}</p>
                            <p><span className="font-semibold">Location:</span> {event.location || 'N/A'}</p>
                            <p><span className="font-semibold">Eco-Points:</span> +{event.eco_points_reward} points</p>
                            <p><span className="font-semibold">Available Spots:</span> {event.spots_available !== null ? event.spots_available : 'Unlimited'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinEvent(event)}
                          className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold whitespace-nowrap"
                        >
                          Join Event
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'submit' && (
            <div className="bg-green-50 rounded-2xl p-8 min-h-96">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Submit Recycling Log</h2>
              {joinedEvents.length > 0 ? (
                <div className="space-y-4 max-w-2xl mx-auto">
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">Select Event</label>
                    <select className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none">
                      <option value="">Choose an event...</option>
                      {joinedEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.event_date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">Recycling Type</label>
                    <select className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none">
                      <option>Plastic</option>
                      <option>Paper</option>
                      <option>Glass</option>
                      <option>Metal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">Weight (kg)</label>
                    <input type="number" className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">Date</label>
                    <input type="date" className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">Upload Photo (Optional)</label>
                    <input type="file" accept="image/*" className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none bg-white" />
                  </div>
                  <button onClick={handleSubmit} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
                    Submit Log
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                  <p className="text-gray-600 text-lg text-center">You haven't joined any events yet.</p>
                  <p className="text-gray-500 text-sm text-center">Please join an event first to submit recycling logs.</p>
                  <button
                    onClick={() => setActiveTab('register')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Go to Register Event
                  </button>
                </div>
              )}
            </div>
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

        </div>
      </div>
    </div>
  );
}

export default EventsPage;