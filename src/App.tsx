import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AboutPage } from './pages/AboutPage';
import { CandidatesPage } from './pages/CandidatesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { LearningPage } from './pages/LearningPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PipelinePage } from './pages/PipelinePage';
import { RolesPage } from './pages/RolesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/roles" replace />} />
        <Route path="roles" element={<RolesPage />} />
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
