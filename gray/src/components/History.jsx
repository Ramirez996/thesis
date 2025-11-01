import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // e.g., "anxiety", "depression", etc.

  useEffect(() => {
    getUserAndHistory();
  }, [type]);

  const getUserAndHistory = async () => {
    setLoading(true);

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      setLoading(false);
      return;
    }

    setUser(user);
    await fetchHistory(type, user);
  };

  const fetchHistory = async (type, user) => {
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

    // Adjust depending on how your tables store user info
    // Common options: user_id (UUID from Supabase Auth) or user_name (string)
    const { data, error } = await supabase
      .from(tableName)
      .select("id, user_name, score, created_at")
      .eq("user_id", user.id) // filters to logged-in user's results
      .order("created_at", { ascending: false });

    if (error) {
      console.error(`Error fetching ${type} history:`, error);
      setHistory([]);
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
        <p>No previous {type} test results found for your account.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{record.user_name}</td>
                <td>{record.score}</td>
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
