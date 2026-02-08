import React from "react";
import {
  Calendar,
  Award,
  User,
  MapPin,
  Mail,
  Phone,
  Heart,
  Shield,
  Briefcase,
  GraduationCap,
  UserCircle,
  Edit,
  Hourglass,
  Activity,
  UserPlus,
} from "lucide-react";

function ProfileComponent({
  profile,
  registeredEventsCount,
  handleEditProfile,
  totalVolunteerHours,
  events,
  roles,
}) {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-xl overflow-hidden">
      {/* Header Section with Cover */}
      <div className="relative h-32 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-32 h-32 bg-white rounded-full p-1 shadow-xl">
              {profile.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-8 pb-8">
        {/* Name and Role */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-2">
            {profile.name}
          </h3>
          <span className="inline-flex items-center px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold capitalize">
            <UserCircle className="w-4 h-4 mr-2" />
            {profile.role}
          </span>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">Eco-Points</p>
                <p className="text-2xl font-bold text-green-600">
                  {profile.eco_points || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {profile.role === "student" ? (
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Events</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {registeredEventsCount}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ) : null}

          {profile.role === "volunteer" ? (
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs mb-1">Volunteer Hours</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalVolunteerHours}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Hourglass className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          ) : null}

          {profile.role === "organizer" ? (
            <>
              <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs mb-1">
                      Total Events Organized
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {events.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-xs mb-1">
                      Total Participants
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {events.reduce(
                        (sum, e) => sum + (e.participant_count || 0),
                        0
                      )}{" "}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-green-600" />
            Personal Information
          </h4>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 mb-1">Email Address</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Phone */}
            {profile.phone_number && (
              <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-gray-800">
                    {profile.phone_number}
                  </p>
                </div>
              </div>
            )}

            {/* Address */}
            {profile.address && (
              <div className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-1">Address</p>
                  <p className="text-sm font-medium text-gray-800">
                    {profile.address}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Academic Info (Student Only) */}
        {profile.role === "student" &&
          (profile.student_id || profile.major_program || profile.year) && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-green-600" />
                Academic Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {profile.student_id && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-xs text-gray-600 mb-2">Student ID</p>
                    <p className="text-lg font-bold text-green-700">
                      {profile.student_id}
                    </p>
                  </div>
                )}

                {profile.major_program && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-2">Major</p>
                    <p className="text-sm font-semibold text-blue-700">
                      {profile.major_program}
                    </p>
                  </div>
                )}

                {profile.year && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-gray-600 mb-2">Year</p>
                    <p className="text-sm font-semibold text-purple-700 capitalize">
                      {profile.year}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Interests & Bio */}
        {(profile.interests || profile.bio) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-green-600" />
              About Me
            </h4>

            {profile.interests && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-3">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.split(",").map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                    >
                      {interest.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {profile.bio}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Emergency Contact */}
        {(profile.emergency_contact_name ||
          profile.emergency_contact_phone) && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Emergency Contact
            </h4>

            <div className="space-y-4">
              {profile.emergency_contact_name && (
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Contact Name</p>
                    <p className="text-sm font-medium text-gray-800">
                      {profile.emergency_contact_name}
                      {profile.emergency_contact_relationship && (
                        <span className="text-gray-600">
                          {" "}
                          ({profile.emergency_contact_relationship})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {profile.emergency_contact_phone && (
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Contact Number</p>
                    <p className="text-sm font-medium text-gray-800">
                      {profile.emergency_contact_phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Button */}
        <button
          onClick={handleEditProfile}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
        >
          <Edit className="w-5 h-5" />
          <span>Edit Profile</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileComponent;
