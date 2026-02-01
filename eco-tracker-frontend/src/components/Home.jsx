import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Calendar, MapPin, Users } from "lucide-react";
import { authAPI } from "../services/api";

function Home() {
  const navigate = useNavigate();

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;


  const handleLogout = async ()=> {
    try {
      const response = authAPI.logout();
      console.log('response', response);
      alert(`Thank you!, ${'Account logged successfully'}!`);
      navigate('/');
    } catch (error) {
      const message = error.message;
      alert(`Error Please Try Again, ${message}!`);
    }
  }

  const [events] = useState([
    {
      id: 1,
      title: "Recycling Awareness Workshop",
      date: "July 15, 2026",
      location: "MMU Cyberjaya, MPH Hall",
      attendees: 250,
    },
    {
      id: 2,
      title: "Green Tech Conference",
      date: "August 22, 2026",
      location: "MMU Cyberjaya, Dewan Tun Canselor",
      attendees: 500,
    },
    {
      id: 3,
      title: "Beach Cleanup Drive",
      date: "September 10, 2026",
      location: "Cyberjaya Beach",
      attendees: 180,
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Name */}
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-full">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Campus Eco-Club Sustainability Tracker
              </h1>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a
                href="#"
                className="text-green-600 font-semibold hover:text-green-800 transition"
              >
                Main 
              </a>
              <button
                onClick={() => navigate("/events")}
                className="text-gray-600 hover:text-green-600 transition"
              >
                Event
              </button>
              <button
                onClick={() => navigate("/user-dashboard")}
                className="text-gray-600 hover:text-green-600 transition"
              >
                User Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-green-600 transition"
              >
                Logout
              </button>
            </nav>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome {user?.name} {/* Username Placeholder */}
          </h2>
          <p className="text-xl text-gray-600">Small Actions. Big Impact.</p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Event Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Calendar className="w-16 h-16 text-white opacity-50" />
              </div>

              {/* Event Details */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {event.title}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">{event.date}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{event.location}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">{event.attendees} attendees</span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate("/event-detail", { state: { event } })
                  }
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FOR DEVELOPER */}

        <div className="text-center mt-8 space-y-4">
          {!user?.role === "student" && (
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate("/organizer-dashboard")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Access Organizer Dashboard (Temporary)
              </button>
              <button
                onClick={() => navigate("/admin-dashboard")}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
              >
                Access Admin Dashboard (Temporary)
              </button>
              <button
                onClick={() => navigate("/volunteer-dashboard")}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Access Volunteer Dashboard (Temporary)
              </button>
            </div>
          )}

          
        </div>
      </main>
    </div>
  );
}

export default Home;
