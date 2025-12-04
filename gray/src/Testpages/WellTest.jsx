import React, { useState, useRef } from "react";
import "../testDesign/EatingTest.css";
import { getApiUrl } from "../config/api";
import Chatbot from "../pages/Chatbot"; // Import Chatbot

const questions = [
  { id: 1, text: "I have felt cheerful and in good spirits.", options: ["At no time", "Less than half the time", "More than half the time", "Some of the time", "Most of the time", "All of the time"] },
  { id: 2, text: "I have felt calm and relaxed.", options: ["At no time", "Less than half the time", "More than half the time", "Some of the time", "Most of the time", "All of the time"] },
  { id: 3, text: "I have felt active and vigorous.", options: ["At no time", "Less than half the time", "More than half the time", "Some of the time", "Most of the time", "All of the time"] },
  { id: 4, text: "I woke up feeling fresh and rested.", options: ["At no time", "Less than half the time", "More than half the time", "Some of the time", "Most of the time", "All of the time"] },
  { id: 5, text: "My daily life has been filled with things that interest me.", options: ["At no time", "Less than half the time", "More than half the time", "Some of the time", "Most of the time", "All of the time"] },
];

const optionValues = {
  "At no time": 0,
  "Less than half the time": 1,
  "More than half the time": 2,
  "Some of the time": 3,
  "Most of the time": 4,
  "All of the time": 5,
};

const calculateWellBeing = (rawScore) => {
  const percentageScore = rawScore * 4;
  let result = "";
  let description = "";
  let isHighRisk = false;

  if (percentageScore <= 28) {
    result = "😖Indicative of Depression";
    description =
      "Your score suggests a high likelihood of depression. It’s important to reach out to a mental health professional or counselor for further assessment and support.";
    isHighRisk = true;
  } else if (percentageScore < 50) {
    result = "😟Poor Well-being (Possible Depression)";
    description =
      "Your well-being may be lower than average. Consider engaging in self-care, social connection, and if necessary, consulting a healthcare provider.";
    isHighRisk = true;
  } else {
    result = "😆Good Well-being";
    description =
      "You seem to be experiencing a satisfactory level of well-being. Keep maintaining your healthy habits and stay mindful of your emotional state.";
  }

  return { result, description, percentageScore, is_high_risk: isHighRisk };
};

const WellTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [rawScore, setRawScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const chatbotButtonRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChatbot = () => setIsChatbotVisible((prev) => !prev);

  const handleOptionSelect = (index, option) => {
    setAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsLoading(true);

    const answersList = Object.values(answers);
    const numericAnswers = answersList.map((ans) => optionValues[ans]);
    const totalRawScore = numericAnswers.reduce((a, b) => a + b, 0);

    const testResult = calculateWellBeing(totalRawScore);
    setRawScore(totalRawScore);

    try {
      const res = await fetch(getApiUrl("WHO5_RISK"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: "Anonymous",
          answers: numericAnswers,
          score: totalRawScore,
          percentage_score: testResult.percentageScore,
          result_text: testResult.result,
          description: testResult.description,
          text: answersList.join(". "),
        }),
      });

      const data = await res.json();
      setHybridRisk(data);
      setResult({
        ...testResult,
        is_high_risk: data.is_high_risk ?? testResult.is_high_risk,
      });

      if (data.is_high_risk) {
        setIsChatbotVisible(true);
      }
    } catch (err) {
      console.error("Error fetching hybrid risk:", err);
      setResult(testResult);
    }

    setShowResult(true);
    setIsLoading(false);
  };

  return (
    <div className="test-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Analyzing your responses...</p>
        </div>
      )}

      {!showResult ? (
        <div className="question-section">
          <h1>World Health Organization(WHO-5)Well-Being Test </h1>
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>
                {i + 1}. {q.text}
              </p>
              <div className="button-options">
                {q.options.map((option) => (
                  <button
                    key={option}
                    className={`option-button ${
                      answers[i] === option ? "selected" : ""
                    }`}
                    onClick={() => handleOptionSelect(i, option)}
                    disabled={isLoading}
                  >
                    {option}
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

          <div className="test-source">
            <h2>Source:</h2>
            <p>
              The WHO-5 was developed during the 1990s by the late Per Bech of
              the Psychiatric Centre North Zealand (Copenhagen, Denmark), which
              hosted a WHO Collaborating Centre for Mental Health. The WHO-5 was
              derived from other scales and studies by the WHO Regional Office
              in Europe.
            </p>
            <a
              href="https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original.pdf
            </a>
            <p>
              <strong>Please note:</strong> Online screening tools are not
              diagnostic instruments. You are encouraged to share your results
              with a physician or healthcare provider. Mental Health Assessment
              and the researchers disclaim any liability, loss, or risk incurred
              as a consequence, directly or indirectly, from the use and
              application of these screens.
              Under <strong>Replublic Act No. 10029, Section 3(d), "Philippines Psychology Act of 2009"</strong>, this defines psychological assessment as the use of “objective and standardized measurement tools”.
              Section 14: Use of Psychological Tests, Only licensed psychologists and psychometricians may administer, score, and interpret psychological tests.
              Since PHQ-9, GAD-7, WHO-5, and BFI-10 are psychological assessment instruments, their use is regulated by this section.
            </p>
          </div>
        </div>
      ) : (
            <div className="result-section">

              <div className="result-summary">
                <h2>Your Result</h2>

            {/* Score Box */}
            <div className="score-box">
              <p className="score-value">{rawScore} / 25</p>
              <p className="score-label">Raw Score</p>

            {/* NEW: Percentage sentence */} 
            <p className="score-percentage"> <strong>Percentage Score:</strong> 
            {result.percentageScore}% </p> 
            </div>

            {/* Result Message */}
            <div className="result-message">
              <h3>{result.result}</h3>
              <p>{result.description}</p>
            </div>
              </div>

          {/* === WHO-5 Scoring Guidelines (BOXED STYLE) === */}
          <div className="scoring-guidelines" style={{ marginTop: "2rem" }}>
            <h3>WHO-5 Scoring Guidelines:</h3>
            <p>
              <strong>Raw Score:</strong> Calculated by summing the responses to the five questions, 
              resulting in a total between <strong>0 and 25</strong>.
            </p>
            <p>
              <strong>Percentage Score:</strong> Multiply the raw score by <strong>4</strong> to convert 
              it to a scale from <strong>0 to 100</strong>.
            </p>
            <p>
              <strong>Interpretation:</strong>
            </p>
            <ul>
              <li>Scores of <strong>&lt; 50</strong> indicate <em>poor well-being</em> and suggest the need for further investigation into possible symptoms of depression.</li>
              <li>Scores of <strong>≤ 28</strong> are <em>indicative of depression</em>.</li>
            </ul>
            <p>
              <strong>Note:</strong> The WHO-5 is a screening tool and not a diagnostic instrument. 
              If your score is low, consider discussing your results with a qualified healthcare provider.
            </p>
          </div>
          
          {/* === Your Answers (BOXED LIST STYLE) === */}
          <h3 style={{ marginTop: '2rem' }}>Your Answers:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={q.id}>
                <strong>{i + 1}. {q.text}</strong><br />
                <span style={{ color: "#048bb8" }}>Your answer: {answers[i]}</span>
              </li>
            ))}
          </ul>
                              {/* === Hybrid Risk Assessment (Only renders if data is present) === */}
          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Assessment</h3>
              <p>
                <strong>BERT Score:</strong> {hybridRisk.bert_score ?? "N/A"}
              </p>
              <p>
                <strong>Logistic Regression Score:</strong>{" "}
                {hybridRisk.lr_score ?? "N/A"}
              </p>
              <p>
                <strong>Hybrid Score:</strong> {hybridRisk.hybrid_score}
              </p>
              <p>
                <strong>Risk Level:</strong> {hybridRisk.risk_level}
              </p>
            </div>
          )}
        </div>
      )}

      {isChatbotVisible && result && (
        <div className="chatbot-wrapper">
          <Chatbot
            combinedScore={rawScore}
            classification={result.result}
            hybridRiskData={hybridRisk}
            severeAlert={hybridRisk?.is_high_risk}
          />
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
    </div>
  );
};

export default WellTest;