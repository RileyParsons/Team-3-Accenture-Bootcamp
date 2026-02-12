'use client';

import { useState, useEffect } from 'react';
import { User, MapPin, DollarSign, Mail, Loader2, Save, X } from 'lucide-react';
import { getProfile, updateProfile, UserData } from '@/lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    location: '',
    postcode: '',
    savingsGoal: 0,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) {
        setError('No user found. Please log in.');
        return;
      }

      const { userId } = JSON.parse(storedUser);
      const profileData = await getProfile(userId);
      setProfile(profileData);

      // Initialize edit form
      setEditForm({
        name: profileData.name || '',
        email: profileData.email || '',
        location: profileData.location || '',
        postcode: profileData.postcode || '',
        savingsGoal: profileData.savings || 0,
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        name: profile.name || '',
        email: profile.email || '',
        location: profile.location || '',
        postcode: profile.postcode || '',
        savingsGoal: profile.savings || 0,
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const storedUser = localStorage.getItem('savesmart_user');
      if (!storedUser) {
        setError('No user found. Please log in.');
        return;
      }

      const { userId } = JSON.parse(storedUser);

      const updates: Partial<UserData> = {
        name: editForm.name,
        email: editForm.email,
        location: editForm.location,
        postcode: editForm.postcode,
        savings: editForm.savingsGoal,
      };

      const updatedProfile = await updateProfile(userId, updates);
      setProfile(updatedProfile);
      setIsEditing(false);

      // Update localStorage
      localStorage.setItem('savesmart_user', JSON.stringify(updatedProfile));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Profile Content */}
        {!isEditing ? (
          <div className="space-y-6">
            {/* Name */}
            <div className="flex items-start space-x-3">
              <User className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-lg font-medium text-gray-900">{profile?.name || 'Not set'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg font-medium text-gray-900">{profile?.email || 'Not set'}</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-lg font-medium text-gray-900">
                  {profile?.location || 'Not set'}
                  {profile?.postcode && ` (${profile.postcode})`}
                </p>
              </div>
            </div>

            {/* Savings Goal */}
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Savings Goal</p>
                <p className="text-lg font-medium text-gray-900">
                  ${profile?.savings?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your name"
              />
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your email"
              />
            </div>

            {/* Location Input */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location (Suburb)
              </label>
              <input
                type="text"
                id="location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your suburb"
              />
            </div>

            {/* Postcode Input */}
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                value={editForm.postcode}
                onChange={(e) => setEditForm({ ...editForm, postcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your postcode"
              />
            </div>

            {/* Savings Goal Input */}
            <div>
              <label htmlFor="savingsGoal" className="block text-sm font-medium text-gray-700 mb-1">
                Savings Goal ($)
              </label>
              <input
                type="number"
                id="savingsGoal"
                value={editForm.savingsGoal}
                onChange={(e) => setEditForm({ ...editForm, savingsGoal: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your savings goal"
                min="0"
                step="0.01"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
