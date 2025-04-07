import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/details"; // Import Axios instance

const activityPointsMap = {
  Internship: { I: 10, II: 20, III: 30, IV: 40, V: 50 },
  NSS: { I: 5, II: 10, III: 15, IV: 20, V: 25 },
  NCC: { I: 7, II: 14, III: 21, IV: 28, V: 35 },
  "Technical Event": { I: 8, II: 16, III: 24, IV: 32, V: 40 },
  Sports: { I: 6, II: 12, III: 18, IV: 24, V: 30 },
};

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [classData, setClassData] = useState(null);
  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);
  const [activityType, setActivityType] = useState("");
  const [level, setLevel] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const [message, setMessage] = useState("");
  const [applications, setApplications] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser.id;
  const classId = storedUser.classId;
  const userRole = localStorage.getItem("role");

  const fetchStudentData = async () => {
    try {
      const response = await api.get(`classes/${classId}`);
      setClassData(response.data);
      const studentDetails = response.data.students.find(
        (student) => student.id === userId
      );
      setStudent(studentDetails);
    } catch (error) {
      console.error("Error fetching class data:", error);
      setMessage("Failed to load class data.");
    }
  };

  useEffect(() => {
    if (!storedUser || userRole !== "student") {
      navigate("/"); // Redirect if not a student
      return;
    }

    fetchStudentData();
  }, [navigate]);

  useEffect(() => {
    if (activityType && level) {
      setMaxPoints(activityPointsMap[activityType]?.[level] || "N/A");
    }
  }, [activityType, level]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getTotalPoints = () => {
    if (!student || !student.requests) return 0;
    return student.requests
      .filter(
        (req) => req.category === "certificate" && req.status === "Approved"
      )
      .reduce((total, req) => total + (req.awardedPoints || 0), 0);
  };

  const handleApplicationRequest = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !category ||
      !file ||
      (category === "certificate" && (!activityType || !level))
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("studentId", student.id);
    formData.append("category", category);
    formData.append("proof", file);
    formData.append("studentName", student.name);
    formData.append("classId", classId);
    if (category === "certificate") {
      formData.append("activityType", activityType);
      formData.append("level", level);
      formData.append("maxPoints", maxPoints);
    }

    try {
      const uploadUrl =
        category === "certificate"
          ? "http://localhost:4000/upload-activity"
          : "http://localhost:4000/upload";

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await uploadResponse.json();

      console.log(data);

      if (!uploadResponse.ok || !data.success) {
        throw new Error(
          `Failed to upload file: ${data.message || "Unknown error"}`
        );
      }

      console.log("File uploaded successfully to:", data.filePath);
      setMessage(`File uploaded successfully!`);

      if (category === "certificate") {
        const newActivity = {
          id: `act-${Date.now()}`,
          studentId: userId,
          studentName: student.name,
          classId: classId,
          activityType,
          level,
          maxPoints,
          proofUrl: data.filePath,
        };

        await api.post("/activityPoints", newActivity);
      }

      const newRequest = {
        id: `req-${Date.now()}`,
        category: category,
        status: "Pending",
        fileName: data.filename,
        date: new Date().toISOString(),
      };

      const newApplication = {
        id: newRequest.id,
        studentId: userId,
        studentName: student.name,
        category: category,
        status: "Pending",
        fileName: data.filename,
        date: new Date().toISOString(),
      };

      // Update the state to include the new application
      setApplications((prevApplications) => [
        ...prevApplications,
        newApplication,
      ]);

      const updatedStudents = classData.students.map((student) => {
        if (student.id === userId) {
          return {
            ...student,
            requests: [...student.requests, newRequest],
          };
        }
        return student;
      });

      const updatedClass = {
        ...classData,
        students: updatedStudents,
        scholarshipApplications: [
          ...classData.scholarshipApplications,
          newApplication,
        ],
      };

      await api.put(`classes/${classId}`, updatedClass);
      console.log("Student request added");
      fetchStudentData(); // Refresh student data to show the new request
    } catch (error) {
      console.error("Application request error:", error);
      setMessage(`Something went wrong. Please try again: ${error.message}`);
    }
  };

  const groupRequestsByCategory = () => {
    if (!student || !student.requests) return {};
    return student.requests.reduce((acc, request) => {
      if (!acc[request.category]) {
        acc[request.category] = [];
      }
      acc[request.category].push(request);
      return acc;
    }, {});
  };

  const categorizedRequests = groupRequestsByCategory();

  return (
    <div
      className="min-h-screen p-6 bg-gray-100"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--bg-tertiary)",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="bg-black p-6 rounded-lg shadow-md max-w-md mx-auto"
        style={{
          backgroundColor: "var(--bg-secondary)",
          borderColor: "var(--bg-tertiary)",
          color: "var(--text-primary)",
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-4">
          Student Dashboard
        </h2>

        {student && classData ? (
          <div>
            <p>
              <strong>Name:</strong> {student.name}
            </p>
            <p>
              <strong>Roll No:</strong> {student.rollNumber}
            </p>
            <p>
              <strong>Gender:</strong> {student.gender}
            </p>

            <h3 className="mt-4 font-semibold">Request an Application</h3>
            <form
              onSubmit={handleApplicationRequest}
              className="space-y-4 mt-2"
            >
              <select
                className="w-full p-2 border rounded"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="scholarship">Scholarship</option>
                <option value="internship">Internship</option>
                <option value="certificate">Activities/Certificates</option>
              </select>

              {category === "certificate" && (
                <>
                  <select
                    className="w-full p-2 border rounded"
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                  >
                    <option value="">Select Activity Type</option>
                    {Object.keys(activityPointsMap).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>

                  <select
                    className="w-full p-2 border rounded"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="">Select Level</option>
                    <option value="I">Level I</option>
                    <option value="II">Level II</option>
                    <option value="III">Level III</option>
                    <option value="IV">Level IV</option>
                    <option value="V">Level V</option>
                  </select>

                  {maxPoints && (
                    <p className="text-sm text-gray-300">
                      Max Points: {maxPoints}
                    </p>
                  )}
                </>
              )}

              <input
                type="file"
                className="w-full p-2 border rounded"
                onChange={handleFileChange}
              />

              {message && <p className="text-sm text-red-500">{message}</p>}

              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Submit Application
              </button>
            </form>

            {/* View Submitted Requests */}
            <div
              className="bg-gray-50 p-4 rounded-lg"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
              }}
            >
              <h3 className="text-lg font-semibold mb-3">Submitted Requests</h3>

              {Object.keys(categorizedRequests).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(categorizedRequests).map(
                    ([category, requests]) => (
                      <div
                        key={category}
                        className="border rounded-lg overflow-hidden"
                      >
                        <button
                          className="w-full flex justify-between items-center p-3 bg-gray-100 hover:bg-gray-200"
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderColor: "var(--bg-tertiary)",
                            color: "var(--text-primary)",
                          }}
                          onClick={() => toggleCategory(category)}
                        >
                          <span className="font-medium">
                            {category === "certificate"
                              ? `Activities/Certificates (Total Points: ${requests
                                  .filter((req) => req.status === "Approved")
                                  .reduce(
                                    (sum, req) =>
                                      sum + (req.awardedPoints || 0),
                                    0
                                  )})`
                              : category}
                          </span>
                          <span>
                            {expandedCategory === category ? "▲" : "▼"}
                          </span>
                        </button>

                        {expandedCategory === category && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead
                                className="bg-gray-50"
                                style={{
                                  backgroundColor: "var(--bg-secondary)",
                                  borderColor: "var(--bg-tertiary)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                <tr>
                                  <th className="px-4 py-2 text-left">
                                    File Name
                                  </th>
                                  <th className="px-4 py-2 text-left">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left">Date</th>
                                  {category === "certificate" && (
                                    <>
                                      <th className="px-4 py-2 text-left">
                                        Activity Type
                                      </th>
                                      <th className="px-4 py-2 text-left">
                                        Level
                                      </th>
                                      <th className="px-4 py-2 text-left">
                                        Max Points
                                      </th>
                                      <th className="px-4 py-2 text-left">
                                        Points Awarded
                                      </th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {requests.map((request) => (
                                  <tr
                                    key={request.id}
                                    className="hover:border-green-500 hover:border-l-4 transition-colors duration-200"
                                  >
                                    <td className="px-4 py-2">
                                      {request.fileName}
                                    </td>
                                    <td className="px-4 py-2">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs ${
                                          request.status === "Approved"
                                            ? "bg-green-100 text-green-800"
                                            : request.status === "Rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {request.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2">
                                      {new Date(
                                        request.date
                                      ).toLocaleDateString()}
                                    </td>
                                    {category === "certificate" && (
                                      <>
                                        <td className="px-4 py-2">
                                          {request.activityType || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {request.level || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {request.maxPoints || "-"}
                                        </td>
                                        <td className="px-4 py-2">
                                          {request.status === "Approved"
                                            ? request.awardedPoints ||
                                              "Pending approval"
                                            : "-"}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No submitted requests found.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Loading student details...</p>
        )}
      </div>
    </div>
  );
}
