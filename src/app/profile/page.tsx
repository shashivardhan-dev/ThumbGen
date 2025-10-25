"use client";

import { useState, useEffect } from "react";
import { useToggle } from "../../contexts/toggle";
import Navbar from "../../components/Navbar";
import { useUser, RedirectToSignIn, useReverification } from "@clerk/nextjs";
import { toast } from "react-toastify";

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export default function AccountSettingsPage() {
  const { isToggled } = useToggle();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { user } = useUser();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
  });
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0].emailAddress || "",
        currentPassword: "",
        newPassword: "",
      });
    }
  }, [user]);
  console.log(user, "user");

  const updatePassword = useReverification(
    async (currentPassword, newPassword) => {
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
    }
  );

  if (!user) return <div>Loading...</div>;

  // Validation function
  const validate = () => {
    const newErrors: FormErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Email is invalid";
    if (form.currentPassword.length > 0 && form.currentPassword.length < 6)
      newErrors.currentPassword = "Password must be at least 6 characters";
    else if (
      form.currentPassword.length > 0 &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
        form.currentPassword
      )
    )
      newErrors.currentPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    console.log(form, "form");

    const updatedValues = {
      ...(user.firstName !== form.firstName && { firstName: form.firstName }),
      ...(user.lastName !== form.lastName && { lastName: form.lastName }),
    };

    await user.update(updatedValues);
    try {
      if (form.currentPassword.length > 0 && form.newPassword.length > 0) {
        await updatePassword(form.currentPassword, form.newPassword);
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message);
      return;
    }
    alert("Settings saved successfully!");
    setIsEditing(false);
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  return (
    <div
      className={`relative flex size-full min-h-screen flex-col transition-colors duration-300 ${
        isToggled ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }`}
    >
      <Navbar />

      <h1 className="text-2xl font-semibold mt-10 mb-6 px-6">
        Account Settings
      </h1>

      <div
        className={`rounded-2xl p-6 mx-6 mb-6 border ${
          isToggled ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
              isToggled
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="flex flex-row flex-wrap gap-6">
          {/* First Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="firstName" className="text-sm font-medium">
              First Name
            </label>
            <input
              id="firstName"
              value={form.firstName}
              onChange={handleChange("firstName")}
              placeholder="Enter first name"
              disabled={!isEditing}
              className={`w-[400px] px-3 py-2 text-lg rounded-xl border outline-none ${
                isToggled
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } ${!isEditing && "opacity-70 cursor-not-allowed"}`}
            />
            {errors.firstName && (
              <span className="text-red-500 text-sm">{errors.firstName}</span>
            )}
          </div>

          {/* Last Name */}
          <div className="flex flex-col gap-1">
            <label htmlFor="lastName" className="text-sm font-medium">
              Last Name
            </label>
            <input
              id="lastName"
              value={form.lastName}
              onChange={handleChange("lastName")}
              placeholder="Enter last name"
              disabled={!isEditing}
              className={`w-[400px] px-3 py-2 text-lg rounded-xl border outline-none ${
                isToggled
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } ${!isEditing && "opacity-70 cursor-not-allowed"}`}
            />
            {errors.lastName && (
              <span className="text-red-500 text-sm">{errors.lastName}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              disabled={!isEditing}
              className={`w-[400px] px-3 py-2 rounded-lg border outline-none ${
                isToggled
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              }`}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1 relative">
            <label htmlFor="current password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="current password"
              type={showCurrentPassword ? "text" : "password"}
              value={form.currentPassword}
              onChange={handleChange("currentPassword")}
              placeholder="Enter Current Password"
              disabled={!isEditing}
              className={`w-[400px] px-3 py-2 rounded-lg border outline-none ${
                isToggled
                  ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 border-gray-300"
              } ${!isEditing && "opacity-70 cursor-not-allowed"}`}
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-[38px] text-gray-500 text-sm"
              >
                {showCurrentPassword ? "Hide" : "Show"}
              </button>
            )}
            {errors.currentPassword && (
              <span className="text-red-500 text-sm">
                {errors.currentPassword}
              </span>
            )}

            <div className="flex flex-col gap-1 relative">
              <label htmlFor="new password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="new password"
                type={showNewPassword ? "text" : "password"}
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                placeholder="Enter New password"
                disabled={!isEditing}
                className={`w-[400px] px-3 py-2 rounded-lg border outline-none ${
                  isToggled
                    ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400"
                    : "bg-gray-100 text-gray-900 border-gray-300"
                } ${!isEditing && "opacity-70 cursor-not-allowed"}`}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-[38px] text-gray-500 text-sm"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              )}
              {errors.newPassword && (
                <span className="text-red-500 text-sm">
                  {errors.newPassword}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end mx-6 mb-10">
            <button
              onClick={handleSave}
              className={`mt-4 px-6 py-2 rounded-lg font-medium transition-colors ${
                isToggled
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
