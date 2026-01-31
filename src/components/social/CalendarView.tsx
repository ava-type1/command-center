import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useState } from 'react';
import type { SocialPost } from '../../types';

interface CalendarViewProps {
  posts: SocialPost[];
}

interface CalendarDay {
  date: Date;
  posts: SocialPost[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function CalendarView({ posts }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'x': return '𝕏';
      case 'tiktok': return '🎵';
      case 'facebook': return '📘';
      default: return '📱';
    }
  };

  const getStatusColor = (status: SocialPost['status']) => {
    switch (status) {
      case 'draft': return 'bg-yellow-400';
      case 'approved': return 'bg-neon-cyan';
      case 'posted': return 'bg-neon-green';
      case 'rejected': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Generate calendar days for the current month view
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first Sunday before or on the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End on the last Saturday after or on the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.suggested_date);
        return (
          postDate.getFullYear() === current.getFullYear() &&
          postDate.getMonth() === current.getMonth() &&
          postDate.getDate() === current.getDate()
        );
      });
      
      days.push({
        date: new Date(current),
        posts: dayPosts,
        isCurrentMonth: current.getMonth() === month,
        isToday: (
          current.getFullYear() === today.getFullYear() &&
          current.getMonth() === today.getMonth() &&
          current.getDate() === today.getDate()
        )
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = generateCalendarDays();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-neon-green" />
          Calendar View
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={goToToday}
            className="px-3 py-1 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-dark-600 transition-colors text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-semibold text-white">{monthName}</h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-dark-600 transition-colors text-gray-400 hover:text-white"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="glass rounded-xl p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-2 rounded-lg border transition-colors ${
                day.isCurrentMonth 
                  ? 'border-gray-700 hover:border-gray-600' 
                  : 'border-gray-800'
              } ${
                day.isToday 
                  ? 'bg-neon-green/10 border-neon-green/30' 
                  : 'bg-dark-700/30 hover:bg-dark-600/50'
              }`}
            >
              {/* Day number */}
              <div className={`text-sm font-medium mb-1 ${
                day.isCurrentMonth 
                  ? day.isToday 
                    ? 'text-neon-green' 
                    : 'text-white'
                  : 'text-gray-600'
              }`}>
                {day.date.getDate()}
              </div>

              {/* Posts for this day */}
              <div className="space-y-1">
                {day.posts.slice(0, 3).map(post => (
                  <div
                    key={post.id}
                    className={`text-xs rounded px-2 py-1 truncate cursor-pointer hover:opacity-80 transition-opacity ${
                      getStatusColor(post.status)
                    } text-black font-medium`}
                    title={`${post.platform.toUpperCase()}: ${post.content.slice(0, 100)}...`}
                  >
                    <span className="mr-1">{getPlatformIcon(post.platform)}</span>
                    {formatTime(post.suggested_date)}
                  </div>
                ))}
                
                {day.posts.length > 3 && (
                  <div className="text-xs text-gray-400 px-2">
                    +{day.posts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-400"></div>
          <span className="text-gray-400">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neon-cyan"></div>
          <span className="text-gray-400">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neon-green"></div>
          <span className="text-gray-400">Posted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-400"></div>
          <span className="text-gray-400">Rejected</span>
        </div>
      </div>

      {/* Upcoming posts summary */}
      <div className="glass rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Next 7 Days
        </h4>
        
        {(() => {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const upcomingPosts = posts
            .filter(post => {
              const postDate = new Date(post.suggested_date);
              return postDate >= new Date() && postDate <= nextWeek && 
                     (post.status === 'draft' || post.status === 'approved');
            })
            .sort((a, b) => new Date(a.suggested_date).getTime() - new Date(b.suggested_date).getTime());

          if (upcomingPosts.length === 0) {
            return (
              <div className="text-sm text-gray-500 italic">
                No posts scheduled for the next week
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {upcomingPosts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getPlatformIcon(post.platform)}</span>
                    <span className="text-gray-300 truncate max-w-xs">
                      {post.content.slice(0, 50)}...
                    </span>
                  </div>
                  <div className="text-gray-400">
                    {formatTime(post.suggested_date)}
                  </div>
                </div>
              ))}
              {upcomingPosts.length > 5 && (
                <div className="text-xs text-gray-400 italic">
                  +{upcomingPosts.length - 5} more posts scheduled
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}