import { useEffect, useState } from "react";
import "../chatbot/Chatbot.css";

// 1. RECEIVE THE NEW PROP: hybridRiskData
function Chatbot({ combinedScore, classification, hybridRiskData }) {
  const [visible, setVisible] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [adviceMessage, setAdviceMessage] = useState("");
  const [hybridMessage, setHybridMessage] = useState(""); // State for hybrid risk message

  useEffect(() => {
    if (combinedScore !== undefined && classification) {
      setVisible(true);

      // Main result message
      const resultText = `Your test result: ${classification}(Score: ${combinedScore})`;

      // Dynamic response based on classification
      let adviceText = "";
      if (classification.toLowerCase().includes("severe")) {
        adviceText =
          "It seems your symptoms are on the higher side. I encourage you to reach out to a mental health professional or someone you trust. You’re not alone, and support is available.";
      } else if (classification.toLowerCase().includes("moderate")) {
        adviceText =
          "You may be experiencing moderate symptoms. Try relaxation, journaling, or talking to a trusted friend — it can help a lot!";
      } else {
        adviceText =
          "Your results suggest mild or minimal symptoms. Keep up your good habits and continue taking care of your well-being!";
      }

let hybridText = "";
      if (hybridRiskData) {
        
        // Use the Depression keys (more descriptive) and fall back to Anxiety keys.
        const finalRiskLevel = hybridRiskData.risk_level || hybridRiskData.final_risk;
        const hybridScore = hybridRiskData.hybrid_risk_score || hybridRiskData.final_risk;
        const bertScore = hybridRiskData.bert_score || hybridRiskData.bert_anomaly_score;

        // Check for missing risk level and provide a fallback.
        const displayRiskLevel = finalRiskLevel ? finalRiskLevel : 
              (hybridScore >= 0.5 ? "High" : "Low");
        
        hybridText = `Hybrid Analysis: Your final risk level is ${displayRiskLevel}. (LR Score: ${hybridRiskData.lr_score}, BERT Score: ${bertScore}).`;
      }
      
      setResultMessage(resultText);
      setAdviceMessage(adviceText);
      setHybridMessage(hybridText);
    }
  }, [combinedScore, classification, hybridRiskData]);

  if (!visible) return null;

  return (
    <div className="chatbot-floating-container">
      <div className="chatbot-message-box">
        <p className="chatbot-text">{resultMessage}</p>
        
        {/* 3. DISPLAY THE HYBRID MESSAGE */}
        {hybridRiskData && (
          <p className="chatbot-text hybrid-analysis">{hybridMessage}</p>
        )}
        
        <p className="chatbot-text">{adviceMessage}</p>
      </div>
      <div className="chatbot-icon">
        🤖
      </div>
    </div>
  );
}

export default Chatbot;