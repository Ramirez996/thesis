import React from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css"; 
const Personality = () => {
  const navigate = useNavigate();

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>Personality Test</h2>
        <p>
          The <strong>BFI-10 (Big Five Inventory-10)</strong> is a quick personality test that evaluates your behavior based on the Big Five personality traits. These traits are widely recognized in psychology and give insight into how you typically respond to various situations.
        </p>
        <p>
          This version of the test consists of only 10 short questions. You will rate yourself on the following traits:
          <ul>
            <li><strong>Openness:</strong> How open you are to new experiences and ideas.</li>
            <li><strong>Conscientiousness:</strong> Your level of organization and reliability.</li>
            <li><strong>Extraversion:</strong> Your tendency to be outgoing and sociable.</li>
            <li><strong>Agreeableness:</strong> Your ability to be cooperative and compassionate.</li>
            <li><strong>Neuroticism:</strong> Your tendency to experience negative emotions like anxiety or mood swings.</li>
          </ul>
        </p>
        <p>
          Each statement will ask you to rate how much you agree or disagree with the trait on a scale from:
          <ul>
            <li>Strongly disagree</li>
            <li>Disagree</li>
            <li>Neutral</li>
            <li>Agree</li>
            <li>Strongly agree</li>
          </ul>
        </p>
        <p>
          <strong>This test can help you:</strong>
          <ul>
            <li>Identify your core personality traits</li>
            <li>Gain insight into your strengths and areas for growth</li>
            <li>Start understanding your behavior patterns</li>
          </ul>
        </p>
        <p>
          <em>Remember, this is a reflection of your typical traits and is not an exhaustive psychological analysis.</em>
        </p>
        <button className="start-test-btn" onClick={() => navigate("/eating-disorder-test")}>
          Start Test
        </button>
      </div>
    </div>
  );
};

export default Personality;
