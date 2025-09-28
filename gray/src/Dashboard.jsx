import React from "react";
import { useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import DashboardView from "./pages/DashboardView";

const Dashboard = ({ children }) => {
  const location = useLocation();

  //routes na maghihide once na pumindot ako sa isa sa mga buttons
  const hideDashboardViewOnRoutes = [
    "/anxiety",
    "/depression",
    "/well-being",
    "/eating-disorder",
    "/anxiety-test",
    "/depression-test",
    "/well-being-test",
    "/eating-disorder-test",
  ];

  const shouldShowDashboardView = !hideDashboardViewOnRoutes.includes(location.pathname);

  return (
    <div className="dashboard">



      {/* Header */}
      <Header onLoginClick={() => console.log("Login clicked")} />


      {/* Dashboard View - show only on specific routes */}
      {shouldShowDashboardView && <DashboardView />}



      {/* Render nested route content */}
      <main className="main-content">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Dashboard;
