import { FaFingerprint, FaServer, FaShieldAlt, FaWaveSquare  } from 'react-icons/fa';

const Footer = () => {
  return (
    // UPDATED: Removed bg-black/80, added bg-white/5 for glass effect
    <footer className="w-full bg-white/5 backdrop-blur-xl border-t border-white/10 py-6 mt-auto z-40 relative">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <FaWaveSquare className="text-purple-500 text-3xl" />
          <span className="text-2xl font-bold tracking-widest text-white">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue">VeriVox</span>
          </span>
        </div>

        {/* Copyright */}
        <div className="text-gray-400 text-xs">
          © {new Date().getFullYear()} Digital Forensic Systems.All rights reserved.
        </div>

        {/* System Status */}
        <div className="flex items-center gap-6 text-xs font-mono">
           <div className="flex items-center gap-2 text-gray-400">
              <FaServer /> 
              <span>System: <span className="text-neon-green">Online</span></span>
           </div>
           <div className="flex items-center gap-2 text-gray-400">
              <FaShieldAlt /> 
              <span>Security: <span className="text-neon-blue">Active</span></span>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;