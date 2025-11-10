import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { getAuth } from "firebase/auth"; // ✅ Import Firebase Auth
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // type = "anxiety", "depression", etc.

  useEffect(() => {
    if (!type) return;
    fetchHistory(type);
  }, [type]);

  const fetchHistory = async (type) => {
    setLoading(true);

    // Map test types to Supabase tables
    const tableMap = {
      anxiety: "anxiety_results",
      depression: "depression_results",
      wellbeing: "wellbeing_results",
      personality: "personality_results",
    };

    const tableName = tableMap[type];
    if (!tableName) {
      console.error("Invalid test type:", type);
      setLoading(false);
      return;
    }

    // ✅ Get current Firebase user
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in to view your test history.");
      setLoading(false);
      navigate("/login");
      return;
    }

    // ✅ Fetch only records belonging to the logged-in user
    const { data, error } = await supabase
      .from(tableName)
      .select("id, user_name, score, result_text, created_at")
      .eq("user_id", user.uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching ${type} history:`, error);
    } else {
      setHistory(data || []);
    }

    setLoading(false);
  };

  const getTitle = (type) => {
    switch (type) {
      case "anxiety":
        return "Anxiety Test History";
      case "depression":
        return "Depression Test History";
      case "wellbeing":
        return "Well-being Test History";
      case "personality":
        return "Personality Test History";
      default:
        return "Test History";
    }
  };

  return (
    <div className="mental-container">
      <h2>{getTitle(type)}</h2>
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      {loading ? (
        <p>Loading your {type} history...</p>
      ) : history.length === 0 ? (
        <p>No previous {type} test results found.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Score</th>
              <th>Result</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{record.user_name}</td>
                <td>{record.score}</td>
                <td>{record.result_text}</td>
                <td>{new Date(record.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default History;
