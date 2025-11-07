import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // type = "anxiety", "depression", etc.

  useEffect(() => {
    const fetchData = async () => {
      if (!type) return;

      setLoading(true);

      // Get logged-in user info
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not logged in:", userError);
        setLoading(false);
        return;
      }

      console.log("🔍 Current user info:", user);

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

      // Try multiple matching fields (user_id, user_email, user_uid)
      const possibleFilters = [
        { field: "user_id", value: user.id },
        { field: "user_email", value: user.email },
        { field: "user_uid", value: user.id || user.uid },
      ];

      let data = null;
      let error = null;

      for (const { field, value } of possibleFilters) {
        const { data: result, error: fetchError } = await supabase
          .from(tableName)
          .select("id, user_id, user_name, score, created_at")
          .eq(field, value)
          .order("created_at", { ascending: false });

        console.log(`🧩 Trying filter ${field}=${value}:`, result);

        if (result && result.length > 0) {
          data = result;
          break;
        }
        error = fetchError;
      }

      if (error) {
        console.error(`Error fetching ${type} history:`, error);
        setHistory([]);
      } else {
        setHistory(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [type]);

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
