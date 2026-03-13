import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FaMicrophoneAlt, FaCloudUploadAlt, FaLock, FaUserSecret, FaClone, FaUserFriends } from "react-icons/fa";
import api from "../api";
import ScannerOverlay from "../components/ScannerOverlay";

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
let sessionCompareData = {
    file1: null,
    file2: null,
    result: null,
    token: null
};

const Compare = () => {
  const [file1, setFile1] = useState(() => {
    const currentToken = localStorage.getItem('token');
    if (sessionCompareData.token && sessionCompareData.token !== currentToken) return null;
    return sessionCompareData.file1;
  });
  
  const [file2, setFile2] = useState(() => {
    const currentToken = localStorage.getItem('token');
    if (sessionCompareData.token && sessionCompareData.token !== currentToken) return null;
    return sessionCompareData.file2;
  });

  const [result, setResult] = useState(() => {
    const currentToken = localStorage.getItem('token');
    if (sessionCompareData.token && sessionCompareData.token !== currentToken) return null;
    return sessionCompareData.result;
  });

  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  useEffect(() => {
    sessionCompareData = {
        file1, file2, result, token: localStorage.getItem('token')
    };
  }, [file1, file2, result]);

  useEffect(() => {
    if (result && resultsRef.current) {
        setTimeout(() => {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
  }, [result]);

  const onDrop1 = useCallback((acceptedFiles) => { if (acceptedFiles?.length > 0) { setFile1(acceptedFiles[0]); setError(""); setResult(null); }}, []);
  const onDrop2 = useCallback((acceptedFiles) => { if (acceptedFiles?.length > 0) { setFile2(acceptedFiles[0]); setError(""); setResult(null); }}, []);

  const { getRootProps: getRoot1, getInputProps: getInput1, isDragActive: isDrag1 } = useDropzone({ onDrop: onDrop1, accept: { "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"] }, maxFiles: 1 });
  const { getRootProps: getRoot2, getInputProps: getInput2, isDragActive: isDrag2 } = useDropzone({ onDrop: onDrop2, accept: { "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"] }, maxFiles: 1 });

  const handleAnalyze = async () => {
    if (!file1 || !file2) return setError("Please upload both audio files to compare.");
    setIsScanning(true);
    setError("");
    setResult(null);

    try {
      const fileBuffer1 = await file1.arrayBuffer();
      const safeBlob1 = new Blob([fileBuffer1], { type: file1.type || 'audio/wav' });

      const fileBuffer2 = await file2.arrayBuffer();
      const safeBlob2 = new Blob([fileBuffer2], { type: file2.type || 'audio/wav' });

      const formData = new FormData();
      formData.append("file1", safeBlob1, file1.name || "reference_audio.wav");
      formData.append("file2", safeBlob2, file2.name || "suspect_audio.wav");

      const response = await api.post("/api/compare", formData);
      
      setTimeout(() => {
        setResult(response.data);
        setIsScanning(false);
      }, 2000);

    } catch (err) {
      console.error(err);
      setIsScanning(false);
      if (err.response) {
         setError("Server Error: " + (err.response.data.detail || "Unknown"));
      } else {
         setError("Comparison failed. Network error or file is too large.");
      }
    }
  };

  const handleReset = () => {
      setResult(null);
      setFile1(null);
      setFile2(null);
      setError("");
  };

  return (
    <div className="min-h-[100dvh] pt-24 pb-16 px-4 flex flex-col items-center relative overflow-x-hidden">
      <Background />
      <div className="absolute top-0 left-0 w-full h-full z-[2] bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none"></div>
      
      <ScannerOverlay isScanning={isScanning} onComplete={() => {}} />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        
        <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue mb-4 tracking-wider uppercase drop-shadow-lg">
                Voice Cloning Detection
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Upload a verified human reference audio and a suspected audio file. The system extracts precise biometric signatures to detect Deepfake Cloning attacks.
            </p>
        </div>

        {!result && (
            <div className="w-full space-y-8 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    
                    <div className="w-full glass-panel p-6 rounded-3xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,243,255,0.2)] flex flex-col gap-4">
                        <div className="flex justify-start">
                            <h3 className="text-sm font-mono text-neon-blue bg-neon-blue/10 px-4 py-1.5 rounded-full border border-neon-blue/40 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                                AUDIO 1 (Reference)
                            </h3>
                        </div>
                        <div
                            {...getRoot1()}
                            className={`border-2 border-dashed rounded-2xl h-48 md:h-56 flex flex-col items-center justify-center cursor-pointer transition-all
                            ${isDrag1 ? "border-neon-green bg-green-900/10" : "border-gray-600 hover:border-neon-blue hover:bg-white/5"}`}
                        >
                            <input {...getInput1()} />
                            {file1 ? (
                                <div className="text-center p-4">
                                    <FaMicrophoneAlt className="text-4xl md:text-5xl text-neon-green mb-4 mx-auto animate-bounce" />
                                    <p className="text-lg md:text-xl font-bold text-white break-all">{file1.name}</p>
                                    <p className="text-sm text-gray-400 mt-2">{(file1.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 p-4">
                                    <FaCloudUploadAlt className="text-5xl md:text-6xl text-gray-500 mx-auto transition-colors group-hover:text-neon-blue" />
                                    <p className="text-sm md:text-lg text-gray-300">Tap here to upload</p>
                                    <p className="text-xs md:text-sm text-gray-500">WAV, MP3, M4A, AAC</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full glass-panel p-6 rounded-3xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,243,255,0.2)] flex flex-col gap-4">
                        <div className="flex justify-start">
                            <h3 className="text-sm font-mono text-neon-blue bg-neon-blue/10 px-4 py-1.5 rounded-full border border-neon-blue/40 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                                AUDIO 2 (Suspect)
                            </h3>
                        </div>
                        <div
                            {...getRoot2()}
                            className={`border-2 border-dashed rounded-2xl h-48 md:h-56 flex flex-col items-center justify-center cursor-pointer transition-all
                            ${isDrag2 ? "border-neon-green bg-green-900/10" : "border-gray-600 hover:border-neon-blue hover:bg-white/5"}`}
                        >
                            <input {...getInput2()} />
                            {file2 ? (
                                <div className="text-center p-4">
                                    <FaMicrophoneAlt className="text-4xl md:text-5xl text-neon-green mb-4 mx-auto animate-bounce" />
                                    <p className="text-lg md:text-xl font-bold text-white break-all">{file2.name}</p>
                                    <p className="text-sm text-gray-400 mt-2">{(file2.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 p-4">
                                    <FaCloudUploadAlt className="text-5xl md:text-6xl text-gray-500 mx-auto transition-colors group-hover:text-neon-blue" />
                                    <p className="text-sm md:text-lg text-gray-300">Tap here to upload</p>
                                    <p className="text-xs md:text-sm text-gray-500">WAV, MP3, M4A, AAC</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
                
                {error && <p className="text-red-500 text-center font-medium bg-red-900/20 p-3 rounded-xl border border-red-500/50">{error}</p>}
                
                <button 
                    onClick={handleAnalyze} 
                    disabled={isScanning || !file1 || !file2} 
                    className={`w-full max-w-2xl mx-auto py-4 rounded-xl font-bold text-lg md:text-xl tracking-wider flex justify-center items-center gap-3 transition-all duration-300 shadow-lg 
                        ${isScanning || !file1 || !file2 ? 'bg-gray-800 cursor-not-allowed text-gray-500 border border-gray-700' : 'bg-gradient-to-r from-neon-blue to-purple-600 hover:opacity-90 hover:scale-[1.02] shadow-[0_0_30px_rgba(0,243,255,0.4)]'}
                    `}
                >
                    {isScanning ? (
                        <>Scanning Biometrics...</>
                    ) : (
                        <><FaLock /> INITIATE BIOMETRIC COMPARISON</>
                    )}
                </button>
            </div>
        )}

        {/* RESULTS VIEW */}
        {result && (
            <div ref={resultsRef} className="w-full space-y-8 animate-fade-in-up mt-4">
                
                <div className={`p-8 md:p-10 rounded-3xl text-center border-2 shadow-2xl ${
                    result.is_clone_attack ? 'bg-red-900/40 border-neon-red shadow-neon-red/20' : 
                    result.conclusion === "SAME SPEAKER DETECTED" ? 'bg-green-900/40 border-neon-green shadow-neon-green/20' : 
                    'bg-gray-800/80 border-gray-500 shadow-gray-500/20'
                }`}>
                    <h2 className="text-3xl md:text-5xl font-black uppercase tracking-widest mb-4 text-white flex justify-center items-center gap-4 flex-wrap">
                        {result.is_clone_attack ? <FaClone className="text-neon-red text-4xl"/> : 
                         result.conclusion === "SAME SPEAKER DETECTED" ? <FaUserSecret className="text-neon-green text-4xl"/> : 
                         <FaUserFriends className="text-gray-400 text-4xl"/>}
                        {result.conclusion}
                    </h2>
                    <div className="inline-block bg-black/40 px-6 py-2 rounded-full border border-white/10">
                        <p className="text-gray-300 font-mono text-lg md:text-xl">
                            Vocal Tract Match: <span className={`font-bold ${result.similarity_score >= 75 ? 'text-neon-green' : 'text-gray-400'}`}>{Number(result.similarity_score).toFixed(1)}%</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {/* FIX: Formatted Confidence Scores */}
                    <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3 ${result.file1.verdict === "AI/Synthetic" ? 'bg-neon-red shadow-[0_0_15px_#ff0055]' : 'bg-neon-green shadow-[0_0_15px_#00ff9d]'}`}></div>
                        <h3 className="text-xs md:text-sm text-gray-400 font-mono mb-2 truncate bg-black/30 inline-block px-3 py-1 rounded-full">{result.file1.filename}</h3>
                        <p className={`text-3xl font-black uppercase tracking-wider mt-2 ${result.file1.verdict === "AI/Synthetic" ? 'text-neon-red' : 'text-neon-green'}`}>
                            {result.file1.verdict}
                        </p>
                        <p className="text-base mt-3 text-gray-300 font-medium">
                            Confidence: <span className="text-white font-bold">{Number(result.file1.verdict === "AI/Synthetic" ? result.file1.confidence_score : result.file1.human_alignment_score).toFixed(1)}%</span>
                        </p>
                    </div>

                    <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3 ${result.file2.verdict === "AI/Synthetic" ? 'bg-neon-red shadow-[0_0_15px_#ff0055]' : 'bg-neon-green shadow-[0_0_15px_#00ff9d]'}`}></div>
                        <h3 className="text-xs md:text-sm text-gray-400 font-mono mb-2 truncate bg-black/30 inline-block px-3 py-1 rounded-full">{result.file2.filename}</h3>
                        <p className={`text-3xl font-black uppercase tracking-wider mt-2 ${result.file2.verdict === "AI/Synthetic" ? 'text-neon-red' : 'text-neon-green'}`}>
                            {result.file2.verdict}
                        </p>
                        <p className="text-base mt-3 text-gray-300 font-medium">
                            Confidence: <span className="text-white font-bold">{Number(result.file2.verdict === "AI/Synthetic" ? result.file2.confidence_score : result.file2.human_alignment_score).toFixed(1)}%</span>
                        </p>
                    </div>
                </div>

                <div className="flex justify-center mt-12">
                    <button onClick={handleReset} className="px-10 py-4 rounded-full bg-gray-800 hover:bg-gray-700 hover:scale-105 transition-all font-bold border border-gray-600 shadow-lg text-white">
                        Compare New Files
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Compare;