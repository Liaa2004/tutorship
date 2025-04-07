import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/details";

const ActivityPoints = () => {
  const [activities, setActivities] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  const user = JSON.parse(localStorage.getItem("user")); // Parse the user object
  const classId = id || user.classId; // Use the classId from URL or local storage

  useEffect(() => {
    fetchActivities();
  }, [id]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/activityPoints?classId=${id}`);
      //console.log(response)
      // Ensure we have an array and each item has required properties
      const validatedActivities = Array.isArray(response.data)
        ? response.data.map((activity) => ({
            id: activity.id || "",
            studentName: activity.studentName || "Unknown",
            activityType: activity.activityType || "Unknown",
            level: activity.level || "",
            maxPoints: activity.maxPoints || 0,
            proofUrl: activity.proofUrl || "",
            status: activity.status || "Pending",
            pointsAwarded: activity.pointsAwarded || 0,
          }))
        : [];
      setActivities(validatedActivities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      setError("Failed to load activities. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (activityId, status, points) => {
    try {
      const activity = activities.find((a) => a.id === activityId);
      if (!activity) {
        alert("Activity not found.");
        return;
      }

      console.log("Updating application status:");
      console.log("Class ID:", classId);
      console.log("Application ID:", activityId);
      console.log("New Status:", status);
      console.log("Awarded Points:",points)

      const pointsAwarded =
        status === "Approved"
          ? Math.max(0, Math.min(points, activity.maxPoints))
          : 0;

      // Optimistically update the UI
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                status,
                pointsAwarded,
                ...a,
                decisionDate: new Date().toISOString(),
              }
            : a
        )
      );

      const response = await axios.put(`http://localhost:4000/activity-points/${activityId}`, {
        ...activity,
        status,
        pointsAwarded,
        decisionDate: new Date().toISOString(),
      });

      // Ensure we're using the correct response structure
      const updatedActivity = response.data.activity || response.data;

      // Final update with server response
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId ? { ...a, ...updatedActivity } : a
        )
      );
    } catch (error) {
      console.error("Error updating activity:", error);
      // Revert optimistic update on error
      fetchActivities();
      if (error.response) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("An unexpected error occurred.");
      }
    }
  };
 

  

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Activity Points Approval</h2>
      {activities.length === 0 ? (
        <p>No activity submissions found for this class.</p>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr
                className="bg-gray-100 dark:bg-gray-700"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
              >
                <th className="p-2 border">Student</th>
                <th className="p-2 border">Activity</th>
                <th className="p-2 border">Level</th>
                <th className="p-2 border">Max Points</th>
                <th className="p-2 border">Proof</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                if (!activity) return null; // Skip undefined activities

                const isPending = (activity.status || "Pending") === "Pending";

                return (
                  <tr key={activity.id} className="border dark:border-gray-700">
                    <td className="p-2 border dark:border-gray-700">
                      {activity.studentName}
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      {activity.activityType}
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      {activity.level}
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      {activity.maxPoints}
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      {activity.proofUrl && (
                        <button
                          onClick={() =>
                            setSelectedPdf(
                              `http://localhost:4000${activity.proofUrl}`
                            )
                          }
                          className="text-blue-500 hover:underline"
                        >
                          View
                        </button>
                      )}
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      <span
                        className={`px-2 py-1 rounded ${
                          activity.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : activity.status === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {activity.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-2 border dark:border-gray-700">
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={activity.maxPoints}
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--bg-tertiary)",
                            color: "var(--text-primary)",
                          }}
                          value={activity.pointsAwarded || 0}
                          onChange={(e) => {
                            if (isPending) {
                              const newValue = Math.min(
                                Math.max(0, e.target.value),
                                activity.maxPoints
                              );
                              setActivities((prev) =>
                                prev.map((a) =>
                                  a.id === activity.id
                                    ? { ...a, pointsAwarded: newValue }
                                    : a
                                )
                              );
                            }
                          }}
                          className={`w-16 border p-1 dark:bg-gray-800 dark:border-gray-700 ${
                            !isPending ? "bg-gray-100 cursor-not-allowed" : ""
                          }`}
                          disabled={!isPending}
                        />
                        <button
                          onClick={() =>
                            isPending &&
                            handleStatusChange(
                              activity.id,
                              "Approved",
                              activity.pointsAwarded || 0
                            )
                          }
                          className={`px-2 py-1 rounded ${
                            isPending
                              ? "bg-green-500 text-white hover:bg-green-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={!isPending}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            isPending &&
                            handleStatusChange(activity.id, "Rejected", 0)
                          }
                          className={`px-2 py-1 rounded ${
                            isPending
                              ? "bg-red-500 text-white hover:bg-red-600"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                          disabled={!isPending}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* PDF Viewer Modal */}
          {selectedPdf && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" >
              <div className="p-4 rounded shadow-lg max-w-3xl w-full" style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }} >
                <div className="flex justify-between items-center mb-4" >
                  <h2 className="text-lg font-bold">Proof Document</h2>
                  <button
                    onClick={() => setSelectedPdf(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                  >
                    ✕
                  </button>
                </div>
                <iframe
                  src={selectedPdf}
                  className="w-full h-96 border dark:border-gray-700"
                  title="Proof Viewer"
                ></iframe>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityPoints;
