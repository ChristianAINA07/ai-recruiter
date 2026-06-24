import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        {/* Navbar sticky moderne */}
        <nav className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-50 py-4 px-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-lg shadow-indigo-500/30">
              AI
            </div>
            <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              RECRUITER ASSISTANT
            </span>
          </div>
          
          {/* Liens de navigation */}
          <div className="flex space-x-4">
            <Link to="/" className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
              📥 Analyser un CV
            </Link>
            <Link to="/dashboard" className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/10">
              📊 Liste des Candidats
            </Link>
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
