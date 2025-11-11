import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notSignedIn, setNotSignedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // type = "anxiety", "depression", etc.

  useEffect(() => {
    if (!type) return;
    fetchHistory(type);
  }, [type]);

  const getCurrentUser = async () => {
    try {
      // supabase v2: try getUser first, then getSession fallback
      if (supabase.auth && supabase.auth.getUser) {
        const { data, error } = await supabase.auth.getUser();
        if (error) console.debug("getUser error:", error);
        if (data?.user) return data.user;
      }
      if (supabase.auth && supabase.auth.getSession) {
        const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) console.debug("getSession error:", sessErr);
        if (sessionData?.session?.user) return sessionData.session.user;
      }
      // supabase v1 fallback
      if (supabase.auth && supabase.auth.user) {
        return supabase.auth.user();
      }
    } catch (err) {
      console.error("Error getting current user:", err);
    }
    return null;
  };

  const fetchHistory = async (type) => {
    setLoading(true);
    setNotSignedIn(false);

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

    const user = await getCurrentUser();
    console.debug("Current supabase user:", user);
    if (!user) {
      setHistory([]);
      setNotSignedIn(true);
      setLoading(false);
      return;
    }

    const selectCols = "id, user_name, score, created_at, user_id, user_email";

    try {
      // 1) user_id
      let res = await supabase
        .from(tableName)
        .select(selectCols)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      console.debug("user_id query:", { error: res.error, rows: res.data?.length });

      if (!res.error && res.data && res.data.length > 0) {
        setHistory(res.data);
        setLoading(false);
        return;
      }

      // 2) user_email
      if (user.email) {
        res = await supabase
          .from(tableName)
          .select(selectCols)
          .eq("user_email", user.email)
          .order("created_at", { ascending: false });
        console.debug("user_email query:", { error: res.error, rows: res.data?.length });
        if (!res.error && res.data && res.data.length > 0) {
          setHistory(res.data);
          setLoading(false);
          return;
        }
      }

      // 3) user_name possibilities
      const possibleNames = [
        user.user_metadata?.full_name,
        user.user_metadata?.name,
        user.email,
      ].filter(Boolean);

      for (const name of possibleNames) {
        const r = await supabase
          .from(tableName)
          .select(selectCols)
          .eq("user_name", name)
          .order("created_at", { ascending: false });
        console.debug("user_name query:", name, { error: r.error, rows: r.data?.length });
        if (!r.error && r.data && r.data.length > 0) {
          setHistory(r.data);
          setLoading(false);
          return;
        }
      }

      setHistory([]);
    } catch (err) {
      console.error(`Error fetching ${type} history:`, err);
      setHistory([]);
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
      ) : notSignedIn ? (
        <p>Please sign in to view your personal {type} history.</p>
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
