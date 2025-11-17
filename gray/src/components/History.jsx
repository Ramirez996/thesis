import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useLocation, useNavigate } from "react-router-dom";
import "../pages/anxiety.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [debugMsg, setDebugMsg] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = location.state || {}; // type = "anxiety", "depression", etc.

  useEffect(() => {
    if (!type) return;

    let subscription = null;
    let mounted = true;

    const getCurrentUser = async () => {
      try {
        // Supabase v2
        if (supabase.auth && typeof supabase.auth.getUser === "function") {
          const res = await supabase.auth.getUser();
          if (res?.data?.user) return res.data.user;
          // try session if getUser returned null
          if (typeof supabase.auth.getSession === "function") {
            const sess = await supabase.auth.getSession();
            return sess?.data?.session?.user || null;
          }
        }
        // Supabase v1 fallback
        if (supabase.auth && typeof supabase.auth.user === "function") {
          return supabase.auth.user() || null;
        }
      } catch (err) {
        console.error("getCurrentUser error:", err);
      }
      return null;
    };

    const init = async () => {
      setLoading(true);
      const currentUser = await getCurrentUser();
      if (!mounted) return;
      setUser(currentUser);
      console.debug("History:init currentUser:", currentUser);
      await fetchHistory(type, currentUser);
      setLoading(false);

      // subscribe to auth state changes
      try {
        if (supabase.auth && typeof supabase.auth.onAuthStateChange === "function") {
          const { data } = supabase.auth.onAuthStateChange((event, session) => {
            const suser = session?.user || null;
            console.debug("onAuthStateChange:", event, suser);
            setUser(suser);
            if (suser) fetchHistory(type, suser);
            else setHistory([]);
          });
          // v2 returns { data: { subscription } }
          subscription = data?.subscription || data;
        }
      } catch (err) {
        console.warn("Auth subscription error:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      if (subscription) {
        if (typeof subscription.unsubscribe === "function") {
          subscription.unsubscribe();
        } else if (typeof subscription === "function") {
          try { subscription(); } catch (e) {}
        }
      }
    };
  }, [type]);

  const fetchHistory = async (type, currentUser) => {
    setLoading(true);

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

    if (!currentUser) {
      setDebugMsg("No currentUser when fetching history.");
      setHistory([]);
      setLoading(false);
      return;
    }

    // Build possible identifiers
    const identifiers = {
      id: currentUser.id || null,
      email: currentUser.email || null,
      // common metadata keys
      name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || null,
    };

    console.debug("fetchHistory: identifiers:", identifiers);

    // Try to query matching by user_id, user_email, or user_name
    const filters = [];
    if (identifiers.id) filters.push(`user_id.eq.${identifiers.id}`);
    if (identifiers.email) {
      filters.push(`user_email.eq.${identifiers.email}`);
      filters.push(`user_name.eq.${identifiers.email}`); // in case user_name stores email
    }
    if (identifiers.name) filters.push(`user_name.eq.${identifiers.name}`);

    if (filters.length === 0) {
      setDebugMsg("No usable identifier found on the Supabase user object.");
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      let query;
      if (filters.length === 1) {
        // single filter -> use eq
        const [raw] = filters;
        const [col, op, val] = raw.split(".");
        query = supabase.from(tableName).select("id, user_name, score, created_at").eq(col, val);
        console.debug("fetchHistory: single eq query:", { col, val });
      } else {
        // multiple -> use or()
        const orFilter = filters.join(",");
        query = supabase.from(tableName).select("id, user_name, score, created_at").or(orFilter);
        console.debug("fetchHistory: or query:", orFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase fetch error:", error);
        setDebugMsg(`DB error: ${error.message}`);
        setHistory([]);
      } else {
        setDebugMsg(`Fetched ${data?.length || 0} records from ${tableName}`);
        setHistory(data || []);
      }
    } catch (err) {
      console.error("fetchHistory exception:", err);
      setDebugMsg("Unexpected error fetching history.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
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
        <>
          <p>No previous {type} test results found for your account.</p>
          {debugMsg && <p className="debug-msg">Debug: {debugMsg}</p>}
          <pre style={{ whiteSpace: "pre-wrap", color: "#666" }}>
            {/* show minimal user info for debugging */}
            {JSON.stringify(
              {
                id: user?.id,
                email: user?.email,
                metadata: user?.user_metadata,
              },
              null,
              2
            )}
          </pre>
        </>
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
