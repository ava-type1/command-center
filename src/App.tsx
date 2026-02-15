import { useState, useEffect } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeasHub } from './components/IdeasHub';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ContentCreator } from './components/ContentCreator';
import { DailyBriefing } from './components/DailyBriefing';
import { ProspectsList } from './components/ProspectsList';
import { Sidebar, type View } from './components/Sidebar';
import { AIChatPanel, AIChatButton } from './components/AIChatPanel';
import { Loader2, Menu, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Project, Idea } from './types';

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const PROJECTS_URL = `${GITHUB_BASE}/projects.json`;
const IDEAS_URL = `${GITHUB_BASE}/ideas.json`;
const DAILY_LOG_URL = `${GITHUB_BASE}/daily-log.json`;

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [dailyLog, setDailyLog] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [projectsRes, ideasRes, dailyLogRes] = await Promise.all([
        fetch(PROJECTS_URL + '?t=' + Date.now()),
        fetch(IDEAS_URL + '?t=' + Date.now()),
        fetch(DAILY_LOG_URL + '?t=' + Date.now()),
      ]);

      if (projectsRes.ok && ideasRes.ok) {
        const projectsData = await projectsRes.json();
        const ideasData = await ideasRes.json();

        setProjects(projectsData.projects || []);
        setIdeas(ideasData.ideas || []);
        setLastSync(new Date());

        localStorage.setItem('kam-projects', JSON.stringify(projectsData.projects));
        localStorage.setItem('kam-ideas', JSON.stringify(ideasData.ideas));
        localStorage.setItem('kam-last-sync', new Date().toISOString());

        if (dailyLogRes.ok) {
          const dailyLogData = await dailyLogRes.json();
          setDailyLog(dailyLogData.days || []);
          localStorage.setItem('kam-daily-log', JSON.stringify(dailyLogData.days));
        }
      } else {
        throw new Error('Failed to fetch from GitHub');
      }
    } catch {
      const cachedProjects = localStorage.getItem('kam-projects');
      const cachedIdeas = localStorage.getItem('kam-ideas');
      const cachedSync = localStorage.getItem('kam-last-sync');
      const cachedDailyLog = localStorage.getItem('kam-daily-log');

      if (cachedProjects) setProjects(JSON.parse(cachedProjects));
      if (cachedIdeas) setIdeas(JSON.parse(cachedIdeas));
      if (cachedSync) setLastSync(new Date(cachedSync));
      if (cachedDailyLog) setDailyLog(JSON.parse(cachedDailyLog));

      if (!cachedProjects && !cachedIdeas) {
        setError('Unable to load data. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
      <>
        <ProjectDetail
          project={selectedProject}
          onBack={() => setSelectedProject(null)}
          onUpdate={updateProject}
        />
        <AIChatButton onClick={() => setChatOpen(true)} />
        <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar
        view={view}
        onViewChange={setView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar - mobile */}
        <header className="glass border-b border-white/5 sticky top-0 z-30 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-white">Command Center</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
              <button onClick={loadData} className="ml-4 underline hover:text-red-300">
                Retry
              </button>
            </div>
          )}

          <ErrorBoundary>
            {view === 'dashboard' && (
              <DashboardView
                projects={projects}
                onSelectProject={setSelectedProject}
                lastSync={lastSync}
                onRefresh={loadData}
              />
            )}
            {view === 'finance' && <FinanceDashboard />}
            {view === 'content' && <ContentCreator />}
            {view === 'ideas' && <IdeasHub ideas={ideas} onUpdate={updateIdeas} />}
            {view === 'prospects' && <ProspectsList />}
            {view === 'briefing' && <DailyBriefing days={dailyLog} />}
          </ErrorBoundary>
        </main>
      </div>

      {/* AI Chat */}
      <AIChatButton onClick={() => setChatOpen(true)} />
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

// Dashboard sub-view
function DashboardView({
  projects,
  onSelectProject,
  lastSync,
  onRefresh,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  lastSync: Date | null;
  onRefresh: () => void;
}) {
  const active = projects.filter(p => p.status === 'active');
  const paused = projects.filter(p => p.status === 'paused');
  const completed = projects.filter(p => p.status === 'completed');
  const ideaProjects = projects.filter(p => p.status === 'idea');

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-neon-green">{active.length}</div>
          <div className="text-sm text-gray-400 mt-1">Active</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{paused.length}</div>
          <div className="text-sm text-gray-400 mt-1">Paused</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-neon-cyan">{completed.length}</div>
          <div className="text-sm text-gray-400 mt-1">Completed</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-neon-purple">{ideaProjects.length}</div>
          <div className="text-sm text-gray-400 mt-1">Ideas</div>
        </div>
      </div>

      {/* Sync status */}
      {lastSync && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Projects</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            Synced {lastSync.toLocaleTimeString()}
            <button
              onClick={onRefresh}
              className="ml-2 p-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onSelectProject(project)}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
