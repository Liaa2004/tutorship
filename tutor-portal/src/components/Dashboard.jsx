import { useState, useEffect } from "react";
import axios from "../api/details";
import { useNavigate, useLocation } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [classes, setClasses] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    teacher: "",
    studentsCount: 0,
    students: []
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");

  useEffect(() => {

    console.log(user);
   
    if (!user || role !== "tutor") {
      navigate("/"); // Redirect if not authenticated
    } else {
      setIsAuthenticated(true);
      fetchClasses();
    }
  }, [navigate]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get("/classes");
      console.log(response, Array.isArray(response.data));
      console.log(response.data);

      const tutorClasses = response.data.filter(cls => cls.tutorId === user.id);
      console.log(tutorClasses);
      setClasses(tutorClasses);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const toggleArchivedView = () => setShowArchived(!showArchived);

  const archiveClass = async (id) => {
    try {
      const classToArchive = classes.find((cls) => cls.id === id);
      await axios.put(`/classes/${id}`, { ...classToArchive, archived: true });
      fetchClasses();
    } catch (error) {
      console.error("Error archiving class:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass({ ...newClass, [name]: value });
  };

  const createClass = async () => {
    try {
      const newClassData = {
        ...newClass,
        id: Date.now().toString(),
        tutorId: user.id,
        teacher: user.name,
        semesters: 1,
        students: [],
        archived: false,
        internals: []
      };
      await axios.post("/classes", newClassData);
      fetchClasses();
      setShowModal(false);
      setNewClass({ name: "", teacher: "", studentsCount: 0, students: [] });
    } catch (error) {
      console.error("Error creating class:", error);
    }
  };

  const filteredClasses = classes.filter((cls) => cls.archived === showArchived);

  return (
    <div className="p-6" >
      <header className="flex justify-between items-center mb-6 " >
        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white">
          {showArchived ? "Archived Classes" : "Class Dashboard"}
        </h1>
        <div className="flex gap-4">
          {!showArchived && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Create a new class"
            >
              Create New Class
            </button>
          )}
          <button
            onClick={toggleArchivedView}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            {showArchived ? "View Active Classes" : "View Archived Classes"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 transition-transform transform hover:scale-105"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/class/${cls.id}`)}
            onKeyPress={(e) => e.key === 'Enter' && navigate(`/class/${cls.id}`)}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{cls.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Teacher: {cls.teacher}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">Students: {cls.studentsCount}</p>
            <div className="mt-4 flex justify-between">
              {!showArchived && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveClass(cls.id);
                  }}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg shadow hover:bg-red-700 transition"
                >
                  Archive
                </button>
              )}
              
            </div>
          </div>
        ))}
      </section>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full" style={{
  backgroundColor: "var(--bg-secondary)",
  borderColor: "var(--bg-tertiary)",
  color: "var(--text-primary)",
}}>
            <h2 className="text-xl font-bold mb-4 dark:text-white">Create New Class</h2>
            <form onSubmit={(e) => { e.preventDefault(); createClass(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-gray-300">Class Name</label>
                <input
                  type="text"
                  name="name"
                  value={newClass.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-gray-300">Students Count</label>
                <input
                  type="number"
                  name="studentsCount"
                  value={newClass.studentsCount}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;