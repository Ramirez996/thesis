import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css";
import Chatbot from "./Chatbot.jsx";
import { supabase } from "../supabaseClient"; // ✅ make sure path is correct

const Anxiety = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anxiety_results") // 👈 table name in Supabase
        .select("id, user_name, score, risk_level, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history from Supabase:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    fetchHistory(); // fetch history when opening
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>Anxiety Test</h2>
        <p>
          The <strong>GAD-7 (Generalized Anxiety Disorder-7)</strong> is a brief
          and commonly used tool to help identify signs of anxiety and assess
          its severity. It consists of <strong>7 simple questions</strong> based
          on how you've been feeling over the <strong>past two weeks</strong>.
        </p>
        <p>
          This test is not a diagnosis, but it can give you a better
          understanding of how anxiety might be affecting your daily life.
        </p>
        <p>
          Each question will ask you how often you’ve been bothered by a
          specific issue — your options will range from:
          <ul>
            <li>Not at all (0)</li>
            <li>Several days (1)</li>
            <li>More than half the days (2)</li>
            <li>Nearly every day (3)</li>
          </ul>
        </p>
        <p>
          <strong>This test can help you:</strong>
          <ul>
            <li>Recognize symptoms of anxiety</li>
            <li>Reflect on your recent mental health</li>
            <li>Consider whether further support may be helpful</li>
          </ul>
        </p>
        <p>
          <em>
            Tip: Try to answer honestly based on how you've felt over the past
            two weeks.
          </em>
        </p>

        <button
          className="start-test-btn"
          onClick={() => navigate("/anxiety-test")}
        >
          Start Test
        </button>
        <br />
        <button className="history-btn" onClick={openModal}>
          Test History
        </button>
      </div>

      {/* 🧠 Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Anxiety Test History</h3>
            {loading ? (
              <p>Loading...</p>
            ) : history.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Score</th>
                    <th>Risk Level</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.user_name}</td>
                      <td>{item.score}</td>
                      <td>{item.risk_level}</td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No test history found.</p>
            )}
            <button className="close-modal-btn" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Anxiety;
