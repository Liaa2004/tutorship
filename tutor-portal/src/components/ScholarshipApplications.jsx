import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api/details"; // Adjust based on your API setup

const ScholarshipApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams(); // Class ID from URL params

  const user = JSON.parse(localStorage.getItem("user")); // Parse the user object
  const classId = id || user.classId; // Use the classId from URL or local storage

  useEffect(() => {
    fetchApplications();
  }, [id]); // Re-fetch when class ID changes

  const fetchApplications = async () => {
    try {
      const response = await axios.get(`/classes/${id}`);
      if (response.data.scholarshipApplications) {
        const applicationsWithUrls = response.data.scholarshipApplications.map(
          (application) => ({
            ...application,
            pdfUrl: `http://localhost:4000/scholarship-pdfs/${encodeURIComponent(
              application.fileName
            )}`,
          })
        );
        setApplications(applicationsWithUrls);
        console.log("applications:",applications);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error("Error fetching scholarship applications:", error);
    }
  };

  const updateApplicationStatus = async (appId, status) => {
    try {
      console.log("Updating application status:");
      console.log("Class ID:", classId);
      console.log("Application ID:", appId);
      console.log("New Status:", status);
      // Send a PUT request to update the application status
      const response = await axios.put(
        `http://localhost:4000/classes/${classId}`,
        {
          appId: appId, // Pass the application ID
          status: status, // Pass the new status
        }
      );

      if (response.data.success) {
        console.log("Application status updated successfully");
        // Optionally, you can refresh the applications or update the state here
        fetchApplications(); // Re-fetch applications to get updated status
      }
    } catch (error) {
      console.error(`Error updating application status to ${status}:`, error);
    }
  };

  const handleDownload = async (fileName) => {
    try{
        const authToken = localStorage.getItem("authToken"); // Assume token is stored in localStorage
        console.log(authToken)

        console.log(fileName);

        if (!authToken) {
          alert("Unauthorized! Please log in again.");
          return;
        }
     
        console.log(`http://localhost:4000/download/${fileName}`);

        const response = await fetch(`http://localhost:4000/download/${fileName}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${authToken}` }, // Send JWT for authentication
        });

        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // create download link
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log("File downloade successfully", fileName);

        // const { url } = await response.json();
        // window.open(url, "_blank"); // Open secure URL
    } catch (error) {
        console.error("Download failed:", error);
        alert(error.message);
    }
};


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scholarship Applications</h1>
      {applications.length > 0 ? (
        <table
          className="min-w-full bg-white"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--bg-tertiary)",
            color: "var(--text-primary)",
          }}
        >
          <thead>
            <tr
              className="w-full bg-gray-100 text-left text-gray-600 uppercase text-sm leading-normal"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--bg-tertiary)",
                color: "var(--text-primary)",
              }}
            >
              <th className="py-3 px-6">Student Name</th>
              <th className="py-3 px-6">Application Date</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">PDF</th>
              <th className="py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody
            className="text-gray-600 text-sm font-light"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          >
            {applications.map((application) => (
              <tr
                key={application.id}
                className="border-b border-gray-200 hover:border hover:border-teal-500"
              >
                <td className="py-3 px-6">{application.studentName}</td>
                <td className="py-3 px-6">{application.date}</td>
                <td className="py-3 px-6">{application.status}</td>
                <td className="py-3 px-6">
                  <button
                    className="text-blue-500 hover:underline mr-2"
                    onClick={() => setSelectedPdf(application.pdfUrl)}
                  >
                    View PDF
                  </button>
                  <a
                    onClick={() => handleDownload(application.fileName)} className="bg-blue-500 text-white px-4 py-2 rounded">
                    
                     
                    {/* // href={application.pdfUrl}
                    // download
                    // className="text-green-500 hover:underline" */}
                  {/* > */}
                    Download
                  </a>
                </td>
                <td className="border p-2">
                  <button
                    className="bg-green-500 text-black px-3 py-1 rounded mr-2 hover:bg-green-600 disabled:opacity-50"
                    onClick={() =>
                      updateApplicationStatus(application.id, "Approved")
                    }
                    disabled={application.status !== "Pending"}
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-500 text-black px-3 py-1 rounded hover:bg-red-600 disabled:opacity-50"
                    onClick={() =>
                      updateApplicationStatus(application.id, "Rejected")
                    }
                    disabled={application.status !== "Pending"}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No scholarship applications found for this class.</p>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-lg max-w-3xl w-full" style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}>
            <h2 className="text-lg font-bold mb-4">PDF Viewer</h2>
            <iframe
              src={selectedPdf}
              className="w-full h-96 border"
              title="PDF Viewer"
            ></iframe>
            <div className="mt-4 flex justify-between">
              <button
                className="bg-gray-500 text-black px-4 py-2 rounded hover:bg-gray-600"
                onClick={() => {
                  console.log("Closing PDF viewer");
                  setSelectedPdf(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipApplications;
