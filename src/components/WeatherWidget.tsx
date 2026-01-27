import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, Wind, Droplets, RefreshCw, MapPin, CloudSun, CloudFog } from 'lucide-react';

interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  wind: number;
  condition: string;
  conditionCode: number;
  location: string;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    conditionCode: number;
  }>;
}

// WMO Weather interpretation codes
const getWeatherInfo = (code: number): { icon: React.ReactNode; label: string } => {
  // Clear
  if (code === 0) return { icon: <Sun className="w-8 h-8 text-yellow-400" />, label: 'Clear' };
  // Mainly clear, partly cloudy
  if (code === 1 || code === 2) return { icon: <CloudSun className="w-8 h-8 text-yellow-300" />, label: 'Partly Cloudy' };
  // Overcast
  if (code === 3) return { icon: <Cloud className="w-8 h-8 text-gray-400" />, label: 'Cloudy' };
  // Fog
  if (code === 45 || code === 48) return { icon: <CloudFog className="w-8 h-8 text-gray-400" />, label: 'Foggy' };
  // Drizzle
  if (code >= 51 && code <= 57) return { icon: <CloudRain className="w-8 h-8 text-blue-300" />, label: 'Drizzle' };
  // Rain
  if (code >= 61 && code <= 67) return { icon: <CloudRain className="w-8 h-8 text-blue-400" />, label: 'Rain' };
  // Snow
  if (code >= 71 && code <= 77) return { icon: <Snowflake className="w-8 h-8 text-blue-200" />, label: 'Snow' };
  // Rain showers
  if (code >= 80 && code <= 82) return { icon: <CloudRain className="w-8 h-8 text-blue-400" />, label: 'Showers' };
  // Snow showers
  if (code >= 85 && code <= 86) return { icon: <Snowflake className="w-8 h-8 text-blue-200" />, label: 'Snow Showers' };
  // Thunderstorm
  if (code >= 95 && code <= 99) return { icon: <CloudRain className="w-8 h-8 text-purple-400" />, label: 'Thunderstorm' };
  
  return { icon: <Cloud className="w-8 h-8 text-gray-400" />, label: 'Unknown' };
};

const getSmallIcon = (code: number) => {
  if (code === 0) return <Sun className="w-4 h-4 text-yellow-400" />;
  if (code === 1 || code === 2) return <CloudSun className="w-4 h-4 text-yellow-300" />;
  if (code === 3) return <Cloud className="w-4 h-4 text-gray-400" />;
  if (code === 45 || code === 48) return <CloudFog className="w-4 h-4 text-gray-400" />;
  if (code >= 51 && code <= 67) return <CloudRain className="w-4 h-4 text-blue-400" />;
  if (code >= 71 && code <= 86) return <Snowflake className="w-4 h-4 text-blue-200" />;
  if (code >= 80 && code <= 82) return <CloudRain className="w-4 h-4 text-blue-400" />;
  if (code >= 95) return <CloudRain className="w-4 h-4 text-purple-400" />;
  return <Cloud className="w-4 h-4 text-gray-400" />;
};

// Fort White, FL 32038 coordinates
const LAT = 29.92329;
const LON = -82.71373;
const LOCATION_NAME = 'Fort White, FL';

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Open-Meteo API - free, no key required, CORS-enabled
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=3`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather fetch failed');
      
      const data = await response.json();
      const current = data.current;
      const daily = data.daily;
      
      const weatherInfo = getWeatherInfo(current.weather_code);
      
      setWeather({
        temp: Math.round(current.temperature_2m),
        feels_like: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        wind: Math.round(current.wind_speed_10m),
        condition: weatherInfo.label,
        conditionCode: current.weather_code,
        location: LOCATION_NAME,
        forecast: daily.time.map((date: string, i: number) => ({
          day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          high: Math.round(daily.temperature_2m_max[i]),
          low: Math.round(daily.temperature_2m_min[i]),
          conditionCode: daily.weather_code[i]
        }))
      });
      
      // Cache locally
      localStorage.setItem('kam-weather', JSON.stringify({
        data: weather,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Weather error:', err);
      setError('Unable to load weather');
      
      // Try cache
      const cached = localStorage.getItem('kam-weather');
      if (cached) {
        const { data } = JSON.parse(cached);
        if (data) setWeather(data);
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
  }, []);

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

  const weatherInfo = getWeatherInfo(weather.conditionCode);

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
          {weatherInfo.icon}
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
                {getSmallIcon(day.conditionCode)}
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
