import React, { useState } from "react";
import "../testDesign/EatingTest.css";
import Chatbot from "../pages/Chatbot";
import { supabase } from "../supabaseClient";
import { getAuth } from "firebase/auth";

const questions = [
  { id: 1, text: "Feeling nervous, anxious, or on edge?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 2, text: "Not being able to stop or control worrying?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 3, text: "Worrying too much about different things?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 4, text: "Trouble relaxing?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 5, text: "Being so restless that it is hard to sit still?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 6, text: "Becoming easily annoyed or irritable?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
  { id: 7, text: "Feeling afraid as if something awful might happen?", options: ["Not at all", "Several days", "More than half the days", "Nearly every day"] },
];

const scoreMap = { "Not at all": 0, "Several days": 1, "More than half the days": 2, "Nearly every day": 3 };

const AnxietyTest = () => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleOptionChange = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setLoading(true);

    // Compute total score
    const total = Object.values(answers).reduce((sum, option) => sum + scoreMap[option], 0);
    setTotalScore(total);
    setSubmitted(true);

    // Save to Supabase with Firebase UID
    await saveTestResult(total);

    setLoading(false);
  };

  const saveTestResult = async (score) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to save your test result.");
      return;
    }

    const { error } = await supabase.from("anxiety_results").insert([
      {
        user_id: user.uid,
        user_name: user.displayName || "Anonymous",
        score: score,
        created_at: new Date(),
      },
    ]);

    if (error) console.error("Error saving anxiety test result:", error);
    else console.log("Anxiety test result saved successfully.");
  };

  const getResultInterpretation = (score) => {
    if (score <= 4) return "Minimal anxiety";
    if (score <= 9) return "Mild anxiety";
    if (score <= 14) return "Moderate anxiety";
    return "Severe anxiety";
  };

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>GAD-7 Anxiety Test</h2>
        <p>
          The <strong>GAD-7 (Generalized Anxiety Disorder-7)</strong> test helps
          identify symptoms and severity of anxiety. Please answer how often
          you've been bothered by the following issues over the past 2 weeks.
        </p>
      </div>

      {!submitted ? (
        <div className="test-form">
          {questions.map((q) => (
            <div key={q.id} className="question-block">
              <p>{q.text}</p>
              <div className="options">
                {q.options.map((option) => (
                  <label key={option} className="option-label">
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option}
                      checked={answers[q.id] === option}
                      onChange={() => handleOptionChange(q.id, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      ) : (
        <div className="test-result">
          <h3>Your Total Score: {totalScore}</h3>
          <p>
            Interpretation: <strong>{getResultInterpretation(totalScore)}</strong>
          </p>
          <p>
            If your anxiety is moderate or severe, consider reaching out to a mental
            health professional for further assessment.
          </p>
        </div>
      )}

      <div className="chatbot-section">
        <Chatbot />
      </div>
    </div>
  );
};

export default AnxietyTest;
