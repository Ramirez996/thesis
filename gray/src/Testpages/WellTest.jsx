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

const calculateWellBeing = (score) => {
  // WHO-5 standard cut-off for poor well-being is 13 (or 50% of max score: 25). 
  // The risk here is LOW SCORE = HIGH RISK. We reverse the logic from GAD-7/PHQ-9.
  
  // Based on common WHO-5 guidelines (score < 13 suggests low mood/depression screening)
  const isHighRisk = score < 13; 

  if (score >= 21) return { result: "Excellent Well-being – Keep up the great work!", description: "You seem to be experiencing a strong sense of well-being. Keep doing what you're doing, and stay mindful of your mental and emotional health.", is_high_risk: isHighRisk };
  if (score >= 16) return { result: "Good Well-being – You're doing well!", description: "You are generally feeling well. Continue with your positive habits and take time for regular self-care.", is_high_risk: isHighRisk };
  if (score >= 11) return { result: "Fair Well-being – Consider taking time for self-care.", description: "You're doing okay, but it might help to prioritize relaxation and enjoyable activities. Pay attention to your mental health and take breaks when needed.", is_high_risk: isHighRisk };
  if (score >= 6) return { result: "Poor Well-being – It's important to focus on your well-being.", description: "You're likely under some stress or emotional fatigue. Make time for rest and self-care, and talk to someone if you're feeling overwhelmed.", is_high_risk: isHighRisk };
  return { result: "Very Poor Well-being – Please consider reaching out for support.", description: "Your score suggests that you may be struggling with your well-being. You're not alone, and it’s okay to seek support from a counselor, therapist, or someone you trust.", is_high_risk: isHighRisk };
};

const WellTest = () => {
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [hybridRisk, setHybridRisk] = useState(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false); // NEW STATE
  const chatbotButtonRef = useRef(null); // NEW REF

  const toggleChatbot = () => setIsChatbotVisible(prev => !prev); // NEW HANDLER

  const handleOptionSelect = (index, option) => {
    setAnswers(prev => ({ ...prev, [index]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    const answersList = Object.values(answers);
    const numericAnswers = answersList.map(ans => optionValues[ans]);
    const totalScore = numericAnswers.reduce((a, b) => a + b, 0);

    const testResult = calculateWellBeing(totalScore);

    setScore(totalScore);
    
    // NOTE: The WHO-5 in your backend uses a LR model which predicts HIGH RISK for LOW SCORE.
    // The frontend is calculating standard WHO-5 severity, so we use that here.
    
    // Send data to Flask API
    try {
      const res = await fetch(getApiUrl('WHO5_RISK'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: "Anonymous", // replace with logged-in user later
          answers: numericAnswers, // Send numeric answers for LR model
          score: totalScore,
          result_text: testResult.result,
          description: testResult.description,
          text: answersList.join(". "), // Use answers as text for BERT
        }),
      });

      const data = await res.json();
      setHybridRisk(data);

      // Append the is_high_risk property from the hybrid risk data to the result
      setResult({
        ...testResult,
        is_high_risk: data.is_high_risk, // Use the backend's final risk assessment
      });
      
      // Auto-open chatbot if severe (or based on your logic, low WHO-5 score)
      if (data.is_high_risk) {
        setIsChatbotVisible(true);
      }

    } catch (err) {
      console.error("Error fetching hybrid risk:", err);
      // Fallback if API fails
      setResult(testResult); 
    }
    
    setShowResult(true);
  };

  return (
    <div className="test-container">
      {!showResult ? (
        <div className="question-section">
          <h1>Well-Being Test (WHO-5)</h1>
          {/* ... existing question rendering ... */}
          {questions.map((q, i) => (
            <div key={q.id} className="question-item">
              <p>{i + 1}. {q.text}</p>
              <div className="button-options">
                {q.options.map(option => (
                  <button
                    key={option}
                    className={`option-button ${answers[i] === option ? "selected" : ""}`}
                    onClick={() => handleOptionSelect(i, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button className="submit-button" onClick={handleSubmit}>SUBMIT</button>

           <div className="test-source">
            <h2>Source:</h2>
            <p>
            The WHO-5 was developed during the 1990s by the late Per Bech of the Psychiatric
Centre North Zealand (Copenhagen, Denmark), which hosted a WHO Collaborating
Centre for Mental Health. The WHO-5 was derived from other scales and studies by the
WHO Regional Office in Europe

            </p>

            <a
              href="https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf?sfvrsn=ed43f352_11&download#:~:text=The%20WHO%2D5%20was%20developed,Europe%20%5B1%5D%5B2%5D."
              target="_blank"
              rel="noopener noreferrer"
            >
              https://cdn.who.int/media/docs/default-source/mental-health/who-5_english-original4da539d6ed4b49389e3afe47cda2326a.pdf?sfvrsn=ed43f352_11&download#:~:text=The%20WHO%2D5%20was%20developed,Europe%20%5B1%5D%5B2%5D.
            </a>

            <p><strong>Please note:</strong> Online screening tools are not diagnostic instruments. You are encouraged to share your results with a physician or healthcare provider. Mental Health Assessment and the researchers disclaim any liability, loss, or risk incurred as a consequence, directly or indirectly, from the use and application of these screens.</p>
          </div>

        </div>
      ) : (
        <div className="result-section">
          <h2>Your Result:</h2>
          <p><strong>Score:</strong> {score} / {questions.length * 5}</p>
          <p><strong>{result.result}</strong></p>
          <p>{result.description}</p>

          {hybridRisk && (
            <div className="hybrid-risk-section">
              <h3>Hybrid Risk Assessment</h3>
              <p><strong>BERT Score:</strong> {hybridRisk.bert_score ?? "N/A"}</p>
              <p><strong>Logistic Regression Score:</strong> {hybridRisk.lr_score ?? "N/A"}</p>
              <p><strong>Hybrid Score:</strong> {hybridRisk.hybrid_score}</p>
              <p><strong>Risk Level:</strong> {hybridRisk.risk_level}</p>
            </div>
          )}

          <h3>Your Answers:</h3>
          <ul>
            {questions.map((q, i) => (
              <li key={q.id}>
                <strong>{i + 1}. {q.text}</strong><br />
                <span style={{ color: "#048bb8" }}>Your answer: {answers[i]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* NEW CHATBOT BLOCK */}
      {isChatbotVisible && result && (
        <div className="chatbot-wrapper">
          <Chatbot 
            combinedScore={score}                 
            classification={result.result}         
            hybridRiskData={hybridRisk}           
            severeAlert={hybridRisk?.is_high_risk} // Use the backend's final high-risk flag
          />
        </div>
      )}

      {showResult && (
        <button onClick={toggleChatbot} ref={chatbotButtonRef} className="footer-button">
          {isChatbotVisible ? "Hide Chatbot" : "Open Chatbot"}
        </button>
      )}
    </div>
  );
};

export default WellTest;