import React from "react";
import { useNavigate } from "react-router-dom";
import "./anxiety.css";

const Anxiety = () => {
  const navigate = useNavigate();

  return (
    <div className="mental-container">
      <div className="mental-description">
        <h2>Anxiety Test</h2>
        <p>
          The <strong>GAD-7 (Generalized Anxiety Disorder-7)</strong> is a brief and commonly used tool to help identify signs of anxiety and assess its severity. It consists of <strong>7 simple questions</strong> based on how you've been feeling over the <strong>past two weeks</strong>.
        </p>
        <p>
          This test is not a diagnosis, but it can give you a better understanding of how anxiety might be affecting your daily life.
        </p>
        <p>
          Each question will ask you how often you’ve been bothered by a specific issue — your options will range from:
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
            <li>Recognize symptoms of anxiety</li>
            <li>Reflect on your recent mental health</li>
            <li>Consider whether further support may be helpful</li>
          </ul>
        </p>
        <p>
          <em>Tip: Try to answer honestly based on how you've felt over the past two weeks.</em>
        </p>
        <button className="start-test-btn" onClick={() => navigate("/anxiety-test")}>
          Start Test
        </button>
      </div>
    </div>
  );
};

export default Anxiety;
