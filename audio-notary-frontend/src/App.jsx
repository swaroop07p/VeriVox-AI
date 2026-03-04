import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ScanProvider } from "./context/ScanContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// Import the page
import Explain from "./pages/Explain";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  // If no token, kick back to Login (Root)
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ScanProvider>
        <Router>
          <div className="min-h-screen bg-transparent text-white font-sans flex flex-col">
            <Navbar />
            <div className="flex-grow">
              <Routes>
                {/* 1. Default Entry - LOGIN */}
                <Route path="/" element={<Login />} />

                {/* 2. Scanner - PROTECTED */}
                <Route
                  path="/scan"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Dashboard - PROTECTED */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 4. Explain Page - ADDED INSIDE ROUTES */}
                <Route path="/explain" element={<Explain />} />

                <Route
                  path="*"
                  element={
                    <div className="fixed inset-0 z-[99999] bg-zinc-900 flex flex-col items-center justify-center px-6 text-center">
                      <div className="relative mb-10 flex flex-col items-center">
                        <h1 className="text-9xl md:text-[12rem] font-black text-white leading-none tracking-tighter">
                          404
                        </h1>
                        <div className="absolute top-[60%] bg-red-600 px-4 py-1 text-sm md:text-base font-bold uppercase tracking-widest rounded shadow-lg transform -rotate-12 border-2 border-black">
                          Page Not Found
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col items-center">
                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                          Lost in Space?
                        </h2>
                        <p className="text-gray-400 mb-10 max-w-sm md:max-w-md text-sm md:text-lg">
                          We couldn't find the page you're looking for. It might
                          have been moved or deleted.
                        </p>
                        <a
                          href="/scan"
                          className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-black transition-all duration-200 bg-white font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 hover:bg-gray-200 active:scale-95"
                        >
                          Back to Home
                        </a>
                      </div>
                    </div>
                  }
                />
                
              </Routes>
            </div>
            <Footer />

            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              theme="dark"
              toastStyle={{
                backgroundColor: "#111",
                border: "1px solid #333",
                color: "#fff",
              }}
            />
          </div>
        </Router>
      </ScanProvider>
    </AuthProvider>
  );
}

export default App;
