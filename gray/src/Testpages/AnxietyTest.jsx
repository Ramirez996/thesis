import React, { useState, useRef } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";
import { getApiUrl } from "../config/api";
import { supabase } from "../supabaseClient";
import { getAuth } from "firebase/auth"; // ✅ import Firebase auth

const questions = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Being so restless that it is hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Feeling afraid as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] }
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3
};

const getAnxietyResult = (totalScore) => {
  let result;
  if (totalScore >= 15) {
    result = {
      result: "Severe Anxiety – Consider professional help.",
      description: "Your score suggests severe anxiety. Please consult a professional.",
      is_high_risk: true,
    };
  } else if (totalScore >= 10) {
    result = {
      result: "Moderate Anxiety – Keep monitoring.",
      description: "Your score suggests moderate anxiety.",
      is_high_risk: false,
    };
  } else if (totalScore >= 5) {
    result = {
      result: "Mild Anxiety – Be mindful of your well-being.",
      description: "Your score suggests mild anxiety.",
      is_high_risk: false,
    };
  } else {
    result = {
      result: "Minimal Anxiety – Keep taking care of yourself!",
      description: "Your score indicates minimal anxiety.",
      is_high_risk: false,
    };
  }
  return result;
};

const AnxietyTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const chatbotButtonRef = useRef(null);

  const toggleChatbot = () => setIsChatbotVisible((prev) => !prev);

  const handleOptionSelect = (index, option) => {
    setAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all the questions before submitting.");
      return;
    }

    setIsLoading(true);

    const features = questions.map((_, i) => optionValues[answers[i]]);
    const totalScore = features.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    const localResult = getAnxietyResult(totalScore);

    try {
      const response = await fetch(getApiUrl("GAD7_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: "Anonymous",
          answers: features,
          score: totalScore,
          result_text: localResult.result,
          text: "User completed the anxiety test"
        })
      });

      const data = await response.json();
      setHybridRisk(data);
      setResult(localResult);

      if (data.is_high_risk) {
        setIsChatbotVisible(true);
      }

      // ✅ INSERT TO SUPABASE (with Firebase user info)
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        const { error } = await supabase.from("anxiety_results").insert([
          {
            user_id: user.uid,
            user_name: user.displayName || "Anonymous",
            score: totalScore,
            result_text: localResult.result,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("Error saving result to Supabase:", error.message);
        } else {
          console.log("Result successfully saved to Supabase ✅");
        }
      } else {
        console.warn("No Firebase user logged in – result not saved.");
      }

    } catch (error) {
      console.error("Error fetching hybrid risk:", error);
      setResult(localResult);

      if (localResult.is_high_risk) {
        setIsChatbotVisible(true);
      }
    } finally {
      setShowResult(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="test-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing your responses...</p>
        </div>
      )}

      <h1>Anxiety Test (GAD-7)</h1>

      {!showResult ? (
        <div className="question-section">
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>
                {i + 1}. {q.text}
              </p>
              <div className="button-options">
                {q.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(i, option)}
                    className={`option-button ${answers[i] === option ? "selected" : ""}`}
                    disabled={isLoading}
                  >
                    {option}
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
            <h2>Source:</h2>
            <p>
              Developed by: Spitzer RL, Kroenke K, Williams JB, Löwe B.  
              A brief measure for assessing generalized anxiety disorder: the GAD-7.  
              Arch Intern Med. 2006;166(10):1092-1107.
            </p>
            <a
              href="https://www.mdcalc.com/calc/1725/gad-7-anxiety-scale"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.mdcalc.com/calc/1725/gad-7-anxiety-scale
            </a>
            <p>
              <strong>Please note:</strong> Online screening tools are not diagnostic instruments.  
              Share your results with a healthcare provider for proper evaluation.
            </p>
          </div>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p>
            <strong>Score:</strong> {score} / {questions.length * 3}
          </p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>

          <div className="gad7-guidelines">
            <h3>Guide for Interpreting GAD-7 Scores</h3>
            <table className="gad7-table">
              <thead>
                <tr><th>Score</th><th>Anxiety Severity</th></tr>
              </thead>
              <tbody>
                <tr><td>0–4</td><td>Minimal Anxiety</td></tr>
                <tr><td>5–9</td><td>Mild Anxiety</td></tr>
                <tr><td>10–14</td><td>Moderate Anxiety</td></tr>
                <tr><td>15–21</td><td>Severe Anxiety</td></tr>
              </tbody>
            </table>
          </div>

          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Assessment</h3>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Anomaly Score:</strong> {hybridRisk.bert_anomaly_score}</p>
              <p><strong>Final Risk:</strong> {hybridRisk.final_risk}</p>
              <p><strong>High Risk:</strong> {hybridRisk.is_high_risk ? "Yes" : "No"}</p>
            </div>
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={q.id}>
                <strong>{i + 1}. {q.text}</strong>
                <br />
                <span style={{ color: "#048bb8" }}>Your answer: {answers[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResult && (
        <button
          onClick={toggleChatbot}
          ref={chatbotButtonRef}
          className="footer-button"
        >
          {isChatbotVisible ? "Hide Alarm bot" : "Open Alarm bot"}
        </button>
      )}

      {isChatbotVisible && result && (
        <div className="chatbot-wrapper">
          <Chatbot
            combinedScore={score}
            classification={result.result}
            hybridRiskData={hybridRisk}
            severeAlert={hybridRisk?.is_high_risk}
          />
        </div>
      )}
    </div>
  );
};

export default AnxietyTest;
