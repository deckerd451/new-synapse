// src/App.tsx
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "@/components/auth/Login";
import HomePage from "@/pages/HomePage";
import OnboardingPage from "@/pages/OnboardingPage";
import { OnboardingGate } from "@/components/OnboardingGate";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ Explicit login route */}
        <Route path="/login" element={<Login />} />

        {/* Onboarding + main network */}
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/network"
          element={
            <OnboardingGate>
              <HomePage />
            </OnboardingGate>
          }
        />

        {/* ✅ Catch-all fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
