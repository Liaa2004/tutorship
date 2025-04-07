import { Link, useLocation } from "react-router-dom";
import { Search, Moon, Sun, LogIn } from "lucide-react";

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const isClassPage = location.pathname.includes('/class/');
  const isLandingPage = location.pathname === '/';
  const isArchivedPage = location.pathname.includes('/archived');

  return (
    
    <nav className="bg-white dark:bg-gray-900 shadow-md px-6 py-3 flex items-center justify-between transition-colors duration-300"  style={{
      backgroundColor: "var(--bg-secondary)",
      borderColor: "var(--bg-tertiary)",
      color: "var(--text-primary)",
    }}>
      <Link to="/tutor/dashboard" className="text-2xl font-semibold text-gray-800 dark:text-white">
      </Link>

      {isLandingPage && (
        <div className="relative flex-1 max-w-md mx-4">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            aria-label="Search"
          />
        </div>
      )}

      <div className="flex items-center space-x-6">
        {isClassPage && !isArchivedPage && (
          <Link to="/tutor/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-500">
            Home
          </Link>
        )}

        {isArchivedPage && (
          <Link to="/tutor/dashboard" className="text-gray-700 dark:text-gray-300 hover:text-blue-500">
            View Active Classes
          </Link>
        )}

        <button onClick={toggleDarkMode} className="focus:outline-none" aria-label="Toggle dark mode">
          {darkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          )}
        </button>

        <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-500" aria-label="Login">
          <LogIn className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;