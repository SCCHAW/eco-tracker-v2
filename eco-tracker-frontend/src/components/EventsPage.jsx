import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Scale, Calendar, Camera, Hourglass } from "lucide-react";
import { eventAPI, recyclingAPI } from "../services/api";

function EventsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("view");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [joinedEvents, setJoinedEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const [eventStatus, setEventStatus] = useState("");

  console.log("user==>", user);

  const [formData, setFormData] = useState({
    event_id: "",
    category: "",
    weight: "",
    volunteerHours: "",
    submission_date: new Date().toISOString().split("T")[0],
    description: "",
    image: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [submitError, setSubmitError] = useState("");

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
        (event) => event.status === "upcoming" || event.status === "ongoing"
      );
      setEvents(approvedEvents);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const data = await eventAPI.getMyRegisteredEvents();
      console.log("data.events==>", data.events);
      console.log("data.events==>", typeof data.events);
      let statuses;

      if (
        data.events &&
        typeof data.events === "object" &&
        !Array.isArray(data.events)
      ) {
        setEventStatus(data.events.status);
      }
      // If data.events is an array
      else if (Array.isArray(data.events)) {
        statuses = data.events.map((event) => event.status);
        setEventStatus(statuses);
      }
      setJoinedEvents(data.events || []);
      setEventStatus(statuses);
    } catch (err) {
      console.error("Error fetching registered events:", err);
    }
  };

  const handleJoinEvent = async (event) => {
    try {
      const alreadyJoined = joinedEvents.find((e) => e.id === event.id);
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

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else if (name === "submission_date") {
      // Block today and past dates
      const today = new Date().toISOString().split("T")[0];
      if (value <= today) {
        setErrors((prev) => ({
          ...prev,
          submission_date: "Please select a date after today",
        }));
        setFormData((prev) => ({ ...prev, [name]: "" })); // Reset the value
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    console.log("Validating form data:", formData); // Add this line

    if (!formData.category) {
      newErrors.category = "Please select a recycling type";
    }

    if (user.role === "volunteer") {
      if (!formData.volunteerHours) {
        newErrors.volunteerHours = "Volunteer hours are required";
      } else {
        const hoursValue = parseInt(formData.volunteerHours);
        if (isNaN(hoursValue) || hoursValue < 0) {
          newErrors.volunteerHours = "Hours must be a valid positive number";
        }
      }
    }

    if (!formData.weight) {
      newErrors.weight = "Weight is required";
    } else {
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue)) {
        newErrors.weight = "Weight must be a valid number";
      } else if (weightValue <= 0) {
        newErrors.weight = "Weight must be greater than 0";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitRecycling = async (e) => {
    e.preventDefault();

    // Clear previous submission error
    setSubmitError("");

    if (!validateForm()) {
      console.log("eventStatus", eventStatus);
      console.log("eventStatus", typeof eventStatus);
      return;
    }

    if (!eventStatus.includes("completed")) {
      alert(
        "❌ Event needs to be confirmed completed by organizers before submitting a recycling log!"
      );
      return;
    }

    try {
      setSubmitting(true);

      // Create FormData object for multipart/form-data
      const formDataObj = new FormData();

      // Append all form fields - IMPORTANT: Use the exact field names
      formDataObj.append("category", formData.category.toLowerCase());
      formDataObj.append("weight", parseFloat(formData.weight).toString());

      // Add description if it exists (even if empty string)
      if (formData.description !== undefined) {
        formDataObj.append("description", formData.description);
      }

      if (user.role === "volunteer" && formData.volunteerHours) {
        formDataObj.append(
          "volunteerHours",
          parseInt(formData.volunteerHours).toString()
        );
      }

      // Add event_id if selected
      if (formData.event_id) {
        formDataObj.append("event_id", formData.event_id);
      }

      // Append image file if exists
      if (formData.image) {
        formDataObj.append("image", formData.image);
      }

      console.log("Submitting recycling log with FormData:");
      // Debug: log all FormData entries
      for (let [key, value] of formDataObj.entries()) {
        if (key === "image") {
          console.log(
            `${key}: [File] ${value.name} (${value.type}, ${value.size} bytes)`
          );
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Call the API with FormData object
      const response = await recyclingAPI.submitLog(formDataObj);

      console.log("response", response);

      alert(
        "✅ Recycling log submitted successfully! It's now pending admin approval."
      );

      // Reset form
      setFormData({
        event_id: "",
        category: "",
        weight: "",
        submission_date: new Date().toISOString().split("T")[0],
        description: "",
        image: null,
      });
      setPreviewImage(null);
    } catch (error) {
      console.error("Submission error:", error);
      const message = error.message;

      if (message === "Category and weight are required") {
        setSubmitError("⚠️ Please fill in all required fields");
        // Check if fields are actually empty
        console.log("Form data state:", formData);
      } else if (message === "Invalid category") {
        setErrors({ category: "Please select a valid recycling type" });
      } else if (message.includes("Weight")) {
        setErrors({ weight: message });
      } else if (message === "Failed to submit log") {
        setSubmitError("❌ Failed to submit log. Please try again.");
      } else if (message.includes("Only image files are allowed")) {
        setSubmitError(
          "❌ Please upload only image files (JPG, PNG, GIF, WebP)."
        );
      } else if (message.includes("file size")) {
        setSubmitError("❌ Image file is too large. Maximum size is 5MB.");
      } else if (message === "Duplicate submission detected") {
        setSubmitError(
          "❌ You've already submitted this exact recycling log recently."
        );
      } else if (message === "Invalid event") {
        setSubmitError("❌ The selected event does not exist.");
      } else if (message === "Not registered for event") {
        setSubmitError(
          "❌ You must be registered for the event to submit recycling logs for it."
        );
      } else {
        setSubmitError("❌ " + message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
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
              onClick={() => setActiveTab("view")}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === "view"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              View Events
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === "register"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Join Event
            </button>
            <button
              onClick={() => setActiveTab("submit")}
              className={`px-8 py-3 rounded-2xl font-semibold transition ${
                activeTab === "submit"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Submit Recycling Log
            </button>
          </div>

          {/* Content Area */}
          {activeTab === "view" && (
            <div className="flex gap-6">
              {/* Left Sidebar - Event List */}
              <div className="w-64 bg-green-100 rounded-2xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <p className="text-center text-gray-600">Loading...</p>
                ) : error ? (
                  <p className="text-center text-red-600">Error: {error}</p>
                ) : events.length === 0 ? (
                  <p className="text-center text-gray-600">
                    No events available
                  </p>
                ) : (
                  events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full px-6 py-4 rounded-xl font-semibold transition ${
                        selectedEvent?.id === event.id
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-800 hover:bg-green-50"
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
                      <p className="text-lg leading-relaxed">
                        {selectedEvent.description ||
                          "No description available."}
                      </p>
                      <div className="mt-6 space-y-2">
                        <p>
                          <span className="font-semibold">Date:</span>{" "}
                          {new Date(
                            selectedEvent.event_date
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {selectedEvent.location || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Eco-Points:</span> +
                          {selectedEvent.eco_points_reward} points
                        </p>
                        <p>
                          <span className="font-semibold">
                            Current Participants:
                          </span>{" "}
                          {selectedEvent.participant_count || 0}
                        </p>
                        {selectedEvent.max_participants && (
                          <p>
                            <span className="font-semibold">
                              Available Spots:
                            </span>{" "}
                            {selectedEvent.spots_available} spots left
                          </p>
                        )}
                      </div>
                    </div>

                    {/* View More Details Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <button
                        onClick={() =>
                          navigate("/event-detail", {
                            state: {
                              event: selectedEvent,
                            },
                          })
                        }
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg"
                      >
                        View More Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-600 text-lg">
                      Select an event to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "register" && (
            <div className="bg-green-50 rounded-2xl p-8 min-h-96">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Join an Event
              </h2>
              {loading ? (
                <p className="text-center text-gray-600">Loading events...</p>
              ) : events.length === 0 ? (
                <p className="text-center text-gray-600">
                  No events available to join.
                </p>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {events.map((event) => {
                    const isJoined = joinedEvents.some(
                      (e) => e.id === event.id
                    );

                    return (
                      <div
                        key={event.id}
                        className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                              {event.title}
                            </h3>
                            <p className="text-gray-600 mb-3">
                              {event.description || "No description available."}
                            </p>
                            <div className="space-y-1 text-sm text-gray-700">
                              <p>
                                <span className="font-semibold">Date:</span>{" "}
                                {new Date(
                                  event.event_date
                                ).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-semibold">Location:</span>{" "}
                                {event.location || "N/A"}
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Eco-Points:
                                </span>{" "}
                                +{event.eco_points_reward} points
                              </p>
                              <p>
                                <span className="font-semibold">
                                  Available Spots:
                                </span>{" "}
                                {event.spots_available !== null
                                  ? event.spots_available
                                  : "Unlimited"}
                              </p>
                            </div>
                          </div>
                          {isJoined ? (
                            <div className="ml-4 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold whitespace-nowrap border-2 border-green-600">
                              ✓ Registered
                            </div>
                          ) : (
                            <button
                              onClick={() => handleJoinEvent(event)}
                              className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold whitespace-nowrap"
                            >
                              Join Event
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "submit" && (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                  <button
                    onClick={handleCancel}
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4 text-sm font-medium"
                  >
                    ← Back
                  </button>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Submit Recycling Log
                  </h1>
                  <p className="text-gray-600">
                    Log your recycling activities to earn eco-points
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={submitRecycling}
                  className="bg-white rounded-lg shadow-md p-6 space-y-6"
                >
                  {/* Error Message */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {submitError}
                    </div>
                  )}

                  {/* Event Selection */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">
                      Select Event 
                    </label>
                    <select
                      name="event_id"
                      value={formData.event_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                    >
                      <option value="">Choose an event (optional)</option>
                      {joinedEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} -{" "}
                          {new Date(event.event_date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <p className="text-gray-500 text-sm mt-1">
                      Select if this recycling is associated with an event
                    </p>
                  </div>

                  {user.role === "volunteer" && (
                    <div>
                      <label className="block text-gray-800 font-semibold mb-2 flex items-center">
                        <Hourglass className="w-4 h-4 mr-2" />
                        Hours Volunteered *
                      </label>
                      <input
                        type="number"
                        name="volunteerHours"
                        value={formData.volunteerHours}
                        onChange={handleChange}
                        step="0"
                        min="0"
                        className={`w-full px-4 py-3 rounded-lg border-2 ${
                          errors.volunteerHours
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:border-green-600 focus:outline-none`}
                        placeholder="e.g., 2"
                      />
                      {errors.volunteerHours && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.volunteerHours}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Recycling Type */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2 flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Recycling Type *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.category ? "border-red-500" : "border-gray-300"
                      } focus:border-green-600 focus:outline-none`}
                    >
                      <option value="">Select type...</option>
                      <option value="plastic">Plastic</option>
                      <option value="paper">Paper</option>
                      <option value="glass">Glass</option>
                      <option value="metal">Metal</option>
                      <option value="electronics">Electronics</option>
                      <option value="organic">Organic</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Weight */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2 flex items-center">
                      <Scale className="w-4 h-4 mr-2" />
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      step="0.1"
                      min="0.1"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.weight ? "border-red-500" : "border-gray-300"
                      } focus:border-green-600 focus:outline-none`}
                      placeholder="e.g., 2.5"
                    />
                    {errors.weight && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.weight}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Date of Recycling *
                    </label>
                    <input
                      type="date"
                      name="submission_date"
                      value={formData.submission_date}
                      onChange={handleChange}
                      min={
                        new Date(Date.now() + 86400000)
                          .toISOString()
                          .split("T")[0]
                      }
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        errors.submission_date
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:border-green-600 focus:outline-none`}
                    />
                    {errors.submission_date && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.submission_date}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none"
                      placeholder="e.g., Plastic bottles, Aluminum cans, etc."
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-gray-800 font-semibold mb-2 flex items-center">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Photo (Optional)
                    </label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-600 focus:outline-none bg-white"
                    />

                    {/* Image Preview */}
                    {previewImage && (
                      <div className="mt-4">
                        <p className="text-gray-600 mb-2">Preview:</p>
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="max-w-xs rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Eco Points Estimate */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">
                      Eco-Points Estimate
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-green-600">
                        {/* {formData.weight && formData.category
                          ? Math.round(parseFloat(formData.weight) * 10)
                          : "0"} */}
                        {"0"}
                      </span>
                      <span className="text-green-600">points</span>
                    </div>
                    <p className="text-green-600 text-sm mt-1">
                      Estimated points will be awarded after admin verification
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold ${
                      submitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {submitting ? "Submitting..." : "Submit Recycling Log"}
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </form>

                {/* Information */}
                <div className="mt-6 text-sm text-gray-600">
                  <p className="mb-2">* Required fields</p>
                  <p>
                    Your submission will be reviewed by an administrator. Once
                    verified, eco-points will be added to your account.
                  </p>
                </div>
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
        </div>
      </div>
    </div>
  );
}

export default EventsPage;
