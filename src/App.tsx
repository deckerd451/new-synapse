import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Innovation360Page from '@/pages/Innovation360Page';

/**
 * App configures the client-side routing for the MUSC Innovation 360 application.
 * HashRouter is used to support static hosting (e.g. GitHub Pages) without
 * server-side route handling.
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Main Innovation 360 Interface */}
        <Route path="/" element={<Innovation360Page />} />

        {/* Catch-all for unknown routes — redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
