import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "../api/details";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Download, Filter, X, Edit2, Eye } from "lucide-react";
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
import "../css/Students.css";

DataTable.use(DT);

const Students = () => {
  const { id } = useParams();
  const [students, setStudents] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editedStudent, setEditedStudent] = useState(null);
  const [filters, setFilters] = useState({
    gender: "All",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/classes`, { params: { id } });
        setStudents(
          response.data.length > 0 ? response.data[0].students || [] : []
        );
      } catch (error) {
        setError("Error fetching students. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [id]);

  // Apply Filters
  const applyFilters = () => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGender =
        filters.gender === "All" || student.gender === filters.gender;

      return matchesSearch && matchesGender;
    });
  };

  const filteredStudents = applyFilters();

  const resetFilters = () => {
    setFilters({
      gender: "All",
    });
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredStudents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "students.xlsx");
  };

  const handleRowClick = (student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setShowDetails(true);
    setEditMode(false);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setEditedStudent({ ...student });
    setEditMode(false);
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleChange = (e) => {
    setEditedStudent({ ...editedStudent, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const classId = "1";

      const classResponse = await axios.get(`/classes/${classId}`);

      const updatedStudents = classResponse.data.students.map((s) =>
        s.id === editedStudent.id ? editedStudent : s
      );

      await axios.put(`/classes/${classId}`, {
        ...classResponse.data,
        students: updatedStudents,
      });

      setStudents((prev) =>
        prev.map((s) => (s.id === editedStudent.id ? editedStudent : s))
      );
      setSelectedStudent(editedStudent);
      setEditMode(false);
    } catch (error) {
      setError("Error saving student data. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditedStudent({ ...selectedStudent });
    setEditMode(false);
  };

  return (
    <div className="p-6">
      {/* Search & Filter Section */}
      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Filter & Export Buttons */}
        <div className="flex items-center gap-4 ml-auto relative">
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="bg-transparent text-gray-700 hover:text-teal-500 flex items-center"
              title="Filter By"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--bg-tertiary)",
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
            </button>

            {isFilterOpen && (
              <div
                className="absolute right-0 mt-2 bg-white border shadow-lg rounded-lg p-4 w-64 z-10"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                }}
              >
                {/* Close Button */}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Filter Options</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✖
                  </button>
                </div>

                {/* Gender Filter */}
                <label className="block mb-2">
                  Gender:
                  <select
                    value={filters.gender}
                    onChange={(e) =>
                      setFilters({ ...filters, gender: e.target.value })
                    }
                    className="border p-2 rounded w-full" style={{
                      backgroundColor: "var(--bg-secondary)",
                      borderColor: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="All">All</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </label>

                {/* Apply & Reset Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={resetFilters}
                    className="bg-gray-300 px-4 py-2 rounded"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="bg-transparent text-gray-700 hover:text-teal-500 flex items-center"
            title="Export as Excel"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
            }}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && <p>Loading students...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* Students List */}
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
            {
              title: "Roll No",
              data: "rollNumber",
            },
            {
              title: "Name",
              data: "name",
            },
          ]}
          options={{
            dom: '<"flex justify-between items-center mb-4"<"flex space-x-2"B><"ml-auto"f>>rtip',
            buttons: [
              {
                extend: "copy",
                text: "Copy",
                className: "btn-copy",
                titleAttr: "Copy to clipboard",
                exportOptions: {
                  // Specify which columns to include in the copy
                  columns: ":visible",
                  action: function (e, dt, node, config) {
                    // Use the HTML5 copy button
                    $.fn.dataTable.ext.buttons.copyHtml5.action.call(
                      this,
                      e,
                      dt,
                      node,
                      config
                    );
                    // Show notification
                    alert("Copied to clipboard");
                  },
                },
              },
              {
                extend: "csv",
                text: "CSV",
                className: "btn-csv",
              },
              {
                extend: "excel",
                text: "Excel",
                className: "btn-excel",
              },
              {
                extend: "pdf",
                text: "PDF",
                className: "btn-pdf",
              },
              {
                extend: "print",
                text: "Print",
                className: "btn-print",
              },
              {
                extend: "colvis",
                text: "Column visibility",
                className: "btn-colvis",
                collectionLayout: "fixed two-column",
                postfixButtons: ["colvisRestore"],
              },
            ],
            paging: true,
            pageLength: 10,
            responsive: true,
            searching: true,
            ordering: true,
            order: [[0, "asc"]],
            initComplete: function () {
              $(this.api().table().container()).addClass('dt-align-fix');
              const api = this.api();
              const table = api.table();

             

              // Apply container styling
              $(table.container()).addClass("modern-aligned-table").css({
                "border-radius": "8px",
                overflow: "hidden",
                "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
                "font-family": "system-ui, sans-serif",
              });

              // Header styling
              $(table.header()).find("th").css({
                "background-color": "var(--bg-secondary)",
                color: "var(--text-primary)",
                "font-weight": "600",
                "text-align": "left",
                padding: "12px 16px",
                "border-bottom": "1px solid var(--bg-tertiary)",
              });

              // Cell styling
              $(table.body()).find("td").css({
                padding: "12px 16px",
                "text-align": "left",
                "border-bottom": "1px solid var(--bg-tertiary)",
                "vertical-align": "middle",
              });

              // Ensure perfect alignment
              api.columns().every(function () {
                const column = this;
                const header = $(column.header());
                const cells = $(column.nodes());

                // Match widths
                const headerWidth = header.outerWidth();
                cells.css("width", headerWidth + "px");

                // Match padding
                const headerPadding = header.css("padding");
                cells.css("padding", headerPadding);
              });

              // Hover effect
              $(table.body())
                .find("tr")
                .css("transition", "background-color 0.2s ease")
                .hover(
                  function () {
                    $(this).css("background-color", "rgba(0, 0, 0, 0.03)");
                  },
                  function () {
                    $(this).css("background-color", "");
                  }
                );

              // Button styling
              api
                .buttons()
                .container()
                .addClass("space-x-2")
                .find(".dt-button")
                .addClass(
                  "px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                )
                .css({
                  "background-color": "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  "border-color": "var(--bg-tertiary)",
                });
              // Style buttons
              this.api()
                .buttons()
                .container()
                .addClass("space-x-2")
                .find(".dt-button")
                .addClass(
                  "px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                )
                .css({
                  "background-color": "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  "border-color": "var(--bg-tertiary)",
                });

              // Move search to the right
              const searchInput = this.api()
                .table()
                .container()
                .querySelector('input[type="search"]');
              if (searchInput) {
                searchInput.classList.add("ml-2", "p-1", "border", "rounded");
                searchInput.style.backgroundColor = "var(--bg-secondary)";
                searchInput.style.borderColor = "var(--bg-tertiary)";
                searchInput.style.color = "var(--text-primary)";
              }

              // Style column visibility dropdown
              const colvisButtons = document.querySelectorAll(
                ".dt-button-collection button"
              );
              colvisButtons.forEach((button) => {
                button.classList.add("text-left", "px-3", "py-1", "w-full");
                button.style.backgroundColor = "var(--bg-secondary)";
                button.style.color = "var(--text-primary)";
                button.style.borderColor = "var(--bg-tertiary)";
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
      <div id="export-buttons" className="mb-4"></div>

      {/* Student Detail Modal */}
      {showDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-96 relative"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowDetails(false);
                setSelectedStudent(null);
              }}
              className="absolute top-2 right-2 text-red-500 hover:text-red"
            >
              <X size={20} />
            </button>

            {/* Student Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Student Details</h2>

              {!editMode ? (
                <>
                  <div>
                    <h3 className="font-medium text-gray-700">Name</h3>
                    <p>{selectedStudent.name}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Roll Number</h3>
                    <p>{selectedStudent.rollNumber}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700">Gender</h3>
                    <p>{selectedStudent.gender}</p>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleEdit}
                      className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                  </div>
                </>
              ) : (
                <form>
                  <div className="mb-4">
                    <label className="block text-gray-700">Name*</label>
                    <input
                      type="text"
                      name="name"
                      value={editedStudent.name}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="mb-4 flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={editedStudent.gender}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-gray-700">Roll Number</label>
                      <input
                        type="text"
                        name="rollNumber"
                        value={editedStudent.rollNumber}
                        onChange={handleChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
