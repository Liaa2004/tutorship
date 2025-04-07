import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/details";

const AllRequests = () => {
  const [allRequests, setAllRequests] = useState([]);
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;
  const classId = storedUser?.classId;

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      const response = await api.get(`classes/${classId}`);

      const scholarshipRequests = response.data.scholarshipApplications
        .filter(req => req.studentId === userId)
        .map(req => ({
          id: req.id,
          category: "Scholarship",
          status: req.status,
          detail: `Scholarship (${req.status})`,
          date: req.date
        }));

      const activityRequests = await api.get("/activityPoints");
      const studentActivity = activityRequests.data
        .filter(req => req.studentId === userId)
        .map(req => ({
          id: req.id,
          category: "Activity",
          status: `${req.pointsAwarded || "Pending"} Points`,
          detail: `${req.activityType} (${req.pointsAwarded || "Pending"} Points)`,
          date: req.date
        }));

      const allRequestsSorted = [...scholarshipRequests, ...studentActivity].sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );

      setAllRequests(allRequestsSorted);
    } catch (error) {
      console.error("Error fetching all requests:", error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-center mb-4">All Requests</h2>

        {allRequests.length > 0 ? (
          <table className="min-w-full bg-white mt-2">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Date</th>
              </tr>
            </thead>
            <tbody>
              {allRequests.map(req => (
                <tr key={req.id} className="border-b border-gray-200">
                  <td className="py-3 px-6">{req.category}</td>
                  <td className="py-3 px-6">{req.status}</td>
                  <td className="py-3 px-6">{new Date(req.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2">No requests found.</p>
        )}

        <button
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded w-full hover:bg-gray-600"
          onClick={() => navigate("/student/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AllRequests;
