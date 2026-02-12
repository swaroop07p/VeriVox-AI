import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ScanProvider } from './context/ScanContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
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
                {/* 1. Default Entry is now LOGIN */}
                <Route path="/" element={<Login />} />
                
                {/* 2. Scanner is now at /scan and PROTECTED */}
                <Route 
                  path="/scan" 
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  } 
                />
                
                {/* 3. Dashboard is PROTECTED */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
            <Footer />
            
            <ToastContainer 
              position="bottom-right"
              autoClose={3000}
              theme="dark"
              toastStyle={{ backgroundColor: '#111', border: '1px solid #333', color: '#fff' }}
            />
          </div>
        </Router>
      </ScanProvider>
    </AuthProvider>
  );
}

export default App;