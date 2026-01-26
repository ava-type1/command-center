import { useState, useEffect } from 'react';
import { ProjectCard } from './components/ProjectCard';
import { ProjectDetail } from './components/ProjectDetail';
import { IdeasHub } from './components/IdeasHub';
import { Header } from './components/Header';
import type { Project } from './types';

// Initial projects data - will be loaded from JSON files in production
const initialProjects: Project[] = [
  {
    id: 'fieldsync',
    name: 'FieldSync',
    description: 'Property lifecycle management for manufactured housing - walkthroughs, materials tracking, field service coordination',
    status: 'active',
    color: '#00ff88',
    lastUpdated: new Date().toISOString(),
    lastWorkedOn: 'Scanner OCR improvements, calendar scheduling, organization fixes',
    todos: [
      { id: '1', text: 'Test sign-out flow after latest fix', done: false },
      { id: '2', text: 'Test onboarding creates organization_members', done: false },
      { id: '3', text: 'Delete test properties and add real data', done: false },
      { id: '4', text: 'Continue refining scanner for edge cases', done: false },
    ],
    changelog: [
      { date: '2026-01-26', summary: 'Fixed scanner parsing for Nobility Homes forms - names, addresses, all 3 phone numbers. Added calendar view with job scheduling. Fixed sign-out bug and organization creation flow. Added delete property feature.' },
    ],
    repoUrl: 'https://github.com/ava-type1/fieldsyncv2',
    liveUrl: 'https://fieldsyncv2.pages.dev',
  },
  {
    id: 'ava-type1',
    name: 'AVA Type 1',
    description: 'iOS simulation game teaching T1D management - gamified diabetes education for kids',
    status: 'active',
    color: '#00d4ff',
    lastUpdated: '2026-01-20T00:00:00Z',
    lastWorkedOn: 'Physiological modeling, achievement systems',
    todos: [
      { id: '1', text: 'Complete sticker collection system', done: false },
      { id: '2', text: 'Finalize 60x accelerated mode', done: false },
      { id: '3', text: 'Beta testing with families', done: false },
    ],
    changelog: [
      { date: '2026-01-20', summary: 'Approximately 80% complete. Core simulation working.' },
    ],
    repoUrl: 'https://github.com/ava-type1/ava-type1',
  },
  {
    id: 'ava-companion',
    name: 'AVA Companion',
    description: 'Physical plush toy with ESP32-C6 display showing simulated glucose - pairs with AVA Type 1 app',
    status: 'paused',
    color: '#bf00ff',
    lastUpdated: '2026-01-15T00:00:00Z',
    lastWorkedOn: 'ESP32-C6 BLE communication, enclosure design',
    todos: [
      { id: '1', text: 'Finalize 3D printed enclosure', done: false },
      { id: '2', text: 'Test battery life with ONN 5000mAh pack', done: false },
      { id: '3', text: 'BLE pairing reliability', done: false },
    ],
    changelog: [],
  },
  {
    id: 'ava-drive',
    name: 'AvaDrive',
    description: 'Driving safety product - real-time CGM data on external display for diabetics',
    status: 'idea',
    color: '#ff0080',
    lastUpdated: '2026-01-10T00:00:00Z',
    lastWorkedOn: 'Concept and initial architecture',
    todos: [
      { id: '1', text: 'Research CGM API access (Dexcom, Libre)', done: false },
      { id: '2', text: 'Design dashboard display UI', done: false },
    ],
    changelog: [],
  },
];

function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'dashboard' | 'ideas'>('dashboard');

  // Load projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kam-projects');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved projects');
      }
    }
  }, []);

  // Save projects to localStorage when they change
  useEffect(() => {
    localStorage.setItem('kam-projects', JSON.stringify(projects));
  }, [projects]);

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

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

            {/* Projects grid */}
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Projects</h2>
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
          <IdeasHub />
        )}
      </main>
    </div>
  );
}

export default App;
