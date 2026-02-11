"use client";

import { useState } from "react";
import { PiggyBank, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    agreeTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "Please agree to terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Store user data in localStorage (dummy backend)
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('savesmart_user', JSON.stringify(userData));
      localStorage.setItem('savesmart_authenticated', 'true');
      
      // Redirect to onboarding
      router.push('/onboarding');
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
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
            href="/auth/login"
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create your SaveSmart account
            </h1>
            <p className="text-gray-600">
              Start your journey to smarter savings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.firstName 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-green-500'
                  }`}
                  placeholder="Sarah"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.lastName 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-green-500'
                  }`}
                  placeholder="Smith"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  className={`w-full p-3 pr-12 border-2 rounded-lg focus:outline-none transition-colors ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-green-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <button
                type="button"
                onClick={() => updateField('agreeTerms', !formData.agreeTerms)}
                className="mt-1"
              >
                {formData.agreeTerms ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 rounded"></div>
                )}
              </button>
              <div className="text-sm">
                <span className="text-gray-700">
                  I agree to SaveSmart's{" "}
                  <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
                </span>
                {errors.agreeTerms && (
                  <p className="text-red-500 text-sm mt-1">{errors.agreeTerms}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              By signing up, you'll get personalized savings recommendations powered by AI
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}