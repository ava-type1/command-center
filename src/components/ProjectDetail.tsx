import { useState } from 'react';
import { ArrowLeft, Github, ExternalLink, Clock, CheckCircle2, Circle, Plus, Trash2, Calendar } from 'lucide-react';
import type { Project, Todo } from '../types';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdate: (project: Project) => void;
}

const statusLabels = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  idea: 'Idea',
};

export function ProjectDetail({ project, onBack, onUpdate }: ProjectDetailProps) {
  const [newTodo, setNewTodo] = useState('');

  const toggleTodo = (todoId: string) => {
    const updatedTodos = project.todos.map(t =>
      t.id === todoId ? { ...t, done: !t.done } : t
    );
    onUpdate({ ...project, todos: updatedTodos, lastUpdated: new Date().toISOString() });
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const todo: Todo = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      done: false,
    };
    onUpdate({
      ...project,
      todos: [...project.todos, todo],
      lastUpdated: new Date().toISOString(),
    });
    setNewTodo('');
  };

  const deleteTodo = (todoId: string) => {
    const updatedTodos = project.todos.filter(t => t.id !== todoId);
    onUpdate({ ...project, todos: updatedTodos, lastUpdated: new Date().toISOString() });
  };

  const completedTodos = project.todos.filter(t => t.done).length;
  const totalTodos = project.todos.length;

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: project.color,
                    boxShadow: `0 0 10px ${project.color}60`,
                  }}
                />
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
                <span className={`status-${project.status} text-xs font-medium px-2 py-1 rounded-full`}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-1">{project.description}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Quick links */}
        {(project.repoUrl || project.liveUrl) && (
          <div className="flex flex-wrap gap-3">
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm text-gray-300 hover:text-white hover:border-white/20 transition-all"
              >
                <Github className="w-4 h-4" />
                Repository
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm hover:border-neon-green/30 transition-all"
                style={{ color: project.color }}
              >
                <ExternalLink className="w-4 h-4" />
                Live Site
              </a>
            )}
          </div>
        )}

        {/* Last worked on */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <h2 className="text-lg font-semibold text-white">Last Session</h2>
          </div>
          <p className="text-gray-300">{project.lastWorkedOn}</p>
          <p className="text-xs text-gray-500 mt-2">
            Updated {new Date(project.lastUpdated).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        </div>

        {/* To-dos */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-neon-green" />
              <h2 className="text-lg font-semibold text-white">To-Do</h2>
            </div>
            <span className="text-sm text-gray-400">
              {completedTodos}/{totalTodos} done
            </span>
          </div>

          {/* Progress bar */}
          {totalTodos > 0 && (
            <div className="h-2 bg-dark-600 rounded-full overflow-hidden mb-6">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedTodos / totalTodos) * 100}%`,
                  background: `linear-gradient(90deg, ${project.color}, ${project.color}80)`,
                  boxShadow: `0 0 10px ${project.color}40`,
                }}
              />
            </div>
          )}

          {/* Todo list */}
          <ul className="space-y-2 mb-4">
            {project.todos.map(todo => (
              <li
                key={todo.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 group transition-colors"
              >
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex-shrink-0"
                >
                  {todo.done ? (
                    <CheckCircle2 className="w-5 h-5 text-neon-green" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 hover:text-neon-green transition-colors" />
                  )}
                </button>
                <span className={`flex-1 ${todo.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                  {todo.text}
                </span>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Add todo */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a task..."
              className="flex-1 px-4 py-2 bg-dark-600/50 border border-white/5 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/30 transition-colors"
            />
            <button
              onClick={addTodo}
              disabled={!newTodo.trim()}
              className="px-4 py-2 bg-neon-green/10 text-neon-green rounded-lg hover:bg-neon-green/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Changelog */}
        {project.changelog.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-neon-purple" />
              <h2 className="text-lg font-semibold text-white">Changelog</h2>
            </div>
            <ul className="space-y-4">
              {project.changelog.map((entry, i) => (
                <li key={i} className="relative pl-6 border-l border-white/10">
                  <div className="absolute left-0 top-1.5 w-2 h-2 -translate-x-1/2 rounded-full bg-neon-purple" />
                  <p className="text-xs text-gray-500 mb-1">
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-300">{entry.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
