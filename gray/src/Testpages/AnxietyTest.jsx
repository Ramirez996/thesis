import React, { useState, useRef } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";
import { getApiUrl } from "../config/api";

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
      {/* === Loading Overlay === */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing your responses...</p>
        </div>
      )}

      <h1>Anxiety Test for GAD-7 (Generalized Anxiety Disorder)</h1>

      {!showResult ? (
        <div className="question-section">
          {/* ... (Question display logic) ... */}
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
            {/* ... (Source content remains here) ... */}
            <h2>Source:</h2>
            <p>
              Developed by : Spitzer RL, Kroenke K, Williams JB, Löwe B. 
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
          
          {/* 1. TOP RESULT SUMMARY */}
          <h2>Your Result:</h2>
          <p>
            <strong>Score:</strong> {score} / {questions.length * 3}
          </p>
          <p>
            <strong>{result.result}</strong>
          </p>
          <p>{result.description}</p>

          {/* 2. GAD-7 GUIDELINES (MOVED TO THE TOP) */}
          <div className="gad7-guidelines">
            <h3>Guide for Interpreting GAD-7 Scores</h3>
            <p>
              The GAD-7 is calculated by assigning scores of <strong>0, 1, 2, and 3</strong> to the response
              categories of “Not at all,” “Several days,” “More than half the days,” and “Nearly every day,” respectively.
              The total score ranges from <strong>0 to 21</strong>.
            </p>
            <table className="gad7-table">
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Anxiety Severity</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0 – 4</td>
                  <td>Minimal Anxiety</td>
                </tr>
                <tr>
                  <td>5 – 9</td>
                  <td>Mild Anxiety</td>
                </tr>
                <tr>
                  <td>10 – 14</td>
                  <td>Moderate Anxiety</td>
                </tr>
                <tr>
                  <td>15 – 21</td>
                  <td>Severe Anxiety</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. HYBRID RISK ASSESSMENT */}
          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Assessment</h3>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score}</p>
              <p><strong>BERT Anomaly Score:</strong> {hybridRisk.bert_anomaly_score}</p>
              <p><strong>Final Risk:</strong> {hybridRisk.final_risk}</p>
              <p><strong>High Risk:</strong> {hybridRisk.is_high_risk ? "Yes" : "No"}</p>
            </div>
          )}

          {/* 4. YOUR ANSWERS (Retains boxed styling as it's inside .result-section) */}
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

      {/* CHATBOT BUTTON AND WRAPPER (Outside result-section) */}
      
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
