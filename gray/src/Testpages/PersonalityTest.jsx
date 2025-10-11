import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const PersonalityTest = () => {
  const questions = [
    { id: 1, text: "I see myself as someone who is talkative.", options: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"] },
    { id: 2, text: "I see myself as someone who tends to be lazy.", options: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"] },
    { id: 3, text: "I see myself as someone who is relaxed and handles stress well.", options: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"] },
    { id: 4, text: "I see myself as someone who has a vivid imagination.", options: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"] },
    { id: 5, text: "I see myself as someone who is generally trusting.", options: ["Strongly disagree", "Disagree", "Agree", "Strongly agree"] },
  ];

  const optionValues = { "Strongly disagree": 0, "Disagree": 1, "Agree": 2, "Strongly agree": 3 };

  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // ✅ NEW

  const handleOptionSelect = (i, option) => setAnswers((prev) => ({ ...prev, [i]: option }));

  const getResult = (score) => {
    if (score >= 12) return { result: "Extroverted Personality", description: "You are expressive and outgoing." };
    if (score >= 8) return { result: "Balanced Personality", description: "You have a good mix of introversion and extroversion." };
    return { result: "Introverted Personality", description: "You prefer calm and quiet environments." };
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsLoading(true); // ✅ START LOADING

    const features = questions.map((_, i) => optionValues[answers[i]]);
    const totalScore = features.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    const evaluation = getResult(totalScore);
    setResult(evaluation);

    try {
      await fetch(getApiUrl("PERSONALITY_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: features, score: totalScore }),
      });
    } catch (err) {
      console.error("Error submitting personality data:", err);
    }

    setShowResult(true);
    setIsLoading(false); // ✅ STOP LOADING
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <div>
          <h1>Personality Test</h1>
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>{i + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(i, opt)}
                    className={`option-button ${answers[i] === opt ? "selected" : ""}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={handleSubmit} className="submit-button" disabled={isLoading}>
            {isLoading ? "Submitting..." : "SUBMIT"}
          </button>
        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p><strong>Score:</strong> {score}</p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>
        </div>
      )}

      {/* ✅ LOADING OVERLAY */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing your responses...</p>
        </div>
      )}
    </div>
  );
};

export default PersonalityTest;
