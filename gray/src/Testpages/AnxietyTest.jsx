import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const questions = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Feeling afraid as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

const optionValues = {
  "Not at all": 0,
  "Several days": 1,
  "More than half the days": 2,
  "Nearly every day": 3,
};

const getResult = (score) => {
  if (score >= 15) return { result: "Severe Anxiety", description: "You may be experiencing severe anxiety. Consider seeking professional help." };
  if (score >= 10) return { result: "Moderate Anxiety", description: "You show moderate anxiety symptoms. Try self-care or counseling." };
  if (score >= 5) return { result: "Mild Anxiety", description: "You might be slightly anxious. Monitor your feelings regularly." };
  return { result: "Minimal Anxiety", description: "You seem to be managing stress well." };
};

const AnxietyTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

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
      await fetch(getApiUrl("ANXIETY_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: features, score: totalScore }),
      });
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
          <h1>Anxiety Test (GAD-7)</h1>
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
          <p><strong>Score:</strong> {score} / 21</p>
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

export default AnxietyTest;
