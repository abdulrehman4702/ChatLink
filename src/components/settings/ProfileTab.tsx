import React from "react";

interface UserProfile {
  full_name: string;
  bio: string;
  phone: string;
  location: string;
  theme: "light" | "dark" | "system";
}

interface ProfileTabProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  avatarPreview: string;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  loading: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profile,
  setProfile,
  avatarPreview,
  onAvatarUpload,
  onSave,
  loading,
}) => {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Profile Information
      </h2>

      {/* Avatar Upload */}
      <div className="flex items-center space-x-6 mb-8">
        <div className="relative">
          <img
            src={avatarPreview || "/default-avatar.png"}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
          />
          <input
            type="file"
            accept="image/*"
            onChange={onAvatarUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Profile Picture</p>
          <p className="text-xs text-gray-500">Click to upload a new image</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) =>
              setProfile({ ...profile, full_name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) =>
              setProfile({ ...profile, location: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
};
