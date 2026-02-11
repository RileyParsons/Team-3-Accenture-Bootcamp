"use client";

import { useState } from "react";
import { PiggyBank, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    
    if (validateForm()) {
      // Check if user exists in localStorage (dummy backend)
      const storedUser = localStorage.getItem('savesmart_user');
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        
        // Simple email check for demo (in real app, backend would verify credentials)
        if (userData.email === formData.email) {
          localStorage.setItem('savesmart_authenticated', 'true');
          router.push('/chat'); // Existing users skip onboarding
        } else {
          setLoginError("Invalid email or password");
        }
      } else {
        setLoginError("No account found with this email. Please sign up first.");
      }
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (loginError) {
      setLoginError("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <nav className="px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <PiggyBank className="h-8 w-8 text-green-600" />
            <span className="text-xl font-bold text-gray-900">SaveSmart</span>
          </Link>
          <Link 
            href="/auth/signup"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Need an account? Sign up
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600">
              Sign in to your SaveSmart account
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-gray-200 focus:border-green-500'
                }`}
                placeholder="sarah@university.edu.au"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-sm text-green-600 hover:text-green-700">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className={`w-full p-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-green-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => updateField('rememberMe', e.target.checked)}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          {/* Demo Instructions */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Demo Instructions:</h3>
            <div className="text-sm text-blue-700">
              <p className="mb-2">• First time? Click "Sign up" to create an account</p>
              <p>• Returning? Use the email from your signup to sign in</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}