import React, { useState, useRef } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";
import { getApiUrl } from "../config/api";

const questions = [
  { id: 1, text: "Little interest or pleasure in doing things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Feeling down, depressed, or hopeless?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Trouble falling or staying asleep, or sleeping too much?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Feeling tired or having little energy?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Poor appetite or overeating?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Feeling bad about yourself—or that you are a failure or have let yourself or your family down?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Trouble concentrating on things, such as reading the newspaper or watching television?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 8, text: "Moving or speaking slowly or being fidgety/restless?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 9, text: "Thoughts that you would be better off dead, or of hurting yourself?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

const getDepressionResult = (score) => {
  // Add a simple boolean flag to the result object to indicate high risk based on score alone
  let isHighRisk = score >= 20;

  if (score >= 20)
    return {
      result: "Severe Depression – Please seek professional help.",
      description:
        "Your score suggests severe depression. Consult a mental health professional.",
      is_high_risk: isHighRisk,
    };
  if (score >= 15)
    return {
      result: "Moderately Severe Depression – Consider speaking with a professional.",
      description:
        "Your score suggests moderately severe depression. Professional guidance is recommended.",
      is_high_risk: isHighRisk,
    };
  if (score >= 10)
    return {
      result: "Moderate Depression – Monitor and take care of yourself.",
      description: "Your score suggests moderate depression.",
      is_high_risk: isHighRisk,
    };
  if (score >= 5)
    return {
      result: "Mild Depression – Be mindful of your mental well-being.",
      description: "Your score suggests mild depression.",
      is_high_risk: isHighRisk,
    };
  return {
    result: "Minimal Depression – You're doing well.",
    description: "Your score indicates minimal depression symptoms.",
    is_high_risk: isHighRisk,
  };
};

const DepressionTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatbotButtonRef = useRef(null);

  const toggleChatbot = () => setIsChatbotVisible((prev) => !prev);

  const handleOptionSelect = (i, option) =>
    setAnswers((prev) => ({ ...prev, [i]: option }));

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsLoading(true);

    const features = questions.map((_, i) => optionValues[answers[i]]);
    const totalScore = features.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    const evaluation = getDepressionResult(totalScore);
    setResult(evaluation);

    // Initial check (before API) is now handled via the evaluation object, 
    // but the final decision will be based on the hybrid risk model.

    try {
      const response = await fetch(getApiUrl("PHQ9_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: features,
          score: totalScore, // Add score to API body if needed by backend
          result_text: evaluation.result, // Add result text to API body
          text: "User completed PHQ-9 test",
        }),
      });
      const data = await response.json();
      setHybridRisk(data);

      // 1. Check the hybrid risk flag from the API response
      if (data.is_high_risk) {
          setIsChatbotVisible(true);
      }
      
    } catch (err) {
      console.error("Hybrid risk error:", err);
      
      // FALLBACK: If API fails, use the score-based risk evaluation
      if (evaluation.is_high_risk) {
          setIsChatbotVisible(true);
      }
    }

    setShowResult(true);
    setIsLoading(false);
  };

  return (
    <div className="test-container">
      {/* === Loading Overlay === */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing your responses...</p>
        </div>
      )}

      {!showResult ? (
        <div className="question-section">
          {/* ... (Question content here) ... */}
          <h1>Depression Test (PHQ-9)</h1>

          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>
                {i + 1}. {q.text}
              </p>
              <div className="button-options">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(i, opt)}
                    className={`option-button ${
                      answers[i] === opt ? "selected" : ""
                    }`}
                    disabled={isLoading}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "SUBMIT"}
          </button>

          <div className="test-source">
            {/* ... (Source content here) ... */}
            <h2>Source:</h2>
            <p>
              Developed by Drs. Robert L. Spitzer, Janet B.W. Williams, Kurt
              Kroenke and colleagues, with an educational grant from Pfizer Inc.
            </p>
            <a
              href="https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf
            </a>
            <p>
              <strong>Please note:</strong> Online screening tools are not
              diagnostic instruments. You are encouraged to share your results
              with a physician or healthcare provider.
            </p>
          </div>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p>
            <strong>Score:</strong> {score} / 27
          </p>
          <p>
            <strong>{result.result}</strong>
          </p>
          <p>{result.description}</p>

          <div className="phq9-guidelines">
            {/* ... (PHQ-9 Guide table content here) ... */}
            <h3>Guide for Interpreting PHQ-9 Scores</h3>
            <table className="phq9-table">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Depression Severity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0 - 4</td>
                  <td>None-minimal</td>
                  <td>Patient may not need depression treatment.</td>
                </tr>
                <tr>
                  <td>5 - 9</td>
                  <td>Mild</td>
                  <td>Use clinical judgment about treatment, based on patient’s duration of symptoms and functional impairment.</td>
                </tr>
                <tr>
                  <td>10 - 14</td>
                  <td>Moderate</td>
                  <td>Use clinical judgment about treatment, based on patient’s duration of symptoms and functional impairment.</td>
                </tr>
                <tr>
                  <td>15 - 19</td>
                  <td>Moderately severe</td>
                  <td>Treat using antidepressants, psychotherapy, or a combination of treatments.</td>
                </tr>
                <tr>
                  <td>20 - 27</td>
                  <td>Severe</td>
                  <td>Treat using antidepressants with or without psychotherapy.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {hybridRisk && (
            <div style={{ marginTop: "2rem" }}>
              <h3>Hybrid Risk Analysis</h3>
              <p>
                <strong>LR Score:</strong> {hybridRisk.lr_score}
              </p>
              <p>
                <strong>BERT Score:</strong> {hybridRisk.bert_score}
              </p>
              <p>
                <strong>Hybrid Risk Score:</strong>{" "}
                {hybridRisk.hybrid_risk_score}
              </p>
              <p>
                <strong>Risk Level:</strong> {hybridRisk.risk_level}
              </p>
            </div>
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={q.id}>
                <strong>
                  {i + 1}. {q.text}
                </strong>
                <br />
                <span style={{ color: "#048bb8" }}>
                  Your answer: {answers[i]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* 2. CHATBOT AND BUTTON LOGIC - Placed outside the result-section div, but inside the component's main div */}
      
      {/* This condition checks the isChatbotVisible state and ensures result is available */}
      {isChatbotVisible && result && (
        <div className="chatbot-wrapper">
          <Chatbot
            combinedScore={score}
            classification={result.result}
            hybridRiskData={hybridRisk}
            // 3. Pass the high-risk flag from the hybrid result to the Chatbot
            severeAlert={hybridRisk?.is_high_risk} 
          />
        </div>
      )}

      {/* This condition ensures the button only shows after the result is available */}
      {showResult && (
        <button
          onClick={toggleChatbot}
          ref={chatbotButtonRef}
          className="footer-button"
          disabled={isLoading}
        >
          {isChatbotVisible ? "Hide Alarm bot" : "Open Alarm bot"}
        </button>
      )}
    </div>
  );
};

export default DepressionTest;