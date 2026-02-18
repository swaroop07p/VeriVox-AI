import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaWaveSquare, FaBars, FaTimes, FaHome, FaHistory, FaSignOutAlt, FaBrain } from 'react-icons/fa'; // Added FaBrain

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/'); 
  };

  const handleLogoClick = () => {
    if (window.location.pathname === '/scan') {
      window.location.reload();
      return; 
    }
    if (user) {
      navigate('/scan');
    } else {
      navigate('/');
    }
  };

  const isLoginPage = location.pathname === '/';
  const navBtnStyle = "px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-neon-blue/50 transition-all duration-300 flex items-center gap-2 text-sm font-medium tracking-wide shadow-sm hover:shadow-[0_0_15px_rgba(0,243,255,0.15)]";
  const activeBtnStyle = "px-4 py-2 rounded-lg bg-neon-blue/10 border border-neon-blue/50 text-neon-blue flex items-center gap-2 text-sm font-bold shadow-[0_0_10px_rgba(0,243,255,0.2)]";

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-purple-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <FaWaveSquare className="text-purple-500 text-2xl group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-3xl md:text-2xl font-black tracking-widest text-white">
              <span className="text-3xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue">VeriVox</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {user && (
                <>
                <Link to="/scan" className={location.pathname === '/scan' ? activeBtnStyle : navBtnStyle}>
                    <FaHome className="text-lg"/> Home
                </Link>

                {/* --- EXPLAIN WHY AI BUTTON START (Comment out below lines to disable) --- */}
                <Link to="/explain" className={location.pathname === '/explain' ? activeBtnStyle : navBtnStyle}>
                    <FaBrain className="text-lg"/> Explain Why
                </Link>
                {/* --- EXPLAIN WHY AI BUTTON END --- */}

                <Link to="/dashboard" className={location.pathname === '/dashboard' ? activeBtnStyle : navBtnStyle}>
                    <FaHistory className="text-lg"/> History
                </Link>

                <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                <div className="flex items-center gap-4">
                  <div className="text-rightlg:block flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/20">
                    <p className="text-left text-xs text-gray-400">User:</p>
                    <p className="text-sm font-bold text-neon-green flex items-center gap-1">
                      {user.username || "Guest"}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-5 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition flex items-center gap-2 shadow-sm hover:shadow-red-900/20"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
                </>
            )}
          </div>

          {!isLoginPage && user && (
            <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white text-2xl focus:outline-none p-2 rounded-lg hover:bg-white/10 transition">
                {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>
          )}
        </div>
      </div>

      {!isLoginPage && isOpen && user && (
        <div className="md:hidden bg-black/80 backdrop-blur-2xl border-b border-white/10">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <Link to="/scan" onClick={() => setIsOpen(false)} className={`block ${location.pathname === '/scan' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-gray-200'} px-4 py-3 rounded-xl flex items-center gap-3 font-medium`}>
                <FaHome/> Home
            </Link>
            
            {/* --- MOBILE EXPLAIN BUTTON START --- */}
            <Link to="/explain" onClick={() => setIsOpen(false)} className={`block ${location.pathname === '/explain' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-gray-200'} px-4 py-3 rounded-xl flex items-center gap-3 font-medium`}>
                <FaBrain/> Explain Why
            </Link>
            {/* --- MOBILE EXPLAIN BUTTON END --- */}

            <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`block ${location.pathname === '/dashboard' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-gray-200'} px-4 py-3 rounded-xl flex items-center gap-3 font-medium`}>
                <FaHistory/> History
            </Link>
            
            <div className="border-t border-white/10 my-2"></div>
            
            <button onClick={handleLogout} className="w-full text-left px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold flex items-center gap-3">
                <FaSignOutAlt/> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;