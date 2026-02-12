import { useState } from 'react';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';

const AuthForm = ({ type, onSubmit }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password, username });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {type === 'register' && (
        <div className="relative group">
          <FaUser className="absolute left-3 top-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Username" 
            required
            className="w-full bg-black/50 border border-gray-700 pl-10 p-3 rounded-lg text-white focus:border-neon-blue focus:outline-none transition-all" 
            onChange={e => setUsername(e.target.value)} 
          />
        </div>
      )}
      
      <div className="relative group">
        <FaEnvelope className="absolute left-3 top-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
        <input 
          type="email" 
          placeholder="Email Address" 
          required
          className="w-full bg-black/50 border border-gray-700 pl-10 p-3 rounded-lg text-white focus:border-neon-blue focus:outline-none transition-all" 
          onChange={e => setEmail(e.target.value)} 
        />
      </div>

      <div className="relative group">
        <FaLock className="absolute left-3 top-4 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
        <input 
          type="password" 
          placeholder="Password" 
          required
          className="w-full bg-black/50 border border-gray-700 pl-10 p-3 rounded-lg text-white focus:border-neon-blue focus:outline-none transition-all" 
          onChange={e => setPassword(e.target.value)} 
        />
      </div>

      <button 
        type="submit" 
        className="w-full bg-gradient-to-r from-neon-blue to-blue-600 text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition transform hover:scale-[1.02]"
      >
        {type === 'register' ? "Initialize Account" : "Access System"}
      </button>
    </form>
  );
};

export default AuthForm;