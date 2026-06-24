import React, { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [candidateData, setCandidateData] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setError('');
    setCandidateData(null);
    setCurrentStep('Lecture et extraction du fichier PDF...');

    try {
      const response = await axios.post('http://127.0.0.1:8000/upload-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === 'success') {
        setCurrentStep('Analyse sémantique par l’IA Gemini...');
        setTimeout(() => {
          setCandidateData(response.data.data);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l’analyse.');
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Traitement des Documents</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer relative bg-slate-900/40 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              <p className="text-sm font-medium text-slate-300">
                {file ? file.name : "Glissez ou cliquez pour charger le CV"}
              </p>
              <p className="text-xs text-slate-500">Format PDF uniquement</p>
            </div>
          </div>

          {error && <div className="text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-3 rounded-lg">{error}</div>}

          {loading && (
            <div className="bg-slate-900/60 border border-slate-700 p-3 rounded-lg text-center space-y-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-indigo-400 font-medium animate-pulse">{currentStep}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className={`w-full py-2.5 px-4 rounded-xl shadow-lg font-medium text-sm text-white transition-all ${
              loading || !file ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
            }`}
          >
            {loading ? 'Analyse en cours...' : 'Lancer l’analyse'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-2">
        {candidateData ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-4">
              <h3 className="font-semibold text-white tracking-wide">Fiche Candidat Indexée</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-700/30 p-4 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Identité & Contact</span>
                  <span className="text-sm font-semibold text-slate-200 block mt-2 truncate">{candidateData.filename.replace('.pdf', '')}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">{candidateData.detected_email}</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-700/30 p-4 rounded-xl">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score d'Adéquation</span>
                  <span className="text-3xl font-black text-indigo-400 block mt-1">{candidateData.ai_score} / 100</span>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compétences Clés Identifiées</h4>
                <div className="flex flex-wrap gap-2">
                  {candidateData.extracted_skills.split(',').map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/60 border border-slate-700/60 text-indigo-300">
                      ⚡ {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-800/10">
            <div className="text-4xl mb-3 opacity-40">📊</div>
            <h4 className="text-sm font-medium text-slate-400">Aucune donnée à afficher</h4>
            <p className="text-xs text-slate-600 mt-1">Veuillez soumettre un curriculum vitae pour démarrer le monitoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
