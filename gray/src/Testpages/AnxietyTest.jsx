import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const AnxietyTest = () => {
  const questions = [
    { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
    { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
    { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
    { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
    { id: 5, text: "Being easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  ];

  const optionValues = { "Not at all": 0, "Several days": 1, "More than half the days": 2, "Nearly every day": 3 };

  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // ✅ NEW

  const handleOptionSelect = (i, option) => setAnswers((prev) => ({ ...prev, [i]: option }));

  const getResult = (score) => {
    if (score >= 15) return { result: "Severe Anxiety", description: "You may be experiencing severe anxiety. Consider seeking help." };
    if (score >= 10) return { result: "Moderate Anxiety", description: "You might be feeling moderate anxiety. Try relaxation techniques." };
    if (score >= 5) return { result: "Mild Anxiety", description: "You have mild symptoms of anxiety. Take care of your mental health." };
    return { result: "Minimal Anxiety", description: "You are doing well." };
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
      await fetch(getApiUrl("ANXIETY_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: features, score: totalScore }),
      });
    } catch (err) {
      console.error("Error submitting anxiety data:", err);
    }

    setShowResult(true);
    setIsLoading(false); // ✅ STOP LOADING
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <div>
          <h1>Anxiety Test (GAD-7)</h1>
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

export default AnxietyTest;
