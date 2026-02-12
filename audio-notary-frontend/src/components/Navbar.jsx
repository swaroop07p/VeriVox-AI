import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaWaveSquare, FaBars, FaTimes, FaHome, FaHistory, FaSignOutAlt, FaUserCircle, FaSignInAlt } from 'react-icons/fa';

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
          
          {/* Logo */}
          <div onClick={handleLogoClick} className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <FaWaveSquare className="text-purple-400 text-2xl group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-xl md:text-2xl font-black tracking-widest text-white">
              AUDIO<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue">NOTARY</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {user && (
                <>
                <Link to="/scan" className={location.pathname === '/scan' ? activeBtnStyle : navBtnStyle}>
                    <FaHome className="text-lg"/> Home
                </Link>
                <Link to="/dashboard" className={location.pathname === '/dashboard' ? activeBtnStyle : navBtnStyle}>
                    <FaHistory className="text-lg"/> History
                </Link>
                </>
            )}

            <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden lg:block flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 border border-white/5">
                  <p className="text-xs text-gray-400">User:</p>
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
            ) : (
                !isLoginPage && (
                    <Link to="/" className="px-6 py-2 bg-gradient-to-r from-purple-600 to-neon-blue text-white font-bold rounded-full hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition transform hover:-translate-y-0.5 flex items-center gap-2">
                    <FaSignInAlt /> Access Portal
                    </Link>
                )
            )}
          </div>

          {/* Mobile Hamburger - HIDDEN ON LOGIN PAGE */}
          {!isLoginPage && (
            <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-white text-2xl focus:outline-none p-2 rounded-lg hover:bg-white/10 transition">
                {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown - HIDDEN ON LOGIN PAGE */}
      {!isLoginPage && isOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-2xl border-b border-white/10">
          <div className="px-4 pt-4 pb-6 space-y-3">
            {user && (
                <>
                <Link to="/scan" onClick={() => setIsOpen(false)} className={`block ${location.pathname === '/scan' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-gray-200'} px-4 py-3 rounded-xl flex items-center gap-3 font-medium`}>
                    <FaHome/> Home
                </Link>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`block ${location.pathname === '/dashboard' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/5 text-gray-200'} px-4 py-3 rounded-xl flex items-center gap-3 font-medium`}>
                    <FaHistory/> History
                </Link>
                </>
            )}
            
            <div className="border-t border-white/10 my-2"></div>
            
            {user ? (
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold flex items-center gap-3"><FaSignOutAlt/> Logout</button>
            ) : (
              <Link to="/" onClick={() => setIsOpen(false)} className="block w-full text-center px-4 py-3 bg-gradient-to-r from-purple-500 to-neon-blue text-white font-bold rounded-xl flex items-center justify-center gap-2"><FaSignInAlt/> Login</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;