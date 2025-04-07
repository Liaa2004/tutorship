import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/details"; // Import Axios instance

export default function LoginPage() {
  const [role, setRole] = useState("tutor");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.get(`/${role}s`, {
        params: { username, password },
      });
      console.log(response.data);
      
      if (response.data.length > 0) {
        // const token = crypto.randomUUID(); // Example token generation
        // localStorage.setItem("authToken", token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(response.data[0]));
      } else {
        setError("Invalid credentials");
      }
        // const role = localStorage.getItem("role");
        console.log(username, password, role);

        const tokenResponse = await fetch("http://localhost:4000/login",{
         method: "POST",
         headers: {
          "Content-Type": "application/json",
         },
        body: JSON.stringify({username, password, role }),
        });

        const tokenData = await tokenResponse.json();

        console.log("Response:" ,tokenData)
        console.log(tokenData.token)

        // console.log(tokenResponse);

         // ✅ Check if response is valid JSON
        if (!tokenResponse.ok) {
          const errorText = await response.text(); // Try to read error response
          throw new Error(`Login failed: ${errorText}`);
        }

        if (tokenResponse.ok) {
          localStorage.setItem("authToken", tokenData.token);  // ✅ Store JWT Token
          // localStorage.setItem("role", response.data.role);
          console.log("Stored Token:", tokenData.token);
        }


        
        // console.log("logged in user:",user)
        console.log(localStorage.getItem("user"));
        if (role === "tutor") {

          navigate(`/tutor/dashboard`); // Redirect to dashboard
          console.log("navigating to tutor",role)
        }else{
          console.log("navigating to student",role);
          navigate(`/student/dashboard`); // Redirect to student dashboard
        }
      
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong, try again!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" style={{
      backgroundColor: "var(--bg-secondary)",
      borderColor: "var(--bg-tertiary)",
      color: "var(--text-primary)",
    }}>
      <div className="bg-black p-6 rounded-lg shadow-md w-96" style={{
      backgroundColor: "var(--bg-secondary)",
      borderColor: "var(--bg-tertiary)",
      color: "var(--text-primary)",
    }}>
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <select
            className="w-full p-2 border rounded"
            style={{
              backgroundColor: "var(--bg-secondary)",
              borderColor: "var(--bg-tertiary)",
              color: "var(--text-primary)",
            }}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="tutor">Tutor</option>
            <option value="student">Student</option>
          </select>
          <input
            type="text"
            placeholder="Username"
            className="w-full p-2 border rounded"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}