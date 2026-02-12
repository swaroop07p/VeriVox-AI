import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <div className="text-center mb-12 space-y-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-5xl md:text-7xl font-black text-white mb-2 tracking-tighter">
          AUDIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue">NOTARY</span>
        </h1>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
      >
        The world's first AI-powered <span className="text-neon-blue">Forensic Audio Audit</span> system. 
        Upload any voice file to detect Deepfakes, Synthesis, and Manipulation with 
        <span className="text-neon-blue"> More Accuracy</span>.
      </motion.p>
    </div>
  );
};

export default Hero;