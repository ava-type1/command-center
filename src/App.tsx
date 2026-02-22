import { useState, useEffect, useRef, useCallback } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeasHub } from './components/IdeasHub';
import { NewsFeed } from './components/NewsFeed';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ContentCreator } from './components/ContentCreator';
import { DailyBriefing } from './components/DailyBriefing';
import { ProspectsList } from './components/ProspectsList';
import { KodaVoice } from './components/KodaVoice';
import { NotesTab } from './components/NotesTab';
import { Sidebar, type View } from './components/Sidebar';
import { AIChatPanel, AIChatButton } from './components/AIChatPanel';
import { Loader2, Menu, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { Project, Idea } from './types';

const GITHUB_BASE = 'https://raw.githubusercontent.com/ava-type1/command-center/main/data';
const PROJECTS_URL = `${GITHUB_BASE}/projects.json`;
const IDEAS_URL = `${GITHUB_BASE}/ideas.json`;
const NEWS_URL = `${GITHUB_BASE}/news.json`;
const DAILY_LOG_URL = `${GITHUB_BASE}/daily-log.json`;
const NOTES_URL = `${GITHUB_BASE}/notes.json`;

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<any[]>([]);
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
      const [projectsRes, ideasRes, newsRes, dailyLogRes, notesRes] = await Promise.all([
        fetch(PROJECTS_URL + '?t=' + Date.now()),
        fetch(IDEAS_URL + '?t=' + Date.now()),
        fetch(NEWS_URL + '?t=' + Date.now()),
        fetch(DAILY_LOG_URL + '?t=' + Date.now()),
        fetch(NOTES_URL + '?t=' + Date.now()),
      ]);

      if (projectsRes.ok && ideasRes.ok) {
        const projectsData = await projectsRes.json();
        const ideasData = await ideasRes.json();

        // Apply saved order if available
        const savedOrder = localStorage.getItem('kam-project-order');
        let orderedProjects = projectsData.projects || [];
        if (savedOrder) {
          try {
            const orderIds: string[] = JSON.parse(savedOrder);
            const projectMap = new Map<string, Project>(orderedProjects.map((p: Project) => [p.id, p]));
            const reordered: Project[] = [];
            // First add projects in saved order
            for (const id of orderIds) {
              const proj = projectMap.get(id);
              if (proj) {
                reordered.push(proj);
                projectMap.delete(id);
              }
            }
            // Then add any new projects not in saved order
            projectMap.forEach((proj) => {
              reordered.push(proj);
            });
            orderedProjects = reordered;
          } catch {
            // Invalid saved order, use default
          }
        }

        setProjects(orderedProjects);
        setIdeas(ideasData.ideas || []);
        setLastSync(new Date());

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          setNews(newsData.items || []);
          setNewsLastUpdated(newsData.lastUpdated);
          localStorage.setItem('kam-news', JSON.stringify(newsData.items));
          localStorage.setItem('kam-news-updated', newsData.lastUpdated || '');
        }

        if (notesRes && notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData.notes || []);
        }

        localStorage.setItem('kam-projects', JSON.stringify(orderedProjects));
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

  const reorderProjects = (reordered: Project[]) => {
    setProjects(reordered);
    localStorage.setItem('kam-projects', JSON.stringify(reordered));
    localStorage.setItem('kam-project-order', JSON.stringify(reordered.map(p => p.id)));
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

        {view === 'voice' ? (
          <ErrorBoundary>
            <KodaVoice />
          </ErrorBoundary>
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  onReorderProjects={reorderProjects}
                  lastSync={lastSync}
                  onRefresh={loadData}
                />
              )}
              {view === 'news' && <NewsFeed news={news} lastUpdated={newsLastUpdated} />}
              {view === 'finance' && <FinanceDashboard />}
              {view === 'content' && <ContentCreator />}
              {view === 'ideas' && <IdeasHub ideas={ideas} onUpdate={updateIdeas} />}
              {view === 'prospects' && <ProspectsList />}
              {view === 'briefing' && <DailyBriefing days={dailyLog} />}
              {view === 'notes' && <NotesTab notes={notes} />}
            </ErrorBoundary>
          </main>
        )}
      </div>

      {/* AI Chat */}
      <AIChatButton onClick={() => setChatOpen(true)} />
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

// Dashboard sub-view with drag-to-reorder grid
function DashboardView({
  projects,
  onSelectProject,
  onReorderProjects,
  lastSync,
  onRefresh,
}: {
  projects: Project[];
  onSelectProject: (p: Project) => void;
  onReorderProjects: (projects: Project[]) => void;
  lastSync: Date | null;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed' | 'idea'>('all');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const active = projects.filter(p => p.status === 'active');
  const paused = projects.filter(p => p.status === 'paused');
  const completed = projects.filter(p => p.status === 'completed');
  const ideaProjects = projects.filter(p => p.status === 'idea');

  const filteredProjects = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Add a slight delay for visual feedback
    requestAnimationFrame(() => {
      (e.target as HTMLElement).style.opacity = '0.4';
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback((_e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndex;
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounter.current = 0;
      return;
    }

    // Only allow reorder when showing all projects (not filtered)
    if (filter !== 'all') {
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounter.current = 0;
      return;
    }

    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(fromIndex, 1);
    newProjects.splice(dropIndex, 0, movedProject);
    onReorderProjects(newProjects);

    setDragIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  }, [dragIndex, projects, onReorderProjects, filter]);

  return (
    <div className="space-y-6">
      {/* Compact stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active', count: active.length, color: 'text-neon-green', filter: 'active' as const },
          { label: 'Paused', count: paused.length, color: 'text-yellow-400', filter: 'paused' as const },
          { label: 'Done', count: completed.length, color: 'text-neon-cyan', filter: 'completed' as const },
          { label: 'Ideas', count: ideaProjects.length, color: 'text-neon-purple', filter: 'idea' as const },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => setFilter(f => f === stat.filter ? 'all' : stat.filter)}
            className={`glass rounded-lg p-3 text-center transition-all hover:bg-white/5 ${
              filter === stat.filter ? 'ring-1 ring-white/20 bg-white/5' : ''
            }`}
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Header with sync + filter info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-200">
            Projects
            {filter !== 'all' && (
              <span className="ml-2 text-xs text-gray-500 font-normal">
                ({filter}) —{' '}
                <button onClick={() => setFilter('all')} className="text-neon-green hover:underline">
                  show all
                </button>
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              {lastSync.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors text-gray-500 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Drag hint */}
      {filter === 'all' && (
        <p className="text-[10px] text-gray-700 -mt-4">
          ✋ Drag cards to reorder • Order is saved locally
        </p>
      )}

      {/* Projects grid — compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onSelectProject(project)}
            isDragging={dragIndex === index}
            isDragOver={dragOverIndex === index && dragIndex !== index}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          No {filter} projects found
        </div>
      )}
    </div>
  );
}

export default App;
