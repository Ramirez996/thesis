import React from "react";
import "../componentDesign/HeaderFooter.css";
import { FaFacebookF, FaInstagram, FaTwitter, FaEnvelope, FaPhoneAlt } from "react-icons/fa";

const Footer = ({ setShowHelp, setShowAbout, setShowDevs }) => {
  const conditions = [
    { name: "Depression", link: "https://www.mayoclinic.org/diseases-conditions/depression/symptoms-causes/syc-20356007" },
    { name: "Anxiety", link: "https://www.mayoclinic.org/diseases-conditions/anxiety/symptoms-causes/syc-20350961" },
    { name: "Eating Disorders", link: "https://www.nimh.nih.gov/health/topics/eating-disorders" },
    { name: "Big Five Inventory", link: "https://www.verywellmind.com/the-big-five-personality-dimensions-2795422" },
    { name: "Well-Being", link: "https://www.psychologytoday.com/us/blog/click-here-for-happiness/201901/what-is-well-being-definition-types-and-well-being-skills" },
  ];

  return (
    <div className="footer">

      {/* === Footer Links & Info === */}
      <div className="footer-content">
        <div className="footer-columns">
          {/* Column 1: Learn */}
          <div>
            <h4>Learn About Mental Health</h4>
            <ul>
              {conditions.map((condition, index) => (
                <li key={index}>
                  <a
                    href={condition.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="condition-link"
                  >
                    {condition.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4>Quick Links</h4>
            <ul>
              <li><button onClick={() => setShowAbout?.(true)} className="footer-btn-link">About</button></li>
              <li><button onClick={() => setShowDevs?.(true)} className="footer-btn-link">Developers</button></li>
              <li><button onClick={() => setShowHelp?.(true)} className="footer-btn-link">Get Help</button></li>
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4>Contact Mental Health PH for further Assistance and Help</h4>
            <p><FaEnvelope /> https://mentalhealthph.org/</p>
            <p><FaPhoneAlt /> +63 917 899 8727</p>
            <div className="social-icons">
              <a href="https://www.facebook.com/mentalhealthph" target="_blank" rel="noreferrer"><FaFacebookF /></a>
              <a href="https://x.com/mentalhealthph" target="_blank" rel="noreferrer"><FaTwitter /></a>
              <a href="https://www.instagram.com/mentalhealthph/#" target="_blank" rel="noreferrer"><FaInstagram /></a>
            </div>
          </div>
        </div>
      </div>

      <p>&copy; 2025 Mental Health Dashboard. All rights reserved.</p>
    </div>
  );
};

export default Footer;
