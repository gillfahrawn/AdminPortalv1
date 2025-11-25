import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Onboarding from './pages/Onboarding';
import Success from './pages/Success';
import Admin from './pages/Admin';
import Data from './pages/Data';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/success" element={<Success />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/data" element={<Data />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
