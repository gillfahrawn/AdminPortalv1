import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import WizardManager from './components/WizardManager';
import Onboarding from './pages/Onboarding';
import Success from './pages/Success';
import Admin from './pages/Admin';
import Data from './pages/Data';
import AuditIncidentsPage from './pages/AuditIncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <WizardManager>
          <Routes>
            <Route path="/" element={<Onboarding />} />
            <Route path="/success" element={<Success />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/data" element={<Data />} />
            <Route path="/audit/:userId" element={<AuditIncidentsPage />} />
            <Route path="/audit/:userId/incident/:incidentId" element={<IncidentDetailPage />} />
          </Routes>
        </WizardManager>
      </Router>
    </AuthProvider>
  );
}

export default App;
