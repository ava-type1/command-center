import { useState, useEffect } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeasHub } from './components/IdeasHub';
import { Header } from './components/Header';
import { AIChatPanel, AIChatButton } from './components/AIChatPanel';
import { Loader2 } from 'lucide-react';
import type { Project, Idea } from './types';

// GitHub raw content URLs
const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const PROJECTS_URL = `${GITHUB_BASE}/projects.json`;
const IDEAS_URL = `${GITHUB_BASE}/ideas.json`;

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'dashboard' | 'ideas'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  // Load data from GitHub
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try GitHub first
      const [projectsRes, ideasRes] = await Promise.all([
        fetch(PROJECTS_URL + '?t=' + Date.now()), // Cache bust
        fetch(IDEAS_URL + '?t=' + Date.now()),
      ]);

      if (projectsRes.ok && ideasRes.ok) {
        const projectsData = await projectsRes.json();
        const ideasData = await ideasRes.json();
        
        setProjects(projectsData.projects || []);
        setIdeas(ideasData.ideas || []);
        setLastSync(new Date());
        
        // Cache locally
        localStorage.setItem('kam-projects', JSON.stringify(projectsData.projects));
        localStorage.setItem('kam-ideas', JSON.stringify(ideasData.ideas));
        localStorage.setItem('kam-last-sync', new Date().toISOString());
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    } catch (err) {
      console.warn('GitHub fetch failed, using local cache:', err);
      
      // Fallback to localStorage
      const cachedProjects = localStorage.getItem('kam-projects');
      const cachedIdeas = localStorage.getItem('kam-ideas');
      const cachedSync = localStorage.getItem('kam-last-sync');
      
      if (cachedProjects) {
        setProjects(JSON.parse(cachedProjects));
      }
      if (cachedIdeas) {
        setIdeas(JSON.parse(cachedIdeas));
      }
      if (cachedSync) {
        setLastSync(new Date(cachedSync));
      }
      
      if (!cachedProjects && !cachedIdeas) {
        setError('Unable to load data. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Local updates (for todo toggling, etc.) - saves to localStorage only
  // GitHub updates come from me after our conversations
  const updateProject = (updatedProject: Project) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === updatedProject.id ? updatedProject : p);
      localStorage.setItem('kam-projects', JSON.stringify(updated));
      return updated;
    });
    setSelectedProject(updatedProject);
  };

  const updateIdeas = (newIdeas: Idea[]) => {
    setIdeas(newIdeas);
    localStorage.setItem('kam-ideas', JSON.stringify(newIdeas));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon-green mx-auto mb-4" />
          <p className="text-gray-400">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
        onUpdate={updateProject}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <Header view={view} onViewChange={setView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
            <button onClick={loadData} className="ml-4 underline hover:text-red-300">
              Retry
            </button>
          </div>
        )}

        {view === 'dashboard' ? (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-neon-green">{projects.filter(p => p.status === 'active').length}</div>
                <div className="text-sm text-gray-400 mt-1">Active</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">{projects.filter(p => p.status === 'paused').length}</div>
                <div className="text-sm text-gray-400 mt-1">Paused</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-neon-cyan">{projects.filter(p => p.status === 'completed').length}</div>
                <div className="text-sm text-gray-400 mt-1">Completed</div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-neon-purple">{projects.filter(p => p.status === 'idea').length}</div>
                <div className="text-sm text-gray-400 mt-1">Ideas</div>
              </div>
            </div>

            {/* Sync status */}
            {lastSync && (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-200">Projects</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  Synced {lastSync.toLocaleTimeString()}
                  <button 
                    onClick={loadData}
                    className="ml-2 px-2 py-1 rounded bg-dark-600 hover:bg-dark-500 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            {/* Projects grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          </>
        ) : (
          <IdeasHub ideas={ideas} onUpdate={updateIdeas} />
        )}
      </main>

      {/* AI Chat */}
      <AIChatButton onClick={() => setChatOpen(true)} />
      <AIChatPanel 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        onRefresh={loadData}
      />
    </div>
  );
}

export default App;
