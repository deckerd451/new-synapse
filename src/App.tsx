// src/App.tsx (or routes file)
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthWatcher } from "@/components/AuthWatcher";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/AuthPage";        // create or reuse
import NetworkPage from "@/pages/NetworkPage";    // existing
import { OnboardingGate } from "@/components/OnboardingGate";

export default function App() {
  return (
    <BrowserRouter basename="/new-synapse"> {/* important for GitHub Pages subpath */}
      <AuthWatcher />
      <Routes>
        <Route path="/" element={<Navigate to="/network" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/network"
          element={
            <OnboardingGate>
              <NetworkPage />
            </OnboardingGate>
          }
        />
        {/* settings page can reuse ProfileTab without the welcome wrapper */}
        {/* <Route path="/settings/profile" element={<ProfileSettingsPage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
