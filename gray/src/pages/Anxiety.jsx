import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css";

const API_URL = "https://thesis-mental-health-production.up.railway.app";

const Anxiety = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch data from backend (Supabase via Flask API)
  const fetchHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/anxiety_history`); // <-- Make sure this route exists
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      // If your API returns a list of records:
      if (Array.isArray(data) && data.length > 0) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Unable to fetch history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setShowModal(true);
    fetchHistory(); // Load data when modal opens
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
        </p>
        <ul>
          <li>Not at all (0)</li>
          <li>Several days (1)</li>
          <li>More than half the days (2)</li>
          <li>Nearly every day (3)</li>
        </ul>

        <p>
          <strong>This test can help you:</strong>
        </p>
        <ul>
          <li>Recognize symptoms of anxiety</li>
          <li>Reflect on your recent mental health</li>
          <li>Consider whether further support may be helpful</li>
        </ul>

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

      {/* 🧠 MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            <h3>Anxiety Test History</h3>

            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : history.length > 0 ? (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Final Risk</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.user_name}</td>
                      <td>{item.score}</td>
                      <td>{item.result_text}</td>
                      <td>{item.final_risk || item.risk_level}</td>
                      <td>
                        {new Date(item.created_at).toLocaleString("en-PH", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
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
