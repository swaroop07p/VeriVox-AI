import { motion } from "framer-motion";
import {
  FaWaveSquare,
  FaMicrochip,
  FaNetworkWired,
  FaSearch,
  FaSatelliteDish,
} from "react-icons/fa";
import { useEffect, useState } from "react";

const steps = [
  { id: 1, text: "Metadata Analysis", icon: <FaSearch /> },
  { id: 2, text: "Noise & Frequency Scan", icon: <FaWaveSquare /> },
  { id: 3, text: "Voice Naturalness Check", icon: <FaSatelliteDish /> },
  { id: 4, text: "AI Synthetic Detection", icon: <FaMicrochip /> },
  { id: 5, text: "Integrity Verification", icon: <FaNetworkWired /> },
];

const ScannerOverlay = ({ isScanning, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isScanning) {
      setCurrentStep(0);
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(onComplete, 800);
            return prev + 1;
          }
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [isScanning, onComplete]);

  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-4">
      {/* Central Radar Animation */}
      <div className="relative w-32 h-32 md:w-40 md:h-40 mb-10 flex items-center justify-center">
        {/* Outer Rings */}
        <div className="absolute inset-0 border-4 border-neon-blue rounded-full animate-ping opacity-20"></div>
        <div className="absolute inset-0 border-4 border-t-neon-blue border-r-transparent border-b-neon-blue border-l-transparent rounded-full animate-spin"></div>

        {/* Voice Wave Animation */}
        <div className="flex items-center justify-center gap-1 h-12">
          <div className="w-1.5 bg-neon-blue rounded-full animate-voice-1"></div>
          <div className="w-1.5 bg-neon-green rounded-full animate-voice-2"></div>
          <div className="w-1.5 bg-purple-500 rounded-full animate-voice-3"></div>
          <div className="w-1.5 bg-neon-red rounded-full animate-voice-2"></div>
          <div className="w-1.5 bg-neon-blue rounded-full animate-voice-1"></div>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue mb-6 tracking-widest animate-pulse text-center">
        SYSTEM AUDIT IN PROGRESS...
      </h2>

      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: index <= currentStep ? 1 : 0.3,
              x: index <= currentStep ? 0 : -20,
              color:
                index < currentStep
                  ? "#00ff9d"
                  : index === currentStep
                    ? "#fff"
                    : "#444",
            }}
            className="flex items-center space-x-4 text-base md:text-lg font-mono p-2 border-b border-gray-800"
          >
            <span
              className={
                index <= currentStep ? "text-neon-green" : "text-gray-600"
              }
            >
              {index < currentStep ? "✔" : index === currentStep ? "➤" : "○"}
            </span>
            <span className="text-lg md:text-xl">{step.icon}</span>
            <span className="whitespace-nowrap">{step.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ScannerOverlay;