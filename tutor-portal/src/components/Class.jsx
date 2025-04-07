import React, { useState, useEffect } from "react";
import { useParams, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft,Users, BookOpen, ClipboardList, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import '../css/Sidebar.css';

const Class = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Get current route
  const [initialLoad, setInitialLoad] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (initialLoad && location.pathname === `/class/${id}`) {
      navigate(`/class/${id}/students`);
      setInitialLoad(false);
    }
  }, [id]);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleBackClick = () => {
    navigate("/tutor/dashboard");
  };


  return (
    <div className={`flex h-screen bg-white dark:bg-gray-900`}>
      <div className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'} `}>
        <button 
                    onClick={handleBackClick}
                    className="mr-3 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
        <div className="sidebar-header">
          <h2 className="text-xl font-bold">{isSidebarOpen ? `Menu` : ''}</h2>
          <button onClick={handleSidebarToggle} className="toggle-button">
            {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>
        <div className="sidebar-content">
          <Link to={`/class/${id}/students`} className={`nav-link ${location.pathname.includes('/class/' + id + '/students') ? 'active' : ''}`}>
            <Users className={`icon ${location.pathname.includes('/class/' + id + '/students') ? 'text-blue-500' : ''}`} />
            {isSidebarOpen && <span>Students</span>}
          </Link>
          <Link to={`/class/${id}/cgpa`} className={`nav-link ${location.pathname.includes('/class/' + id + '/cgpa') ? 'active' : ''}`}>
            <BookOpen className={`icon ${location.pathname.includes('/class/' + id + '/cgpa') ? 'text-blue-500' : ''}`} />
            {isSidebarOpen && <span>CGPA Overview</span>}
          </Link>
          <Link to={`/class/${id}/activityPoints`} className={`nav-link ${location.pathname.includes('/class/' + id + '/requests') ? 'active' : ''}`}>
            <ClipboardList className={`icon ${location.pathname.includes('/class/' + id + '/activityPoints') ? 'text-blue-500' : ''}`} />
            {isSidebarOpen && <span>Requests</span>}
          </Link>
          <Link to={`/class/${id}/scholarship`} className={`nav-link ${location.pathname.includes('/class/' + id + '/scholarship') ? 'active' : ''}`}>
            <GraduationCap className={`icon ${location.pathname.includes('/class/' + id + '/scholarship') ? 'text-blue-500' : ''}`} />
            {isSidebarOpen && <span>Scholarship Requests</span>}
          </Link>
        </div>
      </div>
      <div className={"flex-1 p-6 bg-white text-gray-900 dark:bg-gray-90 text-white"}  
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Class;
