import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AboutPage } from './pages/AboutPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LearningPage } from './pages/LearningPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PipelinePage } from './pages/PipelinePage';
import { ReviewPage } from './pages/ReviewPage';
import { RolesPage } from './pages/RolesPage';

// Sourcing (and the on-device model it can load) is split out so other pages stay light.
const SourcingPage = lazy(() => import('./pages/SourcingPage').then((m) => ({ default: m.SourcingPage })));

export default function App() {
  return (
    <Routes>
      {/* Standalone, full-screen CEO review — no sidebar. */}
      <Route path="review" element={<ReviewPage />} />
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/roles" replace />} />
        <Route path="roles" element={<RolesPage />} />
        <Route
          path="sourcing"
          element={
            <Suspense fallback={<p className="text-sm text-ink-400">Loading…</p>}>
              <SourcingPage />
            </Suspense>
          }
        />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="pipeline" element={<PipelinePage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
