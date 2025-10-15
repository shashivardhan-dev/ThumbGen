// Fixed Channels.tsx with working drag & drop functionality
"use client";
import { useState, useEffect, useRef } from "react";
import { useToggle } from "../../contexts/toggle";
import Navbar from "../../components/Navbar";
import { useAppDispatch, useAppSelector } from "../../lib/store/hooks";
import {
  useGetChannelsQuery,
  useCreateChannelMutation,
  useUpdateChannelMutation,
  useDeleteChannelMutation,
} from "../../lib/store/features/channels/channelsAPI";
import {
  setFormDirty,
  setFormMode,
  setSelectedChannel,
} from "../../lib/store/features/channels/channelsSlice";

interface FormData {
  name: string;
  category: string;
  brandGuidelines: string;
  logo: File | null;
}

interface FormErrors {
  name?: string;
  category?: string;
  brandGuidelines?: string;
  logo?: string;
  submit?: string;
}

export default function Channels() {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const { isToggled } = useToggle();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createImagePreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Redux state - only for form management
  const { selectedChannel, formMode } = useAppSelector(
    (state) => state.channels
  );

  // RTK Query hooks - primary data source
  const {
    data: dataChannels,
    isLoading: channelsLoading,
    error: channelsError,
    refetch,
  } = useGetChannelsQuery();

  const channels = dataChannels?.channels || [];

  const [createChannel, { isLoading: isCreating }] = useCreateChannelMutation();
  const [editChannel, { isLoading: isUpdating }] = useUpdateChannelMutation();
  const [deleteChannel, { isLoading: isDeleting }] = useDeleteChannelMutation();

  // Local form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: "",
    brandGuidelines: "",
    logo: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const isLoading = isCreating || isUpdating || isDeleting;

  // Load selected channel data into form
  useEffect(() => {
    if (selectedChannel && channels.length > 0) {
      const channelData = channels.find((c) => c.id === selectedChannel);
      if (channelData) {
        setFormData({
          name: channelData.name,
          category: channelData.category,
          brandGuidelines: channelData.brandGuidelines || "",
          logo: null,
        });

        if (channelData.logoUrl) {
          const url = `https://thumbnailgenai.s3.ap-south-1.amazonaws.com/thumbnails/808e21c3-2c0a-4f88-b2d0-980cffa0ebc0.png`;
          console.log(url);
          setImagePreview(url);
          setFileName("");
        } else {
          setImagePreview(null);
          setFileName("");
        }
      }
    }
  }, [selectedChannel, channels]);

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (formMode !== "edit" && formMode !== "create") {
      return;
    }

    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    dispatch(setFormDirty(true));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle profile selection change
  const handleProfileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value && channels.length > 0) {
      const channel = channels.find((c) => c.id === value);
      if (channel) {
        dispatch(setSelectedChannel(channel.id));
        dispatch(setFormMode("view"));
      }
    } else {
      dispatch(setSelectedChannel(null));
      dispatch(setFormMode("create"));
      setFormData({
        name: "",
        category: "",
        brandGuidelines: "",
        logo: null,
      });
      setImagePreview(null);
      setFileName("");
    }

    setErrors({});
    setSuccessMessage("");
  };

  // Handle edit button click
  const handleEditProfile = () => {
    if (selectedChannel) {
      dispatch(setFormMode("edit"));
      setErrors({});
      setSuccessMessage("");
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (selectedChannel && channels.length > 0) {
      const channelData = channels.find((c) => c.id === selectedChannel);
      if (channelData) {
        setFormData({
          name: channelData.name,
          category: channelData.category,
          brandGuidelines: channelData.brandGuidelines || "",
          logo: null,
        });

        if (channelData.logoUrl) {
          setImagePreview(channelData.logoUrl);
          setFileName("");
        } else {
          setImagePreview(null);
          setFileName("");
        }
      }
      dispatch(setFormMode("view"));
      dispatch(setFormDirty(false));
    }
    setErrors({});
    setSuccessMessage("");
  };

  // Handle file validation and processing
  const handleFile = (file: File | undefined) => {
    if (!file) return;

    console.log("Processing file:", file.name, file.type, file.size);

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo: "File size must be less than 5MB",
      }));
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        logo: "Only PNG, JPG, and SVG files are allowed",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      logo: file,
    }));

    setFileName(file.name);
    createImagePreview(file);
    dispatch(setFormDirty(true));

    // Clear logo error
    if (errors.logo) {
      setErrors((prev) => ({
        ...prev,
        logo: "",
      }));
    }
  };

  // Simplified and working drag handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (formMode === "edit" || formMode === "create") {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (formMode !== "edit" && formMode !== "create") {
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log("File dropped:", file.name, file.type);
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formMode !== "edit" && formMode !== "create") {
      return;
    }

    console.log("File input changed:", e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInputClick = () => {
    if (!isFormDisabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
    }));
    setImagePreview(null);
    setFileName("");
    dispatch(setFormDirty(true));

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Channel name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Channel name must be at least 2 characters";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Channel name must be less than 100 characters";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Channel category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setErrors({});
    setSuccessMessage("");

    try {
      if (formMode === "edit" && selectedChannel) {
        const result = await editChannel({
          id: selectedChannel,
          ...formData,
        }).unwrap();

        console.log("Update result:", result);
        setSuccessMessage("Channel profile updated successfully!");
        dispatch(setFormMode("view"));
      } else {
        const result = await createChannel(formData).unwrap();
        console.log("Create result:", result);
        setSuccessMessage("Channel profile created successfully!");

        // Reset form after creation
        setFormData({
          name: "",
          category: "",
          brandGuidelines: "",
          logo: null,
        });
        setImagePreview(null);
        setFileName("");
        dispatch(setSelectedChannel(null));
        dispatch(setFormMode("create"));
      }

      dispatch(setFormDirty(false));

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error: any) {
      console.error("Save error:", error);
      setErrors({
        submit:
          error?.data?.message ||
          error?.message ||
          "An error occurred while saving the profile",
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedChannel) {
      setErrors({ submit: "No channel selected for deletion" });
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this profile? This action cannot be undone."
      )
    ) {
      return;
    }

    setErrors({});
    setSuccessMessage("");

    try {
      await deleteChannel(selectedChannel).unwrap();
      setSuccessMessage("Channel profile deleted successfully!");

      // Reset form
      setFormData({
        name: "",
        category: "",
        brandGuidelines: "",
        logo: null,
      });
      setImagePreview(null);
      setFileName("");
      dispatch(setSelectedChannel(null));
      dispatch(setFormMode("create"));
      dispatch(setFormDirty(false));

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error: any) {
      console.error("Delete error:", error);
      setErrors({
        submit:
          error?.data?.message || error?.message || "Failed to delete profile",
      });
    }
  };

  // Handle new profile creation
  const handleNewProfile = () => {
    dispatch(setSelectedChannel(null));
    dispatch(setFormMode("create"));
    setFormData({
      name: "",
      category: "",
      brandGuidelines: "",
      logo: null,
    });
    setImagePreview(null);
    setFileName("");
    setErrors({});
    setSuccessMessage("");
    dispatch(setFormDirty(false));
  };

  // Theme classes
  const themeClasses = {
    background: isToggled ? "bg-gray-900" : "bg-gray-100",
    cardBg: isToggled
      ? "bg-gray-900 border-[#233648]"
      : "bg-gray-100 border-gray-200",
    text: {
      primary: isToggled ? "text-white" : "text-gray-900",
      secondary: isToggled ? "text-white" : "text-gray-900",
      label: isToggled ? "text-white" : "text-gray-900",
    },
    input: isToggled
      ? "w-full rounded-md border bg-[#192633] px-4 py-3 text-white placeholder:text-[#92adc9] focus:border-[#137fec] focus:ring-[#137fec]"
      : "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500",
    inputError: isToggled
      ? "w-full rounded-md border border-red-500 bg-[#192633] px-4 py-3 text-white placeholder:text-[#92adc9] focus:border-red-500 focus:ring-red-500"
      : "w-full rounded-md border border-red-500 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500",
    inputDisabled: isToggled
      ? "w-full rounded-md border bg-[#192633] px-4 py-3 text-gray-400 cursor-not-allowed opacity-60"
      : "w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-3 text-gray-600 cursor-not-allowed",
    select: isToggled
      ? "w-full rounded-md border border-[#324d67] bg-[#192633] px-4 py-3 text-white focus:border-[#137fec] focus:ring-[#137fec] appearance-none bg-no-repeat"
      : "w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 appearance-none bg-no-repeat",
    button: {
      primary: isToggled
        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400 disabled:cursor-not-allowed"
        : "bg-[#137fec] hover:scale-105 text-white disabled:bg-blue-300 disabled:cursor-not-allowed disabled:hover:scale-100",
      secondary: isToggled
        ? "bg-[#192633] hover:bg-gray-500 text-gray-100 rounded-md border border-[#324d67] disabled:bg-gray-600 disabled:cursor-not-allowed"
        : "bg-grey-100 hover:bg-gray-200 text-grey-900 rounded-md border border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed",
      edit: isToggled
        ? "bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-400 disabled:cursor-not-allowed"
        : "bg-orange-500 hover:bg-orange-600 text-white disabled:bg-orange-300 disabled:cursor-not-allowed",
      cancel: isToggled
        ? "bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
        : "bg-gray-500 hover:bg-gray-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed",
      delete: isToggled
        ? "border-red-300 text-red-600 hover:bg-red-50 disabled:text-red-400 disabled:cursor-not-allowed"
        : "border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:text-red-300 disabled:cursor-not-allowed",
    },
    uploadArea: isToggled
      ? "border-gray-300 bg-gray-50"
      : "border-[#324d67] bg-[#111a22]",
    error: "text-red-500 text-sm mt-1",
    success: isToggled ? "text-green-400" : "text-green-600",
  };

  const selectArrowIcon = isToggled
    ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"
    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2392adc9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E";

  const isFormDisabled = formMode === "view";

  if (channelsLoading) {
    return (
      <div className={`min-h-screen font-sans ${themeClasses.background}`}>
        <Navbar />
        <main className="flex flex-1 justify-center py-10">
          <div className="w-full max-w-3xl px-4">
            <div className={`text-center ${themeClasses.text.primary}`}>
              Loading channels...
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (channelsError) {
    return (
      <div className={`min-h-screen font-sans ${themeClasses.background}`}>
        <Navbar />
        <main className="flex flex-1 justify-center py-10">
          <div className="w-full max-w-3xl px-4">
            <div className={`text-center ${themeClasses.error}`}>
              Error loading channels: {channelsError.toString()}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${themeClasses.background}`}>
      <Navbar />
      <main className="flex flex-1 justify-center py-10">
        <div className="w-full max-w-3xl px-4">
          <div className="mb-8">
            <h1 className={`text-4xl font-bold ${themeClasses.text.primary}`}>
              Channel Profiles{" "}
              {formMode === "edit"
                ? "(Editing)"
                : formMode === "view"
                ? "(Viewing)"
                : "(Creating)"}
            </h1>
            <p className={`mt-2 text-lg ${themeClasses.text.secondary}`}>
              Manage channel identities for your different YouTube channels.
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              className={`mb-6 p-4 rounded-md border ${
                isToggled
                  ? "bg-green-900/20 border-green-500"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <p className={`${themeClasses.success}`}>{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div
              className={`mb-6 p-4 rounded-md border ${
                isToggled
                  ? "bg-red-900/20 border-red-500"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <p className={themeClasses.error}>{errors?.submit}</p>
            </div>
          )}

          <form onSubmit={handleSave}>
            {(channels?.length ?? 0) > 0 && (
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-full max-w-xs">
                    <label className="sr-only" htmlFor="brand-profile-select">
                      Select Brand Profile
                    </label>
                    <select
                      className={themeClasses.select}
                      id="brand-profile-select"
                      name="selectedProfile"
                      value={selectedChannel || ""}
                      onChange={handleProfileChange}
                      style={{
                        backgroundImage: `url("${selectArrowIcon}")`,
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1.5em 1.5em",
                        paddingRight: "3rem",
                      }}
                    >
                      <option value="">Select Profile...</option>
                      {channels?.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          {channel.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Edit/Cancel Button */}
                  {selectedChannel && (
                    <button
                      type="button"
                      onClick={
                        formMode === "edit"
                          ? handleCancelEdit
                          : handleEditProfile
                      }
                      className={`flex min-w-[100px] items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition-transform ${
                        formMode === "edit"
                          ? themeClasses.button.cancel
                          : themeClasses.button.edit
                      }`}
                    >
                      {formMode === "edit" ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>Cancel</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNewProfile}
                  className={`flex min-w-[200px] items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-bold shadow-lg transition-transform ${themeClasses.button.primary}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="truncate">New Brand Profile</span>
                </button>
              </div>
            )}

            <div className="space-y-8">
              {/* Brand Logo Section - COMPLETELY REWRITTEN */}
              <div className={`rounded-md border p-6 ${themeClasses.cardBg}`}>
                <h3
                  className={`mb-4 text-xl font-bold ${themeClasses.text.primary}`}
                >
                  Brand Logo
                </h3>

                <div className="flex items-start gap-6">
                  {/* Image Preview Area */}
                  <div className="flex-shrink-0">
                    <div
                      className={`relative flex h-32 w-32 items-center justify-center rounded-lg border-2 transition-colors ${
                        dragActive
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : "border-dashed border-gray-300 dark:border-gray-600"
                      } ${
                        imagePreview || formData.logo
                          ? "bg-gray-50 dark:bg-gray-800"
                          : isToggled
                          ? "bg-[#111a22]"
                          : "bg-gray-50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {imagePreview ? (
                        <>
                          <img
                            alt="Brand Logo Preview"
                            className="h-full w-full object-contain rounded-lg"
                            src={imagePreview}
                          />
                          {!isFormDisabled && (
                            <button
                              type="button"
                              onClick={removeImage}
                              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <svg
                            className={`mx-auto h-8 w-8 ${themeClasses.text.secondary} mb-2`}
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p
                            className={`text-xs ${themeClasses.text.secondary}`}
                          >
                            {dragActive ? "Drop image here" : "No image"}
                          </p>
                        </div>
                      )}
                    </div>

                    {fileName && (
                      <p
                        className={`mt-2 text-xs ${themeClasses.text.secondary} truncate max-w-32`}
                        title={fileName}
                      >
                        {fileName}
                      </p>
                    )}
                  </div>

                  {/* Upload Controls - SIMPLIFIED AND WORKING */}
                  <div className="flex-1">
                    <label
                      className={`block text-sm font-medium pb-2 ${themeClasses.text.label}`}
                      htmlFor="logo-upload"
                    >
                      Upload Logo
                    </label>

                    {/* Main drag and drop area */}
                    <div
                      className={`relative rounded-lg border-2 border-dashed p-6 transition-all duration-200 ${
                        dragActive
                          ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-105"
                          : isToggled
                          ? "border-gray-600 bg-gray-800/50"
                          : "border-gray-300 bg-gray-50"
                      } ${
                        isFormDisabled
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer hover:border-blue-400 hover: dark:hover:bg-blue-900/10"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={handleFileInputClick}
                    >
                      <div className="text-center">
                        <svg
                          className={`mx-auto h-10 w-10 ${
                            dragActive ? "text-blue-500" : themeClasses.text.secondary
                          } mb-3`}
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>

                        <div
                          className={`text-sm ${
                            dragActive ? "text-blue-600 dark:text-blue-400" : themeClasses.text.secondary
                          } mb-1 font-medium`}
                        >
                          {dragActive ? (
                            "Drop image here"
                          ) : (
                            <>
                              <span className="text-blue-600 dark:text-blue-400">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </>
                          )}
                        </div>

                        <p className={`text-xs ${themeClasses.text.secondary}`}>
                          PNG, JPG, SVG up to 5MB
                        </p>
                      </div>

                      {/* Hidden file input */}
                   <input
                        ref={fileInputRef}
                        className="sr-only"
                        id="logo-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleFileChange}
                        disabled={isFormDisabled}
                      />
                    </div>

                    {/* Alternative button for better UX */}
                    {/* <button
                      type="button"
                      disabled={isFormDisabled}
                      className={`mt-3 w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${themeClasses.button.secondary}`}
                      onClick={handleFileInputClick}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        {imagePreview ? "Change Image" : "Choose File"}
                      </span>
                    </button> */}

                    {errors.logo && (
                      <p className={`mt-2 ${themeClasses.error}`}>
                        {errors.logo}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Channel Information Section */}
              <div className={`rounded-md border p-6 ${themeClasses.cardBg}`}>
                <h3
                  className={`mb-4 text-xl font-bold ${themeClasses.text.primary}`}
                >
                  Channel Information
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      className={`block text-sm font-medium pb-2 ${themeClasses.text.label}`}
                      htmlFor="name"
                    >
                      Channel Name *
                    </label>
                    <input
                      className={
                        errors.name
                          ? themeClasses.inputError
                          : isFormDisabled
                          ? themeClasses.inputDisabled
                          : themeClasses.input
                      }
                      id="name"
                      name="name"
                      placeholder="e.g., TechGlow"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={isFormDisabled}
                      required
                    />
                    {errors.name && (
                      <p className={themeClasses.error}>{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium pb-2 ${themeClasses.text.label}`}
                      htmlFor="category"
                    >
                      Channel Category *
                    </label>
                    <input
                      className={
                        errors.category
                          ? themeClasses.inputError
                          : isFormDisabled
                          ? themeClasses.inputDisabled
                          : themeClasses.input
                      }
                      id="category"
                      name="category"
                      placeholder="e.g., Technology, Gaming, Lifestyle"
                      type="text"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={isFormDisabled}
                      required
                    />
                    {errors.category && (
                      <p className={themeClasses.error}>{errors.category}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Brand Inputs Section */}
              <div className={`rounded-md border p-6 ${themeClasses.cardBg}`}>
                <h3
                  className={`mb-4 text-xl font-bold ${themeClasses.text.primary}`}
                >
                  Custom Brand Inputs (Optional)
                </h3>
                <div>
                  <label
                    className={`block text-sm font-medium pb-2 ${themeClasses.text.label}`}
                    htmlFor="brand-guidelines"
                  >
                    Brand Guidelines
                  </label>
                  <textarea
                    className={`min-h-36 ${
                      isFormDisabled
                        ? themeClasses.inputDisabled
                        : themeClasses.input
                    }`}
                    id="brand-guidelines"
                    name="brandGuidelines"
                    placeholder="e.g., Always use a neon glow effect on text, prefer dark backgrounds, use mascot 'Sparky' in corner."
                    rows={4}
                    value={formData.brandGuidelines}
                    onChange={handleInputChange}
                    disabled={isFormDisabled}
                  />
                  <p className={`mt-2 text-xs ${themeClasses.text.secondary}`}>
                    Describe any other unique elements or rules for your brand's
                    thumbnails.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {(formMode === "edit" || formMode === "create") && (
                <div className="mt-8 flex justify-end gap-4">
                  {formMode === "edit" && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isLoading}
                      className={`flex min-w-[120px] items-center justify-center rounded-md border px-6 py-3 text-sm font-bold transition-colors ${themeClasses.button.delete}`}
                    >
                      <span className="truncate">
                        {isDeleting ? "Deleting..." : "Delete Profile"}
                      </span>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`flex min-w-[120px] items-center justify-center rounded-md px-6 py-3 text-sm font-bold shadow-lg transition-transform ${themeClasses.button.primary}`}
                  >
                    <span className="truncate">
                      {isLoading
                        ? formMode === "edit"
                          ? "Updating..."
                          : "Creating..."
                        : formMode === "edit"
                        ? "Update Profile"
                        : "Save Profile"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}