import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Award,
  ArrowLeft,
  Save,
  Briefcase,
  Users,
} from "lucide-react";
import { profileAPI } from "../services/api";

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect user role from location state or default to 'student'
  const [userRole] = useState(location.state?.role || "student");
  const [userId, setUserId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    // Student specific fields
    studentId: "",
    major: "",
    year: "",
    // Organizer specific fields
    organization: "",
    position: "",
    department: "",
    // Common fields
    skills: "",
    bio: "",
    emergencyContact: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const data = await profileAPI.getProfile();
        console.log("Profile data:", data);
      
        const id = data?.user.id;
        console.log(id)
        setUserId(id);

        setFormData((prev) => ({
          ...prev,
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone_number || "",
          address: data.user.address || "",
          studentId: data.user.student_id || "",
          major: data.user.major_program || "",
          year: data.user.year || "",
          skills: data.user.interests || "",
          bio: data.user.bio || "",
          organization: data.user.organization || "",
          position: data.user.position || "",
          department: data.user.department || "",
          emergencyContactName: data.user.emergency_contact_name || "",
          emergencyContact: data.user.emergency_contact_phone || "",
          emergencyContactRelationship:
            data.user.emergency_contact_relationship || "",
        }));
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        alert("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        setSubmitting(true);

        const response = await profileAPI.updateProfile(userId,{
          name: formData.name,
          phone_number: formData.phone,
          address: formData.address,
          student_id: formData.studentId,
          major_program: formData.major,
          year: formData.year,
          interests: formData.skills,
          bio: formData.bio,
          emergency_contact_name: formData.emergencyContactName,
          emergency_contact_phone: formData.emergencyContact,
          emergency_contact_relationship: formData.emergencyContactRelationship,
          organization: formData.organization,
          position: formData.position,
          department: formData.department
        });
  
        alert("User Profile updated successfully!");
        console.log('response', response);
  
        window.dispatchEvent(new Event("profile-updated"));
  
        navigate(-1); 
      } catch (error) {
        console.error("Profile update error:", error);
    
        if (error.message.includes('Student ID already exists')) {
          alert(`❌ The student ID "${formData.studentId}" is already assigned to another user. Please use a different student ID.`);
          setErrors(prev => ({
            ...prev,
            studentId: "This student ID is already taken"
          }));
        } else {
          alert(`❌ Failed to update profile: ${error.message}`);
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (validateForm()) {
  //     try {
  //       setSubmitting(true);

  //       await profileAPI.updateBasicInfo({
  //         name: formData.name,
  //       });

  //       // Update profile with all fields
  //       await profileAPI.updateProfile({
  //         phone_number: formData.phone,
  //         address: formData.address,
  //         student_id: formData.studentId,
  //         major_program: formData.major,
  //         year: formData.year,
  //         interests: formData.skills,
  //         bio: formData.bio,
  //         emergency_contact_name: formData.emergencyContactName,
  //         emergency_contact_phone: formData.emergencyContact,
  //         emergency_contact_relationship: formData.emergencyContactRelationship,
  //         organization: formData.organization,
  //         position: formData.position,
  //         department: formData.department,
  //       });

  //       // Update basic info (name and email) separately
     

  //       alert("Profile updated successfully!");

  //       window.dispatchEvent(new Event("profile-updated"));

  //       const currentUser = JSON.parse(localStorage.getItem("user"));
  //       localStorage.setItem(
  //         "user",
  //         JSON.stringify({
  //           ...currentUser,
  //           name: formData.name,
  //         })
  //       );

  //       navigate(-1); // Go back to previous page
  //     } catch (error) {
  //       console.error("Profile update error:", error);
    
  //       if (error.message.includes('Student ID already exists')) {
  //         alert(`❌ The student ID "${formData.studentId}" is already assigned to another user. Please use a different student ID.`);
  //         setErrors(prev => ({
  //           ...prev,
  //           studentId: "This student ID is already taken"
  //         }));
  //       } else {
  //         alert(`❌ Failed to update profile: ${error.message}`);
  //       }
  //     } finally {
  //       setSubmitting(false);
  //     }
  //   }
  // };

  const handleCancel = () => {
    navigate(-1);
  };

  const getRoleColor = () => {
    switch (userRole) {
      case "student":
        return "green";
      case "organizer":
        return "green";
      default:
        return "blue";
    }
  };

  const color = getRoleColor();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {userRole === "volunteer" ? "Volunteer Detail" : "Edit Profile"}
          </h1>
          <p className="text-gray-600">
            Update your personal information
            {userRole === "student" && " (Student)"}
            {userRole === "organizer" && " (Event Organizer)"}
            {userRole === "volunteer" && " (Volunteer)"}
          </p>
        </div>

        {/* Profile Picture */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex flex-col items-center">
            <div
              className={`w-32 h-32 bg-${color}-600 rounded-full flex items-center justify-center mb-4`}
            >
              <User className="w-16 h-16 text-white" />
            </div>
            <button
              className={`text-${color}-600 hover:text-${color}-700 font-medium text-sm`}
            >
              Change Profile Picture
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-8"
        >
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <User className={`w-5 h-5 mr-2 text-${color}-600`} />
                Personal Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    } focus:border-${color}-600 focus:outline-none`}
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } focus:border-${color}-600 focus:outline-none`}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                    placeholder="Enter your address"
                  />
                </div>
              </div>
            </div>

            {/* Student Specific Information */}
            {userRole === "student" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-green-600" />
                  Student Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Student ID
                    </label>
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                      placeholder="Enter your student ID"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Major/Program
                    </label>
                    <input
                      type="text"
                      name="major"
                      value={formData.major}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                      placeholder="e.g., Environmental Science"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Year Level
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                    >
                      <option value="">Select year level</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Organizer Specific Information */}
            {userRole === "organizer" && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                  Organization Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Organization/Club
                    </label>
                    <input
                      type="text"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                      placeholder="e.g., Campus Eco-Club"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Position/Role
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                      placeholder="e.g., Event Coordinator"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
                      placeholder="e.g., Student Affairs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Volunteer Information Section (Common for all or Volunteer specific) */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                {userRole === "student" ? (
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <Award className={`w-5 h-5 mr-2 text-${color}-600`} />
                )}
                {userRole === "student" && "Interests & Skills"}
                {userRole === "organizer" && "Skills & Expertise"}
                {userRole === "volunteer" && "Volunteer Information"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Skills & Interests
                  </label>
                  <textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                    placeholder="e.g., Environmental Conservation, Community Outreach, Teaching"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Separate multiple skills with commas
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Emergency Contact
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                    placeholder="Enter emergency contact name"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Emergency Contact Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                      placeholder="+1 234 567 8901"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Emergency Contact Relationship
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 rounded-lg border-2 border-gray-300 focus:border-${color}-600 focus:outline-none`}
                      placeholder="e.g mother or father"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 flex items-center justify-center space-x-2 bg-${color}-600 text-white py-3 rounded-lg hover:bg-${color}-700 transition font-semibold ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Save className="w-5 h-5" />
              <span>{submitting ? "Saving..." : "Save Changes"}</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
