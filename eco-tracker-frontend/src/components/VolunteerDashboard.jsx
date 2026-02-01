import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Bell, User, Leaf, Clock, History } from "lucide-react";
import { authAPI, notificationAPI } from "../services/api";

function VolunteerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('view-events');
  
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [username] = useState(user?.name || 'Volunteer User');
  const [email] = useState(user?.email || 'volunteer@ecoclub.org');


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
  
  const [upcomingEvents] = useState([
    { id: 1, title: 'Beach Cleanup Drive', date: 'Feb 5, 2026', location: 'Sunset Beach', slots: 20, registered: false },
    { id: 2, title: 'Tree Planting Event', date: 'Feb 12, 2026', location: 'Central Park', slots: 15, registered: true },
    { id: 3, title: 'Recycling Workshop', date: 'Feb 20, 2026', location: 'Community Center', slots: 30, registered: false }
  ]);

  const [pastEvents] = useState([
    { id: 1, title: 'Community Garden Setup', date: 'Jan 15, 2026', hours: 4, status: 'Completed' },
    { id: 2, title: 'Park Beautification', date: 'Jan 8, 2026', hours: 3, status: 'Completed' },
    { id: 3, title: 'River Cleanup', date: 'Dec 20, 2025', hours: 5, status: 'Completed' }
  ]);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const data = await notificationAPI.getAllNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const [volunteerHours, setVolunteerHours] = useState({
    event: '',
    date: '',
    hours: '',
    description: ''
  });

  const [profile, setProfile] = useState({
    name: 'John Volunteer',
    email: 'john@volunteer.org',
    phone: '+1 234 567 8900',
    skills: 'Environmental Conservation, Community Outreach'
  });

  const totalHours = 45;

  const handleHoursChange = (e) => {
    const { name, value } = e.target;
    setVolunteerHours(prev => ({ ...prev, [name]: value }));
  };

  const handleLogHours = () => {
    alert(`Volunteer hours logged for "${volunteerHours.event}"!`);
    setVolunteerHours({ event: '', date: '', hours: '', description: '' });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = () => {
    navigate('/edit-profile');
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
              <h1 className="text-2xl font-bold text-gray-800">Campus Eco-Club Sustainability Tracker</h1>
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
        <h2 className="text-3xl font-bold text-gray-800 mb-2">'{username.toUpperCase()}' DASHBOARD</h2>
        <p className="text-gray-600">Volunteer Dashboard</p>
        <div className="mt-4 bg-blue-50 rounded-lg p-4 inline-block">
          <p className="text-sm text-gray-600">Total Volunteer Hours</p>
          <p className="text-3xl font-bold text-blue-600">{totalHours} hours</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab('view-events')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'view-events'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>VIEW EVENTS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('register-event')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'register-event'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>REGISTER</span>
            </button>
            
            <button
              onClick={() => setActiveTab('log-hours')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'log-hours'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>LOG HOURS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('past-events')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'past-events'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-5 h-5" />
              <span>PAST EVENTS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('notification')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'notification'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>NOTIFICATIONS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        {activeTab === 'view-events' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {event.slots} slots
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p><span className="font-semibold">Date:</span> {event.date}</p>
                    <p><span className="font-semibold">Location:</span> {event.location}</p>
                  </div>
                  {event.registered ? (
                    <div className="w-full bg-green-100 text-green-700 py-2 rounded-lg text-center font-semibold">
                      ✓ Registered
                    </div>
                  ) : (
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                      View Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'register-event' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Register for Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.filter(e => !e.registered).map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-3">{event.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p><span className="font-semibold">Date:</span> {event.date}</p>
                    <p><span className="font-semibold">Location:</span> {event.location}</p>
                    <p><span className="font-semibold">Available Slots:</span> {event.slots}</p>
                  </div>
                  <button 
                    onClick={() => handleRegisterEvent(event.id)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Register Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'log-hours' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Log Volunteer Hours</h3>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Select Event</label>
                <select 
                  name="event"
                  value={volunteerHours.event}
                  onChange={handleHoursChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Choose an event</option>
                  {pastEvents.map((event) => (
                    <option key={event.id} value={event.title}>{event.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Date</label>
                <input 
                  type="date"
                  name="date"
                  value={volunteerHours.date}
                  onChange={handleHoursChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Hours Volunteered</label>
                <input 
                  type="number"
                  name="hours"
                  value={volunteerHours.hours}
                  onChange={handleHoursChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none" 
                  placeholder="Enter number of hours"
                />
              </div>
              <div>
                <label className="block text-gray-800 font-semibold mb-2">Description (Optional)</label>
                <textarea 
                  rows={4}
                  name="description"
                  value={volunteerHours.description}
                  onChange={handleHoursChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                  placeholder="Describe your volunteer work"
                ></textarea>
              </div>
              <button 
                onClick={handleLogHours}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Submit Hours
              </button>
            </div>
          </div>
        )}

        {activeTab === 'past-events' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-800">Past Events & Hours</h3>
              <p className="text-gray-600 text-sm mt-1">Your volunteer history</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Event</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Hours</th>
                    <th className="px-6 py-4 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pastEvents.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{event.title}</td>
                      <td className="px-6 py-4 text-gray-600">{event.date}</td>
                      <td className="px-6 py-4 font-semibold text-blue-600">{event.hours} hrs</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          {event.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">Total Volunteer Hours:</span>
                <span className="text-2xl font-bold text-blue-600">{totalHours} hours</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notification' && (
          <div className="bg-white rounded-lg shadow-md divide-y">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Notifications</h3>
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
                      <p className="text-gray-500 text-sm mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
              <p className="text-gray-600">Volunteer</p>
            </div>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Full Name</p>
                <p className="text-gray-800 font-medium">{profile.name}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Email</p>
                <p className="text-gray-800 font-medium">{profile.email}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Phone Number</p>
                <p className="text-gray-800 font-medium">{profile.phone}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Skills & Interests</p>
                <p className="text-gray-800 font-medium">{profile.skills}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Total Volunteer Hours</p>
                <p className="text-gray-800 font-medium">{totalHours} hours</p>
              </div>
              <button 
                onClick={handleUpdateProfile}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold mt-6"
              >
                Edit Profile
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

export default VolunteerDashboard;