import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainContent from './components/MainContent';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import Profile from './components/Profile';
import PsychologistChat from './components/PsychologistChat';
import DocumentFlow from './components/DocumentFlow';
import Testing from './components/Testing';
import TestBuilder from './components/TestBuilder';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<PsychologistChat />} />
          <Route path="/documents" element={<DocumentFlow />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/test-builder" element={<TestBuilder />} />
          {/* Добавьте остальные маршруты */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
