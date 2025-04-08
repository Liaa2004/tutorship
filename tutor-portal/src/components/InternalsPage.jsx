import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../api/details";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Upload,
  Search,
  X,
  Copy,
  FileDown,
  Trash2
} from "lucide-react";
import * as XLSX from "xlsx"; // Import the xlsx library

const InternalsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internals, setInternals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSemesters, setTotalSemesters] = useState(0);
  const [expandedSemester, setExpandedSemester] = useState(null);
  const [uploading, setUploading] = useState({});
  const [deleting, setDeleting]=useState({});
  const [files, setFiles] = useState(() => {
    const savedFiles = localStorage.getItem(`class_${id}_files`);
    return savedFiles ? JSON.parse(savedFiles) : {};
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [semesterSearchQuery, setSemesterSearchQuery] = useState({});
  const [semesterSearchResults, setSemesterSearchResults] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchInternalsData();
  }, []);

  useEffect(() => {
    localStorage.setItem(`class_${id}_files`, JSON.stringify(files));
  }, [files, id]);

  const fetchInternalsData = async () => {
    try {
      setLoading(true);
      const classResponse = await axios.get(`/classes/${id}`);
      const classData = classResponse.data;
      setTotalSemesters(classData.semesters || 0);
      setInternals(classData.internals || []); // Store the internals data

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  // const handleSearch = () => {
  //   if (!searchQuery.trim()) {
  //     setShowSearchResults(false);
  //     return;
  //   }

  //   // Filter the internals data based on the search query
  //   const results = internals.filter((internal) => {
  //     return internal.extractedData.students.some((student) => {
  //       return (
  //         student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //         student.registerNo.toLowerCase().includes(searchQuery.toLowerCase())
  //       );
  //     });
  //   });

  //   setSearchResults(results);
  //   setShowSearchResults(true);
  // };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const studentResults = [];

    // Find all semesters where this student appears
    internals.forEach((internal) => {
      const matchingStudent = internal.extractedData.students.find(
        (student) => {
          return (
            student.name.toLowerCase().includes(query) ||
            student.registerNo.toLowerCase().includes(query)
          );
        }
      );

      if (matchingStudent) {
        studentResults.push({
          semester: internal.semester,
          studentData: matchingStudent,
        });
      }
    });

    // Get all unique semesters
    const allSemesters = internals.map((internal) => internal.semester);
    const studentSemesters = studentResults.map((r) => r.semester);

    // Add "Not Available" for missing semesters
    allSemesters.forEach((sem) => {
      if (!studentSemesters.includes(sem)) {
        studentResults.push({
          semester: sem,
          studentData: {
            registerNo: searchQuery,
            name: "Not Available",
            subjects: {},
          },
        });
      }
    });

    // Sort by semester
    studentResults.sort((a, b) => a.semester - b.semester);

    setSearchResults(studentResults);
    setShowSearchResults(true);
  };

  const handleSemesterSearch = (sem) => {
    const query = semesterSearchQuery[sem]?.trim();
    if (!query) {
      setSemesterSearchResults((prev) => ({ ...prev, [sem]: null }));
      return;
    }

    // Find the internal data for the specified semester
    const semesterData = internals.find(
      (internal) => internal.semester === sem.toString()
    );

    // If semesterData is found and has students, filter them based on the query
    const results =
      semesterData &&
      semesterData.extractedData &&
      semesterData.extractedData.students
        ? semesterData.extractedData.students.filter((student) => {
            return (
              student.name.toLowerCase().includes(query.toLowerCase()) ||
              student.registerNo.toLowerCase().includes(query.toLowerCase())
            );
          })
        : []; // If no data found, return an empty array

    setSemesterSearchResults((prev) => ({ ...prev, [sem]: results }));
  };

  const handleBackClick = () => {
    navigate(`/class/${id}/cgpa`);
  };

  // Export semester search results to Excel
  const exportSemesterToExcel = (sem) => {
    const results = semesterSearchResults[sem];
    if (!results || results.length === 0) return;

    const data = results.map((student) => {
      const studentData = {
        Name: student.name,
        "Register No": student.registerNo,
      };

      Object.entries(student.subjects).forEach(([code, subject]) => {
        studentData[`${subject.name} (${code}) - Attendance`] =
          subject.A || "-";
        studentData[`${subject.name} (${code}) - Internal`] = subject.I || "-";
        studentData[`${subject.name} (${code}) - Eligibility`] =
          subject.E || "-";
      });

      return studentData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Semester ${sem} Results`
    );
    XLSX.writeFile(workbook, `semester_${sem}_results.xlsx`);
  };

  // Copy semester search results to clipboard
  const copySemesterToClipboard = (sem) => {
    const results = semesterSearchResults[sem];
    if (!results || results.length === 0) return;

    // Get all unique headers (columns)
    const allHeaders = new Set(["Name", "Register No"]);

    // First collect all possible subject headers
    results.forEach((student) => {
      Object.entries(student.subjects).forEach(([code, subject]) => {
        allHeaders.add(`${subject.name} (${code}) - Attendance`);
        allHeaders.add(`${subject.name} (${code}) - Internal`);
        allHeaders.add(`${subject.name} (${code}) - Eligibility`);
      });
    });

    const headers = Array.from(allHeaders);

    // Create CSV rows
    const csvRows = [
      headers.join(","), // Header row
      ...results.map((student) => {
        const rowData = {
          Name: student.name,
          "Register No": student.registerNo,
        };

        // Add subject data
        Object.entries(student.subjects).forEach(([code, subject]) => {
          rowData[`${subject.name} (${code}) - Attendance`] = subject.A || "-";
          rowData[`${subject.name} (${code}) - Internal`] = subject.I || "-";
          rowData[`${subject.name} (${code}) - Eligibility`] = subject.E || "-";
        });

        // Ensure all columns are present (empty if not)
        return headers
          .map((header) => {
            const value = rowData[header];
            // Properly escape CSV values
            if (value === undefined || value === null) return '""';
            return `"${value.toString().replace(/"/g, '""')}"`;
          })
          .join(",");
      }),
    ];

    const csvString = csvRows.join("\n");

    navigator.clipboard
      .writeText(csvString)
      .then(() => alert("Copied semester results to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard");
      });
  };

  const toggleSemester = (sem) => {
    setExpandedSemester(expandedSemester === sem ? null : sem);
  };

  const handleFileUpload = async (sem, e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [sem]: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `http://localhost:4000/classes/${id}/internals/upload?semester=${sem}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFiles((prev) => ({ ...prev, [sem]: response.data.fileUrl }));
      fetchInternalsData();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading((prev) => ({ ...prev, [sem]: false }));
    }
  };

  const handleDeleteFile = async (sem) => {
    setDeleting((prev) => ({ ...prev, [sem]: true }));
  
    try {
      // Only try to delete if the semester exists in internals
      const semesterExists = internals.some(internal => internal.semester === sem.toString());
      if (semesterExists) {
        await axios.delete(`http://localhost:4000/classes/${id}/internals?semester=${sem}`);
      }
  
      // Update local state
      setFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[sem];
        return newFiles;
      });
  
      // Refresh data
      fetchInternalsData();
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setDeleting((prev) => ({ ...prev, [sem]: false }));
      setDeleteConfirm(null);
    }
  };

  const semesterNumbers = Array.from(
    { length: totalSemesters },
    (_, i) => i + 1
  );

  const renderStudentMarks = (student) => {
    if (!student?.subjects) return null;

    return Object.entries(student.subjects).map(([subjectCode, data]) => (
      <div key={`${student.registerNo}-${subjectCode}`} className="mb-2">
        <h4 className="font-medium">{data.name}</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>A: {data.A || "-"}</div>
          <div>I: {data.I || "-"}</div>
          <div>E: {data.E || "-"}</div>
        </div>
      </div>
    ));
  };

  const renderSemesterContent = (sem) => {
    // Check if this semester exists in the internals data
    const semesterExists = internals.some(internal => internal.semester === sem.toString());
    
    if (!semesterExists) {
      return (
        <div className="p-3">
          <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center">
              <Upload size={20} className="mb-2 text-gray-500" />
              <p className="text-sm text-gray-500">
                <span className="font-medium">Upload Internals PDF</span>
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileUpload(sem, e)}
              className="hidden"
            />
          </label>
          {uploading[sem] && (
            <p className="text-center text-sm text-gray-500 mt-2">Uploading...</p>
          )}
        </div>
      );
    }
  
    if (deleteConfirm === sem) {
      return (
        <div className="p-3 space-y-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <p className="text-yellow-800 text-sm mb-2">
              Are you sure you want to delete this semester's data? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFile(sem)}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                disabled={deleting[sem]}
              >
                {deleting[sem] ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      );
    }
  
    if (files[sem]) {
      return (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-end gap-2">
            {/* Add Export and Copy buttons here */}
            {semesterSearchResults[sem]?.length > 0 && (
              <>
                <button
                  onClick={() => exportSemesterToExcel(sem)}
                  className="text-sm flex items-center text-green-600 hover:text-green-800"
                >
                  <FileDown size={14} className="mr-1" />
                  Export to Excel
                </button>
                <button
                  onClick={() => copySemesterToClipboard(sem)}
                  className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Copy size={14} className="mr-1" />
                  Copy to Clipboard
                </button>
              </>
            )}
            <button
              onClick={() => setDeleteConfirm(sem)}
              className="text-sm flex items-center text-red-600 hover:text-red-800"
            >
              <Trash2 size={14} className="mr-1" />
              Delete Semester Data
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search student by name or ID..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={semesterSearchQuery[sem] || ""}
              onChange={(e) =>
                setSemesterSearchQuery((prev) => ({
                  ...prev,
                  [sem]: e.target.value,
                }))
              }
              onKeyPress={(e) => e.key === "Enter" && handleSemesterSearch(sem)}
            />
            <Search
              size={16}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            {semesterSearchQuery[sem] && (
              <button
                onClick={() => {
                  setSemesterSearchQuery((prev) => ({ ...prev, [sem]: "" }));
                  setSemesterSearchResults((prev) => ({
                    ...prev,
                    [sem]: null,
                  }));
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {semesterSearchResults[sem] && (
            <div className="mt-3 space-y-3">
              {semesterSearchResults[sem].length > 0 ? (
                semesterSearchResults[sem].map((student) => (
                  <div
                    key={student.registerNo}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-sm text-gray-600">
                          {student.registerNo}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">{renderStudentMarks(student)}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">
                  No students found
                </p>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="p-3">
        <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
          <div className="flex flex-col items-center justify-center">
            <Upload size={20} className="mb-2 text-gray-500" />
            <p className="text-sm text-gray-500">
              <span className="font-medium">Upload Internals PDF</span>
            </p>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileUpload(sem, e)}
            className="hidden"
          />
        </label>
        {uploading[sem] && (
          <p className="text-center text-sm text-gray-500 mt-2">Uploading...</p>
        )}
      </div>
    );
  };
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={handleBackClick}
            className="mr-3 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">Semester Internals</h1>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by roll number or name..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setShowSearchResults(false);
            }}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {showSearchResults ? (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Search Results</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowSearchResults(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Back to semesters
              </button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <> 
              {searchResults.map((result, index) => (
                <div key={index} className="mb-6">
                  <h3 className="font-bold mb-2 text-blue-700">
                    Semester {result.semester}
                  </h3>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {result.studentData.name}
                          </h4>
                          {result.studentData.registerNo !== searchQuery && (
                            <p className="text-sm text-gray-600">
                              {result.studentData.registerNo}
                            </p>
                          )}
                        </div>
                      </div>
                      {result.studentData.name !== "Not Available" ? (
                        <div className="mt-3">
                          {renderStudentMarks(result.studentData)}
                        </div>
                      ) : (
                        <p className="text-gray-500 mt-2">
                          No data available for this semester
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="text-gray-500">No results found</p>
          )}
        </div>
      ) : loading ? (
        <p>Loading...</p>
      ) : totalSemesters > 0 ? (
        <div className="space-y-3">
          {semesterNumbers.map((sem) => (
            <div
              key={sem}
              className="border rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--bg-tertiary)",
              }}
            >
              <button
                onClick={() => toggleSemester(sem)}
                className="w-full flex justify-between items-center p-3 hover:bg-opacity-90 transition-colors text-sm"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              >
                <span className="font-medium">Semester {sem}</span>
                {expandedSemester === sem ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </button>

              {expandedSemester === sem && renderSemesterContent(sem)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No semester data available</p>
      )}
    </div>
  );
};

export default InternalsPage;
