import { useEffect, useMemo, useState } from 'react';
import { IdeasHub } from './components/IdeasHub';
import { NewsFeed } from './components/NewsFeed';
import { FinanceDashboard } from './components/FinanceDashboard';
import { ContentCreator } from './components/ContentCreator';
import { DailyBriefing } from './components/DailyBriefing';
import { ProspectsList } from './components/ProspectsList';
import { KodaVoice } from './components/KodaVoice';
import { NotesTab } from './components/NotesTab';
import { AvaFeedbackTab } from './components/AvaFeedbackTab';
import { AppNavigation, type View } from './components/Sidebar';
import { AIChatPanel, AIChatButton } from './components/AIChatPanel';
import { ArrowRight, CircleDot, Loader2, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProjectDetail } from './components/ProjectDetail';
import type { Idea, Project } from './types';

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

      if (!projectsRes.ok || !ideasRes.ok) throw new Error('Failed to fetch from GitHub');

      const projectsData = await projectsRes.json();
      const ideasData = await ideasRes.json();

      const savedOrder = localStorage.getItem('kam-project-order');
      let orderedProjects = projectsData.projects || [];
      if (savedOrder) {
        try {
          const orderIds: string[] = JSON.parse(savedOrder);
          const projectMap = new Map<string, Project>(orderedProjects.map((p: Project) => [p.id, p]));
          const reordered: Project[] = [];
          for (const id of orderIds) {
            const proj = projectMap.get(id);
            if (proj) {
              reordered.push(proj);
              projectMap.delete(id);
            }
          }
          projectMap.forEach((proj) => reordered.push(proj));
          orderedProjects = reordered;
        } catch {
          // ignore invalid saved order
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

      if (notesRes.ok) {
        const notesData = await notesRes.json();
        setNotes(notesData.notes || []);
      }

      if (dailyLogRes.ok) {
        const dailyLogData = await dailyLogRes.json();
        setDailyLog(dailyLogData.days || []);
        localStorage.setItem('kam-daily-log', JSON.stringify(dailyLogData.days));
      }

      localStorage.setItem('kam-projects', JSON.stringify(orderedProjects));
      localStorage.setItem('kam-ideas', JSON.stringify(ideasData.ideas));
      localStorage.setItem('kam-last-sync', new Date().toISOString());
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
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === updatedProject.id ? updatedProject : p));
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="panel rounded-2xl p-8 text-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-300 mx-auto mb-4" />
          <p className="text-slate-100 font-medium">Loading Command Center...</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <>
        <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} onUpdate={updateProject} />
        <AIChatButton onClick={() => setChatOpen(true)} />
        <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <AppNavigation view={view} onViewChange={setView} />

      <div className="lg:ml-72 pb-20 lg:pb-0">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b1220]/90 backdrop-blur-xl">
          <div className="h-14 px-4 lg:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-sm lg:text-base font-semibold text-white tracking-tight">Command Center</h1>
              <p className="text-[11px] text-slate-400">Operations cockpit</p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-slate-200 hover:bg-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-5">
          {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm p-3">{error}</div>}

          <ErrorBoundary>
            {view === 'dashboard' && (
              <HomeDashboard
                projects={projects}
                ideas={ideas}
                news={news}
                lastSync={lastSync}
                onSelectProject={setSelectedProject}
                onNavigate={setView}
              />
            )}
            {view === 'news' && <NewsFeed news={news} lastUpdated={newsLastUpdated} />}
            {view === 'finance' && <FinanceDashboard />}
            {view === 'content' && <ContentCreator />}
            {view === 'ideas' && <IdeasHub ideas={ideas} onUpdate={updateIdeas} />}
            {view === 'prospects' && <ProspectsList />}
            {view === 'briefing' && <DailyBriefing days={dailyLog} />}
            {view === 'notes' && <NotesTab notes={notes} />}
            {view === 'voice' && <KodaVoice />}
            {view === 'ava-feedback' && <AvaFeedbackTab />}
          </ErrorBoundary>
        </main>
      </div>

      <AIChatButton onClick={() => setChatOpen(true)} />
      <AIChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function HomeDashboard({
  projects,
  ideas,
  news,
  lastSync,
  onSelectProject,
  onNavigate,
}: {
  projects: Project[];
  ideas: Idea[];
  news: any[];
  lastSync: Date | null;
  onSelectProject: (project: Project) => void;
  onNavigate: (view: View) => void;
}) {
  const [activeStatus, setActiveStatus] = useState<Project['status'] | 'all'>('active');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const filteredProjects = useMemo(
    () => (activeStatus === 'all' ? projects : projects.filter((p) => p.status === activeStatus)),
    [projects, activeStatus],
  );

  const focusedProject = useMemo(() => {
    if (focusedProjectId) return projects.find((p) => p.id === focusedProjectId) || filteredProjects[0];
    return filteredProjects[0] || projects[0];
  }, [focusedProjectId, projects, filteredProjects]);

  const activeProjects = projects.filter((p) => p.status === 'active');
  const recentChanges = projects
    .flatMap((p) => p.changelog.slice(0, 2).map((c) => ({ ...c, projectName: p.name })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const quickActions: Array<{ label: string; hint: string; view: View }> = [
    { label: 'Read Daily Briefing', hint: 'Plan your day in one pass', view: 'briefing' },
    { label: 'Capture ideas', hint: `${ideas.length} ideas tracked`, view: 'ideas' },
    { label: 'Review notes', hint: 'Scratchpad + references', view: 'notes' },
    { label: 'Check prospects', hint: 'Leads and opportunities', view: 'prospects' },
    { label: 'Open AVA feedback', hint: 'Model coaching stream', view: 'ava-feedback' },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <section className="panel rounded-2xl p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
            <h2 className="text-xl lg:text-2xl font-semibold text-white mt-1">Execution at a glance</h2>
          </div>
          {lastSync && <span className="text-xs text-slate-400">Synced {lastSync.toLocaleTimeString()}</span>}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <Metric title="Active" value={projects.filter((p) => p.status === 'active').length} />
          <Metric title="Paused" value={projects.filter((p) => p.status === 'paused').length} />
          <Metric title="Completed" value={projects.filter((p) => p.status === 'completed').length} />
          <Metric title="News Items" value={news.length} />
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4 lg:gap-6">
        <div className="panel rounded-2xl p-4 lg:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Focus Projects</h3>
            <div className="flex gap-1 rounded-lg bg-black/20 p-1">
              {(['all', 'active', 'paused', 'completed', 'idea'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`px-2 py-1 rounded-md text-[11px] capitalize ${
                    activeStatus === status ? 'bg-cyan-400/20 text-cyan-200' : 'text-slate-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-[320px_1fr] gap-3">
            <div className="rounded-xl border border-white/10 overflow-hidden">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setFocusedProjectId(project.id)}
                  className={`w-full text-left px-3 py-2.5 border-b border-white/5 last:border-b-0 ${
                    focusedProject?.id === project.id ? 'bg-cyan-400/10' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white font-medium truncate pr-2">{project.name}</p>
                    <span className="text-[10px] text-slate-400 capitalize">{project.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{project.progress}% complete</p>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 min-h-[260px]">
              {focusedProject ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Project Detail</p>
                  <h4 className="text-lg font-semibold text-white mt-1">{focusedProject.name}</h4>
                  <p className="text-sm text-slate-300 mt-2">{focusedProject.description}</p>
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-black/35 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${focusedProject.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Last updated {focusedProject.lastUpdated}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(focusedProject.changelog || []).slice(0, 3).map((entry, idx) => (
                      <div key={`${entry.date}-${idx}`} className="text-sm text-slate-300 flex gap-2">
                        <CircleDot className="w-3.5 h-3.5 mt-1 text-cyan-300 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400">{entry.date}</p>
                          <p>{entry.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => onSelectProject(focusedProject)}
                    className="mt-5 inline-flex items-center gap-1.5 text-sm rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-cyan-100"
                  >
                    Open full project <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-400">No projects match this filter.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <section className="panel rounded-2xl p-4">
            <h3 className="text-base font-semibold text-white">Recent Changes</h3>
            <div className="mt-3 space-y-2">
              {recentChanges.map((change, i) => (
                <div key={`${change.projectName}-${i}`} className="rounded-lg border border-white/10 p-2.5 bg-white/[0.02]">
                  <p className="text-[11px] text-slate-400">{change.projectName} • {change.date}</p>
                  <p className="text-sm text-slate-200 mt-0.5">{change.summary}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-4">
            <h3 className="text-base font-semibold text-white">Quick Actions</h3>
            <div className="mt-3 space-y-2">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.view)}
                  className="w-full text-left rounded-lg border border-white/10 hover:border-cyan-300/40 hover:bg-cyan-400/5 p-2.5"
                >
                  <p className="text-sm text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.hint}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel rounded-2xl p-4">
            <h3 className="text-base font-semibold text-white">Top Focus</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
              {activeProjects.slice(0, 4).map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span className="truncate pr-2">{p.name}</span>
                  <span className="text-xs text-slate-400">{p.progress}%</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{title}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

export default App;
