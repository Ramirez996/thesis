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
  const { type } = location.state || {}; // type = "anxiety", "depression", etc.

  useEffect(() => {
    if (!type) return;

    let subscription = null;

    const init = async () => {
      setLoading(true);
      let currentUser = null;

      try {
        // Try Supabase v2 getUser()
        if (supabase.auth && typeof supabase.auth.getUser === "function") {
          const res = await supabase.auth.getUser();
          currentUser = res?.data?.user || null;

          // If getUser returned null, try getSession() which may have the user
          if (!currentUser && typeof supabase.auth.getSession === "function") {
            const sess = await supabase.auth.getSession();
            currentUser = sess?.data?.session?.user || null;
          }

          // subscribe to auth state changes so we update UI when session becomes available
          if (typeof supabase.auth.onAuthStateChange === "function") {
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
              const suser = session?.user || null;
              setUser(suser);
              if (suser) {
                fetchHistory(type, suser);
              } else {
                setHistory([]);
              }
            });
            subscription = data?.subscription || data; // v2 returns { data: { subscription } }
          }
        } else if (supabase.auth && typeof supabase.auth.user === "function") {
          // Supabase v1 fallback
          currentUser = supabase.auth.user() || null;
        }
      } catch (err) {
        console.error("Error getting supabase user:", err);
      }

      setUser(currentUser);
      await fetchHistory(type, currentUser);
      setLoading(false);
    };

    init();

    return () => {
      // cleanup subscription if present
      if (subscription && typeof subscription.unsubscribe === "function") {
        subscription.unsubscribe();
      } else if (subscription && typeof subscription === "function") {
        try { subscription(); } catch (e) {}
      }
    };
  }, [type]);

  const fetchHistory = async (type, currentUser) => {
    setLoading(true);

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

    // If user not logged in, do not fetch global history
    if (!currentUser) {
      setHistory([]);
      setLoading(false);
      return;
    }

    // Prefer matching by email, then display name, then user id
    const userIdentifier =
      currentUser.email ||
      currentUser.user_metadata?.full_name ||
      currentUser.id ||
      null;

    if (!userIdentifier) {
      setHistory([]);
      setLoading(false);
      return;
    }

    // Query supabase for rows belonging to this user only
    const { data, error } = await supabase
      .from(tableName)
      .select("id, user_name, score, created_at")
      .eq("user_name", userIdentifier)
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
      ) : !user ? (
        <p>Please log in to view your {type} history.</p>
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
