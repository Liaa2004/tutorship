import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "../api/details";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "datatables.net-buttons-dt";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons-dt/css/buttons.dataTables.min.css";
import "datatables.net-buttons/js/buttons.colVis.min.js";
import "datatables.net-buttons/js/buttons.html5";
import "datatables.net-buttons/js/buttons.print";
import "datatables.net-buttons/js/buttons.colVis";
import $ from "jquery";
import { Filter, ChevronDown } from "lucide-react";

DataTable.use(DT);

const ClassCGPA = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [classStats, setClassStats] = useState({ highest: 0, average: 0 });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All Students");

  useEffect(() => {
    fetchClassData();
  }, []);

  useEffect(() => {
    // Initialize filteredStudents with all students when data loads
    setFilteredStudents(students);
  }, [students]);

  const fetchClassData = async () => {
    try {
      const response = await axios.get(`/classes`, { params: { id } });
      if (response.data.length > 0) {
        const studentList = response.data[0].students || [];
        setStudents(studentList);
        calculateClassStats(studentList);
      } else {
        setStudents([]);
        setClassStats({ highest: 0, average: 0 });
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
  };

  const calculateClassStats = (students) => {
    if (students.length === 0) {
      setClassStats({ highest: 0, average: 0 });
      return;
    }

    const totalCGPA = students.reduce(
      (sum, student) => sum + parseFloat(student.cgpa || 0),
      0
    );
    const highestCGPA = Math.max(
      ...students.map((student) => parseFloat(student.cgpa || 0))
    );
    const averageCGPA = (totalCGPA / students.length).toFixed(2);

    setClassStats({ highest: highestCGPA, average: averageCGPA });
  };

  const handleFilter = (filterType) => {
    let filtered = [...students];
    
    switch (filterType) {
      case "highest":
        filtered.sort((a, b) => parseFloat(b.cgpa) - parseFloat(a.cgpa));
        setActiveFilter("Highest CGPA");
        break;
      case "lowest":
        filtered.sort((a, b) => parseFloat(a.cgpa) - parseFloat(b.cgpa));
        setActiveFilter("Lowest CGPA");
        break;
      case "9+":
        filtered = students.filter(s => parseFloat(s.cgpa) >= 9.0);
        setActiveFilter("9.0+ CGPA");
        break;
      case "8-9":
        filtered = students.filter(s => parseFloat(s.cgpa) >= 8.0 && parseFloat(s.cgpa) < 9.0);
        setActiveFilter("8.0-9.0 CGPA");
        break;
      case "7-8":
        filtered = students.filter(s => parseFloat(s.cgpa) >= 7.0 && parseFloat(s.cgpa) < 8.0);
        setActiveFilter("7.0-8.0 CGPA");
        break;
      case "below7":
        filtered = students.filter(s => parseFloat(s.cgpa) < 7.0);
        setActiveFilter("Below 7.0 CGPA");
        break;
      default:
        filtered = [...students]; // Reset to all students
        setActiveFilter("All Students");
        break;
    }
    
    setFilteredStudents(filtered);
    setShowFilterDropdown(false);
  };

  const handleInternalsClick = () => {
    navigate(`/class/${id}/internals`);
  };

  const handleRowClick = (student) => {
    // You can implement navigation to student details if needed
    // navigate(`/student/${student.id}`);
  };

  return (
    <div className="p-6 relative min-h-screen">
      <h1 className="text-2xl font-bold">CGPA Overview</h1>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Student CGPA List</h2>
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
            >
              <Filter size={18} />
              <span>{activeFilter}</span>
              <ChevronDown size={16} className={`transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1" style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}>
                  <button
                    onClick={() => handleFilter("all")}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    All Students
                  </button>
                  
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={() => handleFilter("9+")}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    9.0+ CGPA
                  </button>
                  <button
                    onClick={() => handleFilter("8-9")}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    8.0-9.0 CGPA
                  </button>
                  <button
                    onClick={() => handleFilter("7-8")}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    7.0-8.0 CGPA
                  </button>
                  <button
                    onClick={() => handleFilter("below7")}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    Below 7.0 CGPA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div
            className="bg-white shadow-md rounded-b-md overflow-hidden"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          >
            <DataTable
              data={filteredStudents} 
              columns={[
                { title: "Roll No", data: "id" },
                { title: "Name", data: "name" },
                {
                  title: "CGPA",
                  data: "cgpa",
                  render: (data) => parseFloat(data || 0).toFixed(2),
                },
              ]}
              options={{
                dom: '<"flex justify-between items-center mb-4"<"flex space-x-2"B><"ml-auto"f>>rtip',
                buttons: ["copy", "csv", "excel", "pdf", "print", "colvis"],
                paging: true,
                pageLength: 10,
                responsive: true,
                searching: true,
                ordering: true,
                order: [[0, "asc"]],
                language: {
                  search: "",
                  searchPlaceholder: "Search...",
                  paginate: {
                    previous: "«",
                    next: "»",
                  },
                },
                initComplete: function () {
                  const api = this.api();
                  $(api.table().header()).find("th").css({
                    "background-color": "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    "font-weight": "600",
                    "border-bottom": "1px solid var(--bg-tertiary)",
                  });
                  $(api.table().body()).css({
                    color: "var(--text-primary)",
                  });
                  $(api.buttons().container()).find(".dt-button").css({
                    "background-color": "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--bg-tertiary)",
                    "margin-right": "0.5rem",
                  });
                  $('input[type="search"]').css({
                    "background-color": "var(--bg-secondary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--bg-tertiary)",
                    padding: "0.25rem 0.5rem",
                    "border-radius": "0.25rem",
                  });
                },
                language: {
                  search: "",
                  searchPlaceholder: "Search...",
                  paginate: {
                    previous: "«",
                    next: "»",
                  },
                },
                createdRow: function (row, data, index) {
                  $(row).css("cursor", "pointer");
                  $(row).on("click", () => handleRowClick(data));
                },
              }}
            />
          </div>
        ) : (
          <p className="mt-4">No students found matching the filter.</p>
        )}
      </div>

      {/* Floating action button */}
      <button
        onClick={handleInternalsClick}
        className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-full shadow-lg transition duration-200 flex items-center"
      >
        Semester Internals
      </button>
    </div>
  );
};

export default ClassCGPA;