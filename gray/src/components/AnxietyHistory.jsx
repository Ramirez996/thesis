import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const AnxietyHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllHistories();
  }, []);

  const fetchAllHistories = async () => {
    setLoading(true);

    try {
      // Fetch anxiety results
      const { data: anxietyData, error: anxietyError } = await supabase
        .from("anxiety_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });

      // Fetch depression results
      const { data: depressionData, error: depressionError } = await supabase
        .from("depression_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });

      // Fetch well-being results
      const { data: wellbeingData, error: wellbeingError } = await supabase
        .from("wellbeing_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });

      // Fetch personality results
      const { data: personalityData, error: personalityError } = await supabase
        .from("personality_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });

      // Combine all results into one array
      const allData = [
        ...(anxietyData?.map((item) => ({ ...item, type: "Anxiety" })) || []),
        ...(depressionData?.map((item) => ({ ...item, type: "Depression" })) ||
          []),
        ...(wellbeingData?.map((item) => ({ ...item, type: "Well-being" })) ||
          []),
        ...(personalityData?.map((item) => ({ ...item, type: "Personality" })) ||
          []),
      ];

      // Sort all results by date (newest first)
      const sorted = allData.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setHistory(sorted);

      if (anxietyError || depressionError || wellbeingError || personalityError) {
        console.error(
          "Error fetching results:",
          anxietyError || depressionError || wellbeingError || personalityError
        );
      }
    } catch (err) {
      console.error("Unexpected error fetching history:", err);
    }

    setLoading(false);
  };

  return (
    <div className="mental-container">
      <h2>Your Test History</h2>
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
              <th>Type</th>
              <th>User Name</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record) => (
              <tr key={`${record.type}-${record.id}`}>
                <td>{record.type}</td>
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

export default AnxietyHistory;
