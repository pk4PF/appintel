'use client';

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number | null;
}

interface TrendChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
}

export default function TrendChart({
  data,
  title,
  color = '#007AFF',
  height = 120,
  showLabels = true,
  formatValue = (v) => v.toFixed(1),
}: TrendChartProps) {
  const chartData = useMemo(() => {
    // Filter out null values and get last 30 data points
    const validData = data
      .filter((d): d is { date: string; value: number } => d.value !== null)
      .slice(-30);
    
    if (validData.length < 2) return null;
    
    const values = validData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    
    const padding = 20;
    const chartWidth = 300;
    const chartHeight = height - 40;
    
    const points = validData.map((d, i) => ({
      x: padding + (i / (validData.length - 1)) * (chartWidth - padding * 2),
      y: padding + (1 - (d.value - min) / range) * (chartHeight - padding),
      value: d.value,
      date: d.date,
    }));
    
    // Create SVG path
    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    
    // Create gradient area path
    const areaD = pathD + 
      ` L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
    
    return {
      points,
      pathD,
      areaD,
      min,
      max,
      latest: validData[validData.length - 1],
      first: validData[0],
    };
  }, [data, height]);
  
  if (!chartData) {
    return (
      <div className="bg-[#1d1d1f] rounded-xl p-4">
        <h3 className="text-sm font-medium text-[#86868b] mb-2">{title}</h3>
        <div 
          className="flex items-center justify-center text-[#6e6e73]"
          style={{ height: height - 40 }}
        >
          Not enough data
        </div>
      </div>
    );
  }
  
  const change = chartData.latest.value - chartData.first.value;
  const percentChange = (change / chartData.first.value) * 100;
  const isUp = change >= 0;
  
  return (
    <div className="bg-[#1d1d1f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-[#86868b]">{title}</h3>
        <div className={`flex items-center gap-1 text-sm ${isUp ? 'text-[#34c759]' : 'text-[#ff453a]'}`}>
          <span>{isUp ? '↑' : '↓'}</span>
          <span>{Math.abs(percentChange).toFixed(1)}%</span>
        </div>
      </div>
      
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-semibold text-white">
            {formatValue(chartData.latest.value)}
          </span>
          <span className="text-xs text-[#6e6e73]">
            vs {formatValue(chartData.first.value)}
          </span>
        </div>
      )}
      
      <svg 
        width="100%" 
        height={height - 40}
        viewBox={`0 0 300 ${height - 40}`}
        preserveAspectRatio="none"
        className="mt-2"
      >
        <defs>
          <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isUp ? '#34c759' : '#ff453a'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? '#34c759' : '#ff453a'} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line 
          x1="20" y1={height - 60} 
          x2="280" y2={height - 60} 
          stroke="#3d3d3d" 
          strokeDasharray="4 4" 
        />
        <line 
          x1="20" y1={20} 
          x2="280" y2={20} 
          stroke="#3d3d3d" 
          strokeDasharray="4 4" 
        />
        
        {/* Area fill */}
        <path 
          d={chartData.areaD} 
          fill={`url(#gradient-${title})`}
        />
        
        {/* Line */}
        <path 
          d={chartData.pathD} 
          fill="none" 
          stroke={isUp ? '#34c759' : '#ff453a'} 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* End dot */}
        <circle 
          cx={chartData.points[chartData.points.length - 1].x}
          cy={chartData.points[chartData.points.length - 1].y}
          r="4"
          fill={isUp ? '#34c759' : '#ff453a'}
        />
      </svg>
      
      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-[#6e6e73] mt-1">
        <span>Min: {formatValue(chartData.min)}</span>
        <span>Max: {formatValue(chartData.max)}</span>
      </div>
    </div>
  );
}






