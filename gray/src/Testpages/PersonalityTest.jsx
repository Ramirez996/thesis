import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";

const questions = [
  { id: 1, text: "I see myself as someone who is talkative.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 2, text: "I see myself as someone who is organized.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 3, text: "I see myself as someone who worries a lot.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 4, text: "I see myself as someone who is imaginative.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
  { id: 5, text: "I see myself as someone who is helpful and unselfish.", options: ["Strongly Disagree", "Disagree", "Agree", "Strongly Agree"] },
];

const optionValues = {
  "Strongly Disagree": 0,
  "Disagree": 1,
  "Agree": 2,
  "Strongly Agree": 3,
};

const getResult = (score) => {
  if (score >= 12) return { result: "Extroverted and Positive", description: "You exhibit openness, confidence, and warmth." };
  if (score >= 8) return { result: "Balanced Personality", description: "You have a well-rounded personality type." };
  if (score >= 4) return { result: "Introverted", description: "You may prefer quiet environments or introspection." };
  return { result: "Reserved", description: "You tend to be calm and reserved in most situations." };
};

const PersonalityTest = () => {
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
      await fetch(getApiUrl("PERSONALITY_RISK"), {
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
          <h1>Personality Test</h1>
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

export default PersonalityTest;
