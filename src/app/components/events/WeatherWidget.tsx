import { motion } from "motion/react";
import { Sun, CloudRain, Wind, Thermometer, ShieldCheck, AlertCircle } from "lucide-react";

interface WeatherWidgetProps {
  venue: string;
  date: string;
}

export function WeatherWidget({ venue, date }: WeatherWidgetProps) {
  // Deterministic mock weather data based on venue name for realistic display
  const getWeatherData = (locationName: string) => {
    const isWater = locationName.toLowerCase().includes("water") || locationName.toLowerCase().includes("fall");
    const isHilly = locationName.toLowerCase().includes("trek") || locationName.toLowerCase().includes("hill") || locationName.toLowerCase().includes("peak");
    
    return {
      temp: isHilly ? "24°C" : isWater ? "27°C" : "28°C",
      condition: isWater ? "Light Showers & Mist" : isHilly ? "Partly Cloudy & Breeze" : "Sunny & Clear",
      rainChance: isWater ? "45%" : "10%",
      windSpeed: "12 km/h",
      humidity: isWater ? "78%" : "55%",
      safetyStatus: "Optimal Conditions",
      safetyAlert: isWater
        ? "🟢 Trail Open: Wear anti-slip grip shoes near wet rocks."
        : "🟢 Trail Clear: Great visibility and pleasant weather for trekking.",
    };
  };

  const weather = getWeatherData(venue);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-slate-900 via-[#0F3057] to-slate-950 text-white rounded-2xl p-5 shadow-lg border border-teal-500/20 my-6"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300">
            <Sun className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">Live Destination Weather</h3>
            <p className="text-xs text-gray-300">{venue} forecast</p>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {weather.safetyStatus}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
        <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className="text-xs text-gray-400 block">Temperature</span>
          <span className="font-bold text-base text-white">{weather.temp}</span>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <CloudRain className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <span className="text-xs text-gray-400 block">Rain Chance</span>
          <span className="font-bold text-base text-cyan-200">{weather.rainChance}</span>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <Wind className="w-4 h-4 text-teal-300 mx-auto mb-1" />
          <span className="text-xs text-gray-400 block">Wind Speed</span>
          <span className="font-bold text-base text-white">{weather.windSpeed}</span>
        </div>

        <div className="bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
          <Sun className="w-4 h-4 text-yellow-300 mx-auto mb-1" />
          <span className="text-xs text-gray-400 block">Condition</span>
          <span className="font-semibold text-xs text-white truncate block">{weather.condition}</span>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2 text-xs text-gray-200">
        <AlertCircle className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" />
        <span>{weather.safetyAlert}</span>
      </div>
    </motion.div>
  );
}
