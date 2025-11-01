import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const AnxietyHistory = () => {
  const [anxietyHistory, setAnxietyHistory] = useState([]);
  const [depressionHistory, setDepressionHistory] = useState([]);
  const [wellbeingHistory, setWellbeingHistory] = useState([]);
  const [personalityHistory, setPersonalityHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllHistories();
  }, []);

  const fetchAllHistories = async () => {
    setLoading(true);

    try {
      // Fetch Anxiety results
      const { data: anxietyData, error: anxietyError } = await supabase
        .from("anxiety_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });
      if (anxietyError) console.error("Anxiety fetch error:", anxietyError);
      else setAnxietyHistory(anxietyData || []);

      // Fetch Depression results
      const { data: depressionData, error: depressionError } = await supabase
        .from("depression_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });
      if (depressionError) console.error("Depression fetch error:", depressionError);
      else setDepressionHistory(depressionData || []);

      // Fetch Well-being results
      const { data: wellbeingData, error: wellbeingError } = await supabase
        .from("wellbeing_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });
      if (wellbeingError) console.error("Well-being fetch error:", wellbeingError);
      else setWellbeingHistory(wellbeingData || []);

      // Fetch Personality results
      const { data: personalityData, error: personalityError } = await supabase
        .from("personality_results")
        .select("id, user_name, score, created_at")
        .order("created_at", { ascending: false });
      if (personalityError) console.error("Personality fetch error:", personalityError);
      else setPersonalityHistory(personalityData || []);
    } catch (err) {
      console.error("Unexpected error fetching histories:", err);
    }

    setLoading(false);
  };

  const renderTable = (title, data) => (
    <div className="test-section">
      <h3>{title}</h3>
      {data.length === 0 ? (
        <p>No {title.toLowerCase()} test results found.</p>
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
            {data.map((record) => (
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

  return (
    <div className="mental-container">
      <h2>Your Test Histories</h2>
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Back
      </button>

      {loading ? (
        <p>Loading all test histories...</p>
      ) : (
        <>
          {renderTable("Anxiety", anxietyHistory)}
          {renderTable("Depression", depressionHistory)}
          {renderTable("Well-being", wellbeingHistory)}
          {renderTable("Personality", personalityHistory)}
        </>
      )}
    </div>
  );
};

export default AnxietyHistory;
