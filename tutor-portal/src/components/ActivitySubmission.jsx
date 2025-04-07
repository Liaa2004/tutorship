// components/ActivitySubmission.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/details";

const activityOptions = {
  Internship: { maxPoints: 10 },
  NSS: { maxPoints: 20 },
  NCC: { maxPoints: 15 },
  Sports: { maxPoints: 25 },
  "Technical Event": { maxPoints: 30 }
};

export default function ActivitySubmission() {
  const [activityType, setActivityType] = useState("");
  const [level, setLevel] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [maxPoints, setMaxPoints] = useState(0);
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;
  const classId = storedUser?.classId;
  const studentName = storedUser?.name;

  useEffect(() => {
    if (activityType && level) {
      const points = activityPointsMap[activityType]?.[level] || 0;
      setMaxPoints(points);
    }
  }, [activityType, level]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!activityType || !level || !file) {
      setMessage("Please fill all fields and select a file");
      return;
    }

    const formData = new FormData();
    formData.append("proof", file);
    formData.append("studentId", userId);
    formData.append("studentName", studentName);
    formData.append("classId", classId);
    formData.append("activityType", activityType);
    formData.append("level", level);
    formData.append("maxPoints", maxPoints);

    try {
      // Upload file
      const uploadResponse = await api.post("/upload-activity", formData);
      
      if (uploadResponse.data.success) {
        // Save activity details
        const activityData = {
          studentId: userId,
          studentName,
          classId,
          activityType,
          level,
          maxPoints,
          proofUrl: uploadResponse.data.filePath,
          pointsAwarded: 0,
          status: "Pending"
        };

        await api.post("/save-activity", activityData);
        setMessage("Activity submitted successfully!");
        setTimeout(() => navigate("/student/dashboard"), 2000);
      }
    } catch (error) {
      setMessage("Error submitting activity: " + error.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 dark:bg-gray-900">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Submit Activity</h2>
        
        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.includes("success") ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
            "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Activity Type</label>
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              required
            >
              <option value="">Select Activity Type</option>
              {Object.keys(activityPointsMap).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Level</label>
            <select
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
            >
              <option value="">Select Level</option>
              <option value="I">Level I</option>
              <option value="II">Level II</option>
              <option value="III">Level III</option>
              <option value="IV">Level IV</option>
              <option value="V">Level V</option>
            </select>
          </div>

          {maxPoints > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">
              <p className="font-medium">Maximum Points for this activity:</p>
              <p className="text-xl font-bold">{maxPoints}</p>
            </div>
          )}

          <div>
            <label className="block mb-1 font-medium">Proof Document</label>
            <input
              type="file"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              onChange={(e) => setFile(e.target.files[0])}
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload PDF or image proof of your activity
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Submit Activity
          </button>
        </form>
      </div>
    </div>
  );
}