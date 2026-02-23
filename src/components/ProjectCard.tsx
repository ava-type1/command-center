import { Clock, ExternalLink, Github, GripVertical } from 'lucide-react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Done',
  idea: 'Idea',
};

export function ProjectCard({
  project,
  onClick,
  isDragging,
  isDragOver,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
}: ProjectCardProps) {
  const completedTodos = project.todos.filter(t => t.done).length;
  const totalTodos = project.todos.length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`glass rounded-2xl p-4 cursor-pointer transition-all duration-200 group select-none
        ${isDragging ? 'opacity-40 scale-95 ring-2 ring-neon-cyan/40' : 'glass-hover'}
        ${isDragOver ? 'ring-2 ring-neon-cyan/60 bg-white/10 scale-[1.01]' : ''}
      `}
      style={{
        borderColor: isDragOver ? 'rgba(125, 211, 252, 0.45)' : `${project.color}22`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="drag-handle p-1 -ml-1 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
        <h3 className="text-sm font-semibold text-white group-hover:text-neon-cyan transition-colors truncate flex-1">
          {project.name}
        </h3>
        <span className={`status-${project.status} text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-2 pl-7 min-h-8">{project.description}</p>

      <div className="mb-2 pl-7">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-400">{totalTodos > 0 ? `${completedTodos}/${totalTodos} tasks` : 'Progress'}</span>
          <span style={{ color: project.color }} className="font-semibold">
            {project.progress ?? 0}%
          </span>
        </div>
        <div className="h-1.5 bg-dark-600/70 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress ?? 0}%`,
              background: `linear-gradient(90deg, ${project.color}, ${project.color}bb)`,
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pl-7 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1 text-[10px] text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDate(project.lastUpdated)}
        </div>
        <div className="flex items-center gap-1">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-neon-cyan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
