import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, RefreshCw, MapPin } from 'lucide-react';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  condition: string;
  location: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
}

const getWeatherIcon = (condition: string) => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('shower')) return <CloudRain className="w-8 h-8 text-blue-400" />;
  if (c.includes('snow')) return <Snowflake className="w-8 h-8 text-blue-200" />;
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud className="w-8 h-8 text-gray-400" />;
  if (c.includes('sun') || c.includes('clear')) return <Sun className="w-8 h-8 text-yellow-400" />;
  return <Cloud className="w-8 h-8 text-gray-400" />;
};

const getForecastIcon = (condition: string, size = 'w-5 h-5') => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('shower')) return <CloudRain className={`${size} text-blue-400`} />;
  if (c.includes('snow')) return <Snowflake className={`${size} text-blue-200`} />;
  if (c.includes('cloud') || c.includes('overcast')) return <Cloud className={`${size} text-gray-400`} />;
  if (c.includes('sun') || c.includes('clear')) return <Sun className={`${size} text-yellow-400`} />;
  return <Cloud className={`${size} text-gray-400`} />;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location] = useState('Jacksonville,FL');

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using wttr.in - free, no API key needed
      const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      const current = data.current_condition[0];
      const forecast = data.weather.slice(0, 3);
      
      setWeather({
        temp: parseInt(current.temp_F),
        feels_like: parseInt(current.FeelsLikeF),
        humidity: parseInt(current.humidity),
        wind: parseInt(current.windspeedMiles),
        condition: current.weatherDesc[0].value,
        location: data.nearest_area[0].areaName[0].value + ', ' + data.nearest_area[0].region[0].value,
        forecast: forecast.map((day: any, i: number) => ({
          day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          high: parseInt(day.maxtempF),
          low: parseInt(day.mintempF),
          condition: day.hourly[4].weatherDesc[0].value
        }))
      });
      
      // Cache it
      localStorage.setItem('kam-weather', JSON.stringify({
        data: weather,
        timestamp: Date.now(),
        location
      }));
    } catch (err) {
      console.error('Weather error:', err);
      setError('Unable to load weather');
      
      // Try cache
      const cached = localStorage.getItem('kam-weather');
      if (cached) {
        const { data } = JSON.parse(cached);
        setWeather(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  if (loading && !weather) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-dark-500 rounded w-24 mb-3"></div>
        <div className="h-12 bg-dark-500 rounded w-20 mb-2"></div>
        <div className="h-4 bg-dark-500 rounded w-32"></div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="glass rounded-xl p-4">
        <div className="text-red-400 text-sm">{error}</div>
        <button onClick={fetchWeather} className="text-neon-green text-sm mt-2 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{weather.location}</span>
        </div>
        <button 
          onClick={fetchWeather}
          className="p-1 hover:bg-dark-500 rounded transition-colors"
          title="Refresh weather"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current weather */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getWeatherIcon(weather.condition)}
          <div>
            <div className="text-4xl font-bold text-white">{weather.temp}°</div>
            <div className="text-sm text-gray-400">{weather.condition}</div>
          </div>
        </div>
        <div className="text-right text-sm text-gray-400 space-y-1">
          <div className="flex items-center gap-1 justify-end">
            <span>Feels {weather.feels_like}°</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Droplets className="w-3 h-3" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <Wind className="w-3 h-3" />
            <span>{weather.wind} mph</span>
          </div>
        </div>
      </div>

      {/* 3-day forecast */}
      <div className="border-t border-white/5 pt-3">
        <div className="grid grid-cols-3 gap-2">
          {weather.forecast.map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{day.day}</div>
              <div className="flex justify-center mb-1">
                {getForecastIcon(day.condition, 'w-4 h-4')}
              </div>
              <div className="text-sm">
                <span className="text-white font-medium">{day.high}°</span>
                <span className="text-gray-500 mx-1">/</span>
                <span className="text-gray-400">{day.low}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
