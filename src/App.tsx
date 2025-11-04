// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthWatcher } from "@/components/AuthWatcher";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/AuthPage";
import HomePage from "@/pages/HomePage";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function App() {
  return (
    <HashRouter>
      <AuthWatcher />
      <Routes>
        <Route path="/" element={<Navigate to="/network" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/network"
          element={
            <OnboardingGate>
              <HomePage />
            </OnboardingGate>
          }
        />
      </Routes>
    </HashRouter>
  );
}
