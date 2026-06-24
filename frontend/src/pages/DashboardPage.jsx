import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      // Adiresy ofisialy 127.0.0.1 hitsatohana amin'ny Backend
      const response = await axios.get('http://127.0.0.1:8000/candidates');
      if (response.data.status === 'success') {
        setCandidates(response.data.data || []);
      }
    } catch (err) {
      setError('Impossible de récupérer la liste des candidats.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer ce candidat définitivement ?")) {
      try {
        const response = await axios.delete(`http://127.0.0{id}`);
        if (response.data.status === 'success') {
          // Fafana eo no ho eo ao amin'ny pejy ny andalana voafafa tsy hamerenana refresh
          setCandidates(candidates.filter(c => c.id !== id));
        }
      } catch (err) {
        alert("Erreur lors de la suppression du candidat.");
      }
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white tracking-wide">Base de Données des Candidats</h3>
        <button onClick={fetchCandidates} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-indigo-400 transition-colors">
          🔄 Actualiser la liste
        </button>
      </div>

      {error && <div className="text-sm text-red-400 p-4 bg-red-950/20 border border-red-900 rounded-xl">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm animate-pulse">Chargement de la base de données...</div>
      ) : (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Candidat / Fichier</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Compétences Extrait</th>
                  <th className="py-4 px-6 text-center">Score Global</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40 text-sm text-slate-300">
                {candidates.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500 text-xs">Aucun candidat enregistré pour le moment.</td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">#{c.id}</td>
                      <td className="py-4 px-6 font-semibold text-slate-200">{c.name.replace('.pdf', '')}</td>
                      <td className="py-4 px-6 text-slate-400 truncate max-w-[150px]">{c.email.includes('non-specifie') ? "Non spécifié" : c.email}</td>
                      <td className="py-4 px-6 max-w-xs truncate text-xs text-indigo-300">{c.skills}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                          c.score >= 75 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          c.score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {c.score} / 100
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 rounded-lg text-xs font-medium transition-all"
                        >
                          🗑️ Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
