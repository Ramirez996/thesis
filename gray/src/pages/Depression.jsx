import React from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css"; 
const Depression = () => {
  const navigate = useNavigate();

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>Depression Test</h2>
        <p>
          The <strong>PHQ-9 (Patient Health Questionnaire-9)</strong> is a commonly used screening tool to help assess symptoms of <strong>depression</strong>. It asks about your experiences over the <strong>last two weeks</strong>.
        </p>
        <p>
          This test is not intended to provide a medical diagnosis, but it can help you reflect on how you're feeling and whether seeking additional support might be beneficial.
        </p>
        <p>
          You'll be asked about things like:
          <ul>
            <li>Feeling down or hopeless</li>
            <li>Changes in sleep or appetite</li>
            <li>Lack of interest in daily activities</li>
            <li>Fatigue, guilt, or concentration issues</li>
          </ul>
        </p>
        <p>
          Each question will have response options such as:
          <ul>
            <li>Not at all (0)</li>
            <li>Several days (1)</li>
            <li>More than half the days (2)</li>
            <li>Nearly every day (3)</li>
          </ul>
        </p>
        <p>
          <strong>This test can help you:</strong>
          <ul>
            <li>Recognize patterns of depressive symptoms</li>
            <li>Track how your mood has changed over time</li>
            <li>Start conversations with a healthcare provider</li>
          </ul>
        </p>
        <p>
          <em>Please answer honestly and based on your recent experience.</em>
        </p>
        <button className="start-test-btn" onClick={() => navigate("/depression-test")}>
          Start Test
        </button>
      </div>
    </div>
  );
};

export default Depression;
