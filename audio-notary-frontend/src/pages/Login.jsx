import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ScanContext } from '../context/ScanContext'; 
import api from '../api'; 
import { toast } from 'react-toastify';
// Added FaUserPlus for the register icon, kept FaUserSecret for the Guest button
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaUserSecret } from 'react-icons/fa';

const Background = () => (
    <>
      <div className="aurora-bg fixed inset-0 z-[-2]"></div>
      <div className="wave-container fixed inset-0 z-[-1] opacity-50">
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
    </>
);

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const { login, user } = useContext(AuthContext);
  const { resetScan } = useContext(ScanContext);
  const navigate = useNavigate();

  useEffect(() => {
    resetScan(); 
  }, [resetScan]);

  useEffect(() => {
    if (user || localStorage.getItem('token')) {
        navigate('/scan');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? 'register' : 'login';
      const payload = isRegister ? { email, password, username } : { email, password };
      
      const res = await api.post(`/auth/${endpoint}`, payload);
      login({ email, username: res.data.username, user_type: res.data.user_type }, res.data.access_token);
      toast.success(`Welcome back, ${res.data.username}!`);
      navigate('/scan'); 
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.detail || "Invalid Credentials"));
    }
  };

  const handleGuest = async () => {
    try {
        const res = await api.post('/auth/guest-login');
        login({ email: "guest", username: "Guest User", user_type: "guest" }, res.data.access_token);
        toast.info("Logged in as Guest Mode");
        navigate('/scan'); 
    } catch (err) {
        toast.error("Guest login failed");
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 flex items-center justify-center relative px-4">
      
      <Background />
      
      {/* BRIGHTER OVERLAY: Changed from black/90 to black/70 and lightened the top */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/30 to-black/70 pointer-events-none"></div>

      {/* BRIGHTER CARD: Added bg-white/5 and brightened the border */}
      <div className="glass-panel bg-white/5 p-8 md:p-10 rounded-3xl w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(168,85,247,0.2)] border border-white/20 backdrop-blur-2xl">
        
        <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/5 border border-white/20 shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                {/* ICON SWAP: Using FaUserPlus for Registration now */}
                {isRegister ? <FaUserPlus className="text-4xl text-neon-blue" /> : <FaSignInAlt className="text-4xl text-purple-400" />}
            </div>
        </div>

        <h2 className="text-3xl font-black text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wide">
          {isRegister ? "Create Account" : "Access Portal"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
             <div className="relative group">
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" />
                {/* LIGHTER INPUTS: Changed from bg-black/40 to bg-black/20 */}
                <input type="text" placeholder="Username" className="w-full bg-black/20 border border-white/10 pl-11 p-3.5 rounded-xl text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all" onChange={e => setUsername(e.target.value)} required />
             </div>
          )}
          
          <div className="relative group">
            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" />
            <input type="email" placeholder="Email Address" className="w-full bg-black/20 border border-white/10 pl-11 p-3.5 rounded-xl text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all" onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="relative group">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-neon-blue transition-colors" />
            <input type="password" placeholder="Password" className="w-full bg-black/20 border border-white/10 pl-11 p-3.5 rounded-xl text-white placeholder-gray-400 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-all" onChange={e => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="w-full mt-2 bg-gradient-to-r from-purple-600 to-neon-blue text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:-translate-y-0.5 tracking-wider">
            {isRegister ? "Initialize Account" : "Secure Login"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center text-sm text-gray-200">
          <button onClick={() => setIsRegister(!isRegister)} className="hover:text-neon-blue font-medium transition-colors">
            {isRegister ? "Already have an account? Login" : "Need an account? Sign Up"}
          </button>
        </div>

        <div className="mt-8 relative">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-white/20"></div>
           </div>
           <div className="relative flex justify-center text-xs">
             <span className="bg-[#111] px-2 text-gray-400 rounded">OR</span>
           </div>
        </div>

        <div className="mt-6">
           <button onClick={handleGuest} className="w-full border border-white/30 py-3 rounded-xl text-gray-200 hover:bg-white/10 hover:text-white transition-all font-medium flex items-center justify-center gap-2">
             <FaUserSecret /> Continue as Guest
           </button>
           <p className="text-[11px] text-center mt-3 text-gray-400 uppercase tracking-wider">Guest mode restricts forensic history</p>
        </div>
      </div>
    </div>
  );
};

export default Login;