import { useEffect, useState, useContext } from "react";
import api from "../api";
import { AuthContext } from "../context/AuthContext";
import {
  FaFileAudio,
  FaDownload,
  FaRobot,
  FaUser,
  FaTrash,
  FaExclamationCircle,
  FaHistory,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Background = () => (
  <>
    <div className="aurora-bg"></div>
    <div className="wave-container">
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  </>
);

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/api/history");
      setHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.user_type !== "guest") {
      fetchHistory();
    }
  }, [user]);

  const handleDownload = async (reportId, filename) => {
    try {
      const response = await api.get(`/api/report/${reportId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Forensic_Report_${filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success("Report downloaded successfully!");
    } catch (error) {
      toast.error("Download failed.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/report/${deleteId}`);
      toast.success("Record deleted permanently.");
      fetchHistory();
    } catch (error) {
      toast.error("Could not delete record.");
    } finally {
      setDeleteId(null);
    }
  };

  if (user?.user_type === "guest") {
    return (
      <div className="min-h-screen pt-32 text-center px-4 relative overflow-hidden">
        <Background />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-400">Access Denied</h1>
          <p className="text-gray-500 mt-2">
            Guest users do not have a persistent audit history.
          </p>
        </div>
      </div>
    );
  }

  const [filter, setFilter] = useState("All"); // Options: 'All', 'AI Generated', 'Real Human'

  return (
    <div className="min-h-screen pt-32 px-4 pb-20 relative overflow-hidden">
      <Background />
      <div className="absolute top-0 left-0 w-full h-full z-[2] bg-gradient-to-b from-transparent via-black/20 to-black/60 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-white/10 pb-4 gap-4">
          <h1 className="text-3xl font-bold pb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-neon-blue flex items-center gap-3">
            <FaHistory size={26} className="text-neon-blue" /> Audit History
            Logs
          </h1>

          {/* Filter Buttons */}
          <div className="flex items-center p-1 bg-white/5 rounded-xl border border-white/10 self-start">
            {["All", "AI Generated", "Real Human"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-all duration-300 ${
                  filter === type
                    ? "bg-neon-blue text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {type === "AI Generated"
                  ? "AI Voice"
                  : type === "Real Human"
                    ? "Human Voice"
                    : "All"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-neon-blue animate-pulse text-center mt-10">
            Loading secure records...
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-400 text-center mt-10 italic">
            No audit records found.
          </p>
        ) : (
          <div className="space-y-4">
            {history
              .filter((item) => {
                // filtering logic for the history section
                if (filter === "All") return true;
                const itemType =
                  item.verdict === "AI/Synthetic"
                    ? "AI Generated"
                    : "Real Human";
                return itemType === filter;
              })
              .map((item) => {
                // --- BUG FIX FOR OLD HISTORY REPORTS ---
                const isFake = item.verdict === "AI/Synthetic";
                let displayScore = isFake
                  ? item.confidence_score
                  : 100 - item.confidence_score;

                // Ensure display score is > 50% for the winning verdict
                if (displayScore < 50) {
                  displayScore = 100 - displayScore;
                }
                // ---------------------------------------

                return (
                  <div
                    key={item._id}
                    className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 hover:bg-white/10 transition border border-white/5"
                  >
                    <div className="flex items-center gap-4 w-full md:flex-1 min-w-0">
                      <div
                        className={`p-3 rounded-full flex-shrink-0 ${isFake ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}
                      >
                        <FaFileAudio size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-white truncate text-sm md:text-base"
                          title={item.filename}
                        >
                          {item.filename}
                        </h3>
                        {/* <p className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </p> */}
                        <p className="text-xs text-gray-400">
                          {new Date(
                            new Date(item.timestamp).getTime() +
                              5.5 * 60 * 60 * 1000,
                          ).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-center w-full md:w-auto md:min-w-[220px]">
                      <div className="flex items-center gap-2">
                        {isFake ? (
                          <FaRobot className="text-red-500" />
                        ) : (
                          <FaUser className="text-green-500" />
                        )}
                        <span
                          className={`font-mono font-bold whitespace-nowrap text-sm ${isFake ? "text-red-400" : "text-green-400"}`}
                        >
                          {isFake ? "AI Generated" : "Real Human"}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-mono ml-3 border font-bold ${isFake ? "bg-red-900/20 text-red-300 border-red-500/30" : "bg-green-900/20 text-green-300 border-green-500/30"}`}
                      >
                        {displayScore.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-white/10 pt-3 md:pt-0 mt-2 md:mt-0">
                      <button
                        onClick={() => handleDownload(item._id, item.filename)}
                        className="flex-1 md:flex-none px-4 py-2 text-sm border border-neon-blue/30 text-neon-blue rounded-lg hover:bg-neon-blue/10 transition flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <FaDownload /> Report
                      </button>
                      <button
                        onClick={() => setDeleteId(item._id)}
                        className="px-3 py-2 text-sm border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition flex items-center justify-center gap-2"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <FaExclamationCircle className="text-red-500" /> Confirm Deletion
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete this forensic report?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold transition"
              >
                Yes, Delete it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
