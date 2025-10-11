import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const WellTest = () => {
  const questions = [
    { id: 1, text: "I feel optimistic about the future.", options: ["Not at all", "Sometimes", "Often", "Always"] },
    { id: 2, text: "I feel useful and needed.", options: ["Not at all", "Sometimes", "Often", "Always"] },
    { id: 3, text: "I feel relaxed and at ease.", options: ["Not at all", "Sometimes", "Often", "Always"] },
    { id: 4, text: "I am interested in other people’s problems.", options: ["Not at all", "Sometimes", "Often", "Always"] },
    { id: 5, text: "I have been dealing with my problems well.", options: ["Not at all", "Sometimes", "Often", "Always"] },
  ];

  const optionValues = { "Not at all": 0, "Sometimes": 1, "Often": 2, "Always": 3 };

  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // ✅ NEW

  const handleOptionSelect = (i, option) => setAnswers((prev) => ({ ...prev, [i]: option }));

  const getResult = (score) => {
    if (score >= 12) return { result: "High Well-being", description: "You show signs of positive mental health and optimism." };
    if (score >= 8) return { result: "Moderate Well-being", description: "You are doing fairly well but could use more balance." };
    return { result: "Low Well-being", description: "You might be struggling emotionally. Consider seeking support." };
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
      await fetch(getApiUrl("WELL_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: features, score: totalScore }),
      });
    } catch (err) {
      console.error("Error submitting data:", err);
    }

    setShowResult(true);
    setIsLoading(false); // ✅ STOP LOADING
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <div>
          <h1>Well-being Test</h1>
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

export default WellTest;
