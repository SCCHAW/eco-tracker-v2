import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Trophy, Award, Bell, User, Leaf } from "lucide-react";
import { notificationAPI } from "../services/api";

function UserDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [username] = useState(user?.name || 'Student User');
  const [email] = useState(user?.email || 'student@ecoclub.edu');
  
  const [events] = useState([
    { 
      id: 1, 
      title: 'Beach Cleanup Drive', 
      date: 'Feb 5, 2026', 
      points: 50, 
      registered: true,
      location: 'Sunset Beach',
      attendees: 180,
      capacity: 250,
      spotsLeft: 70,
      description: 'Join us for a community beach cleanup event. Collect trash, earn eco-points, and help protect marine life. Make a difference in our coastal ecosystem.',
      category: 'Cleanup',
      organizer: 'Campus Eco-Club'
    },
    { 
      id: 2, 
      title: 'Tree Planting Event', 
      date: 'Feb 12, 2026', 
      points: 75, 
      registered: true,
      location: 'Central Park',
      attendees: 425,
      capacity: 500,
      spotsLeft: 75,
      description: 'Help us plant 100 trees in the local park. Make a lasting impact on our environment and contribute to a greener future for our community.',
      category: 'Planting',
      organizer: 'Green Future Society'
    },
    { 
      id: 3, 
      title: 'Recycling Workshop', 
      date: 'Feb 20, 2026', 
      points: 30, 
      registered: false,
      location: 'Community Center',
      attendees: 220,
      capacity: 300,
      spotsLeft: 80,
      description: 'Learn about proper recycling techniques and sustainable waste management practices. Interactive sessions with hands-on activities.',
      category: 'Workshop',
      organizer: 'Environmental Education Team'
    }
  ]);

  const [achievements] = useState([
    { id: 1, title: 'Eco Warrior', description: 'Attended 10 events', icon: '🌟' },
    { id: 2, title: 'Tree Hugger', description: 'Planted 50 trees', icon: '🌳' },
    { id: 3, title: 'Clean Champion', description: 'Completed 5 cleanups', icon: '🏆' }
  ]);

  const [leaderboard] = useState([
    { id: 1, name: 'Alice Wong', points: 850, rank: 1 },
    { id: 2, name: 'Bob Chen', points: 720, rank: 2 },
    { id: 3, name: 'Sweeney', points: 680, rank: 3 },
    { id: 4, name: 'Diana Lee', points: 550, rank: 4 },
    { id: 5, name: 'Eric Tan', points: 490, rank: 5 }
  ]);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const totalPoints = 680;

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
              <span className="text-gray-700 font-medium">{username}</span>
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">'{username.toUpperCase()}' DASHBOARD</h2>
        <p className="text-gray-600">User Dashboard (Student)</p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-2 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'events'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>EVENTS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('eco-points')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'eco-points'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Leaf className="w-5 h-5" />
              <span>ECO-POINTS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('achievement')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'achievement'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>ACHIEVEMENT</span>
            </button>
            
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Trophy className="w-5 h-5" />
              <span>LEADERBOARD</span>
            </button>
            
            <button
              onClick={() => setActiveTab('notification')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'notification'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>NOTIFICATION</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'profile'
                  ? 'bg-green-600 text-white'
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
        {activeTab === 'events' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">My Registered Events</h3>
            {events.filter(event => event.registered).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.filter(event => event.registered).map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex items-center justify-between mb-4">
                      <Calendar className="w-8 h-8 text-green-600" />
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        +{event.points} pts
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{event.date}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('/event-detail', { 
                          state: { 
                            event: {
                              id: event.id,
                              title: event.title,
                              date: event.date,
                              location: event.location || 'To be announced',
                              attendees: event.attendees || 100,
                              points: event.points,
                              capacity: event.capacity || 150,
                              spotsLeft: event.spotsLeft || 50,
                              description: event.description || `Join us for ${event.title}. This is a great opportunity to contribute to environmental sustainability and earn eco-points.`,
                              category: event.category || 'Environmental Event',
                              organizer: event.organizer || 'Campus Eco-Club'
                            }
                          } 
                        })}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to cancel your registration for ${event.title}?`)) {
                            alert(`Registration cancelled for ${event.title}`);
                          }
                        }}
                        className="px-4 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">You haven't registered for any events yet.</p>
                <button 
                  onClick={() => navigate("/events")}
                  className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Browse Events
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'eco-points' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <h3 className="text-6xl font-bold text-green-600 mb-2">{totalPoints}</h3>
              <p className="text-gray-600 text-lg">Total Eco-Points</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">This Month</p>
                <p className="text-3xl font-bold text-green-600">150</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">This Week</p>
                <p className="text-3xl font-bold text-green-600">50</p>
              </div>
              <div className="bg-green-50 rounded-lg p-6 text-center">
                <p className="text-gray-600 mb-2">Events Attended</p>
                <p className="text-3xl font-bold text-green-600">12</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievement' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="text-5xl mb-4 text-center">{achievement.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">{achievement.title}</h3>
                <p className="text-gray-600 text-sm text-center">{achievement.description}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  {leaderboard.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`border-b hover:bg-gray-50 ${
                        entry.name === username ? 'bg-green-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`font-bold ${
                          entry.rank <= 3 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{entry.name}</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-600">{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <div className="bg-green-100 p-2 rounded-full">
                      <Bell className="w-5 h-5 text-green-600" />
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
              <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{username}</h3>
              <p className="text-gray-600">Student</p>
            </div>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Email</p>
                <p className="text-gray-800 font-medium">{email}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Total Eco-Points</p>
                <p className="text-gray-800 font-medium">{totalPoints} points</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-gray-600 text-sm">Events Attended</p>
                <p className="text-gray-800 font-medium">12 events</p>
              </div>
              <button 
                onClick={() => navigate("/edit-profile", { state: { role: 'student' } })}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold mt-6"
              >
                Edit Profile
              </button>
            </div>
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
      </main>
    </div>
  );
}

export default UserDashboard;



