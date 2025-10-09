import { useEffect, useState } from "react";
import "../chatbot/Chatbot.css";

function Chatbot({ combinedScore, classification }) {
  const [visible, setVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [adviceMessage, setAdviceMessage] = useState("");

  useEffect(() => {
    if (combinedScore !== undefined && classification) {
      setVisible(true);

      // Main result message
      const resultText = `Your test result: ${classification}(Score: ${combinedScore})`;

      // Dynamic response based on classification
      let adviceText = "";
      if (classification.toLowerCase().includes("severe")) {
        adviceText =
          "It seems your symptoms are on the higher side. I encourage you to reach out to a mental health professional or someone you trust. You’re not alone 💙";
      } else if (classification.toLowerCase().includes("moderate")) {
        adviceText =
          "You may be experiencing moderate symptoms. Try relaxation, journaling, or talking to a trusted friend — it can help a lot!";
      } else {
        adviceText =
          "Your results suggest mild or minimal symptoms. Keep up your good habits and continue taking care of your well-being!";
      }

      setResultMessage(resultText);
      setAdviceMessage(adviceText);
    }
  }, [combinedScore, classification]);

  if (!visible) return null;

  return (
    <div className="chatbot-floating-container">
      <div className="chatbot-message-box">
        <p className="chatbot-text">{resultMessage}</p>
        <p className="chatbot-text">{adviceMessage}</p>
      </div>
      <div className="chatbot-icon">
        💬
      </div>
    </div>
  );
}

export default Chatbot;
