import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const AnxietyHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("anxiety_results") // make sure your table name matches
      .select("id, user_name, score, risk_level, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setHistory(data);
    }
    setLoading(false);
  };

  return (
    <div className="mental-container">
      <h2>Your Anxiety Test History</h2>
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      {loading ? (
        <p>Loading your test history...</p>
      ) : history.length === 0 ? (
        <p>No previous test results found.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={record.id}>
                <td>{new Date(record.created_at).toLocaleString()}</td>
                <td>{record.score}</td>
                <td>{record.risk_level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AnxietyHistory;
