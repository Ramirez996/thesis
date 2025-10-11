import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const questions = [
  { id: 1, text: "I feel satisfied with my life.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 2, text: "I feel that my daily life has meaning.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 3, text: "I am optimistic about the future.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 4, text: "I can handle stress effectively.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 5, text: "I have supportive relationships in my life.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
];

const optionValues = {
  "Strongly Disagree": 0,
  "Disagree": 1,
  "Agree": 2,
  "Strongly Agree": 3,
};

const getResult = (score) => {
  if (score >= 12) return { result: "High Well-being", description: "You have a strong sense of happiness and satisfaction." };
  if (score >= 8) return { result: "Moderate Well-being", description: "You are doing fairly well, but there’s room for improvement." };
  if (score >= 4) return { result: "Low Well-being", description: "You may be facing some challenges—consider self-care or talking to someone." };
  return { result: "Very Low Well-being", description: "You might benefit from professional guidance or support." };
};

const WellTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hybridRisk, setHybridRisk] = useState(null);

  const handleOptionSelect = (i, option) => setAnswers(prev => ({ ...prev, [i]: option }));

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsLoading(true);
    const features = questions.map((_, i) => optionValues[answers[i]]);
    const totalScore = features.reduce((sum, val) => sum + val, 0);
    setScore(totalScore);

    const evaluation = getResult(totalScore);
    setResult(evaluation);

    try {
      const response = await fetch(getApiUrl("WELL_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: features, score: totalScore }),
      });
      const data = await response.json();
      setHybridRisk(data);
      setShowResult(true);
    } catch (err) {
      console.error("Error:", err);
    }

    setIsLoading(false);
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <>
          <h1>Well-being Test</h1>
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>{i + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map(opt => (
                  <button
                    key={opt}
                    className={`option-button ${answers[i] === opt ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(i, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Submitting..." : "SUBMIT"}
          </button>
        </>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p><strong>Score:</strong> {score} / 15</p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>
        </div>
      )}

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
