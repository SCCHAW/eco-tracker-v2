import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Leaf } from "lucide-react";
import { authAPI } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.role) newErrors.role = "Please select a role";
    return newErrors;
  };

  // Redirect to the correct dashboard based on role
  const getRedirectPath = (role) => {
    switch (role) {
      case "admin":
        return "/admin-dashboard";
      case "organizer":
        return "/organizer-dashboard";
      case "volunteer":
        return "/volunteer-dashboard";
      case "student":
      default:
        return "/home";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateLogin();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('login form', formData)

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      alert(`Welcome back, ${response.user.name}!`);
      console.log("Login successful:", response);
      navigate(getRedirectPath(response.user.role));
    } catch (error) {
      const message = error.message;

      if (message === "Email, password, and role are required") {
        alert("⚠️ Email, password, and role are all required.");
        setErrors({ email: message });
      } else if (message === "Invalid email, password, or role") {
        alert("Invalid email, password, or role. Please check your details and try again.");
        setErrors({ email: message });
      } else {
        alert("❌ " + message);
        setErrors({ email: message });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-gray-600 mt-2">
            Sign in to continue your eco-journey
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div>
            {/* Email */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="student@university.edu"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Role */}
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.role ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="organizer">Event Organizer</option>
                <option value="volunteer">Volunteer</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-sm mt-1">{errors.role}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
              onClick={()=> navigate("/forgot-password")}
                type="button"
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg mb-4"
            >
              Sign In
            </button>

            {/* Register Link */}
            <p className="text-center text-gray-600 text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="text-green-600 hover:text-green-700 font-semibold"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>

        {/* Back to Welcome */}
        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm font-medium"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default Login;