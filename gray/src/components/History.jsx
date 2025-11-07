import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // type = "anxiety", "depression", "wellbeing", "personality"

  useEffect(() => {
    if (type) {
      fetchHistory(type);
    }
  }, [type]);

  // ✅ Fetch current user's history only
  const fetchHistory = async (type) => {
    setLoading(true);

    // Get the current logged-in user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Error getting user:", userError);
      setLoading(false);
      return;
    }

    if (!user) {
      alert("Please log in to view your test history.");
      setLoading(false);
      return;
    }

    // Map test types to table names
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

    // Fetch data filtered by user_id
    const { data, error } = await supabase
      .from(tableName)
      .select("id, user_name, score, risk_level, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching ${type} history:`, error);
    } else {
      setHistory(data || []);
    }

    setLoading(false);
  };

  // ✅ Title based on test type
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
              <th>Risk Level</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{record.user_name}</td>
                <td>{record.score}</td>
                <td>{record.risk_level || "—"}</td>
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
