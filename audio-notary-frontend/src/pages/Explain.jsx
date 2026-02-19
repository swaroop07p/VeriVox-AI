import { useState, useEffect, useRef, useContext } from 'react';
import { ScanContext } from '../context/ScanContext';
import api from '../api';
import { FaRobot, FaUser, FaPaperPlane, FaMicrochip, FaTrashAlt, FaUserAstronaut } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Background = () => (
    <>
      <div className="aurora-bg fixed inset-0 z-[-2]"></div>
      <div className="wave-container fixed inset-0 z-[-1] opacity-50">
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
    </>
);

// --- GLOBAL MEMORY ---
// Stores history, filename, AND the login token to detect logouts securely
let sessionChatData = {
    filename: null,
    history: null,
    token: null
};

const Explain = () => {
  const { scanResult } = useContext(ScanContext);
  
  // Ref for the SCROLLABLE CONTAINER
  const chatContainerRef = useRef(null);
  
  // 1. INITIALIZE & CHECK FOR LOGOUTS / NEW FILES
  const [messages, setMessages] = useState(() => {
    const currentToken = localStorage.getItem('token');

    // SECURITY FIX: Detect Logout or Account Switch!
    // If the token changed (user logged out), wipe the memory immediately.
    if (sessionChatData.token && sessionChatData.token !== currentToken) {
        sessionChatData.history = null;
        sessionChatData.filename = null;
    }

    // If we have a scan result, and it DOES NOT match the stored chat's file -> RESET
    if (scanResult && scanResult.filename && sessionChatData.filename !== scanResult.filename) {
        return [{ 
            sender: 'ai', 
            text: `Analysis for "${scanResult.filename || 'Audio'}" loaded. Ask me anything!` 
        }];
    }
    
    // Otherwise return stored history or default
    return sessionChatData.history || [{ 
        sender: 'ai', 
        text: "Hello! I am VeriVox Intelligence. How can I explain the forensic results?" 
    }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. SYNC GLOBAL MEMORY
  useEffect(() => {
    sessionChatData = {
        filename: scanResult?.filename || null,
        history: messages,
        token: localStorage.getItem('token') // Save the active user token
    };
  }, [messages, scanResult]);

  // 3. SMOOTH SCROLL (Prevents page jump)
  useEffect(() => {
    if (chatContainerRef.current) {
        const { scrollHeight, clientHeight } = chatContainerRef.current;
        chatContainerRef.current.scrollTo({
            top: scrollHeight - clientHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
        const res = await api.post('/api/explain/chat', {
            message: userMsg.text,
            forensic_data: scanResult || {} 
        });

        setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err) {
        console.error("AI Error:", err);
        setMessages(prev => [...prev, { sender: 'ai', text: "System Busy. Please try again." }]);
    } finally {
        setLoading(false);
    }
  };

  const clearChat = () => {
    const resetMsg = [{ sender: 'ai', text: "Chat history cleared." }];
    setMessages(resetMsg);
    toast.info("Chat Cleared");
  };

  return (
    <div className="h-[100dvh] pt-20 pb-0 flex flex-col relative overflow-hidden">
        <Background />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/40 to-black/80 pointer-events-none"></div>

        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col glass-panel md:my-4 md:rounded-3xl border-x-0 md:border border-white/10 shadow-2xl overflow-hidden z-10">
            
            {/* Header */}
            <div className="flex-none p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-neon-blue/20 text-neon-blue border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                        <FaUserAstronaut size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue leading-tight">VeriVox Intelligence</h2>
                        <p className="text-[11px] text-neon-green font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                            ONLINE
                        </p>
                    </div>
                </div>
                
                <button 
                    onClick={clearChat} 
                    className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                >
                    <span>Clear Chat</span>
                </button>
            </div>

            {/* Messages Area */}
            <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/10"
            >
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl text-sm md:text-base border shadow-lg ${msg.sender === 'user' 
                            ? 'bg-purple-600/20 border-purple-500/30 text-white rounded-br-none' 
                            : 'bg-[#1a1a2e]/90 border-white/10 text-gray-200 rounded-bl-none'}`}>
                            
                            <div className="flex items-center gap-2 mb-1 opacity-50 text-[12px] font-bold uppercase tracking-wider">
                                {msg.sender === 'user' ? <><FaUser/> You</> : <><FaRobot/> AI</>}
                            </div>
                            
                            {msg.sender === 'ai' ? (
                                <div 
                                    className="leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>b]:text-neon-blue [&>p]:mb-2"
                                    dangerouslySetInnerHTML={{ __html: msg.text }} 
                                />
                            ) : (
                                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-[#1a1a2e]/90 p-4 rounded-2xl rounded-bl-none border border-white/10 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce delay-100"></div>
                            <div className="w-1.5 h-1.5 bg-neon-blue rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="flex-none p-3 md:p-4 bg-black/60 border-t border-white/10 backdrop-blur-xl">
                <form onSubmit={handleSend} className="flex gap-2 md:gap-3">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about the analysis..."
                        className="flex-1 bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/50 transition font-medium placeholder-gray-400 min-w-0"
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-4 md:px-6 py-3 bg-gradient-to-r from-purple-600 to-neon-blue text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition disabled:opacity-50 flex items-center gap-2 shrink-0"
                    >
                        <FaPaperPlane /> 
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default Explain;