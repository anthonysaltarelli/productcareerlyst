"use client";

import { useMemo } from "react";

interface SalaryDataPoint {
  year: number;
  salary: number;
  isPromotion: boolean;
}

const calculateSalaryProgression = (
  startSalary: number,
  annualRaisePercent: number,
  promotionInterval: number,
  promotionRaisePercent: number,
  years: number
): SalaryDataPoint[] => {
  const data: SalaryDataPoint[] = [];
  let currentSalary = startSalary;
  
  for (let year = 0; year <= years; year++) {
    if (year === 0) {
      data.push({ year, salary: currentSalary, isPromotion: false });
      continue;
    }
    
    // Check if this is a promotion year
    const isPromotionYear = year % promotionInterval === 0;
    
    if (isPromotionYear) {
      // Promotion: apply promotion raise
      currentSalary = currentSalary * (1 + promotionRaisePercent / 100);
      data.push({ year, salary: currentSalary, isPromotion: true });
    } else {
      // Regular year: apply annual raise
      currentSalary = currentSalary * (1 + annualRaisePercent / 100);
      data.push({ year, salary: currentSalary, isPromotion: false });
    }
  }
  
  return data;
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${Math.round(amount / 1000)}K`;
};

interface SalaryProgressionChartProps {
  className?: string;
}

const SalaryProgressionChart = ({ className = "" }: SalaryProgressionChartProps) => {
  // Average PM: 3% annual raise, promotion every 4 years with 20% raise
  const averagePMData = useMemo(
    () => calculateSalaryProgression(120000, 3, 4, 20, 15),
    []
  );
  
  // High-performing PM: 10% annual raise, promotion every 2 years with 20% raise
  const highPerformerData = useMemo(
    () => calculateSalaryProgression(120000, 10, 2, 20, 15),
    []
  );
  
  const maxSalary = Math.max(
    ...averagePMData.map(d => d.salary),
    ...highPerformerData.map(d => d.salary)
  );
  const minSalary = 100000;
  const salaryRange = maxSalary - minSalary;
  
  const chartWidth = 800;
  const chartHeight = 400;
  const padding = { top: 40, right: 60, bottom: 60, left: 80 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  
  const scaleX = (year: number) => {
    return (year / 15) * plotWidth;
  };
  
  const scaleY = (salary: number) => {
    return plotHeight - ((salary - minSalary) / salaryRange) * plotHeight;
  };
  
  // Create path strings for the lines
  const averagePMPath = averagePMData
    .map((point, index) => {
      const x = scaleX(point.year) + padding.left;
      const y = scaleY(point.salary) + padding.top;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  
  const highPerformerPath = highPerformerData
    .map((point, index) => {
      const x = scaleX(point.year) + padding.left;
      const y = scaleY(point.salary) + padding.top;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  
  // Calculate lifetime earnings
  const averageLifetimeEarnings = averagePMData.reduce(
    (sum, point) => sum + point.salary,
    0
  );
  const highPerformerLifetimeEarnings = highPerformerData.reduce(
    (sum, point) => sum + point.salary,
    0
  );
  const difference = highPerformerLifetimeEarnings - averageLifetimeEarnings;
  
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-4 md:p-8 border-2 border-slate-300 shadow-lg">
        <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-6 text-center">
          Lifetime Salary Comparison: Average PM vs High-Performing PM
        </h3>
        
        <div className="flex justify-center mb-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm font-bold text-gray-700">Average PM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm font-bold text-gray-700">
                High-Performing PM (with Product Careerlyst)
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center overflow-x-auto">
          <svg
            width={chartWidth}
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="min-w-[800px]"
          >
            {/* Grid lines */}
            {[0, 3, 6, 9, 12, 15].map(year => {
              const x = scaleX(year) + padding.left;
              return (
                <g key={`grid-${year}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={chartHeight - padding.bottom}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={x}
                    y={chartHeight - padding.bottom + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 font-medium"
                  >
                    Year {year}
                  </text>
                </g>
              );
            })}
            
            {[100, 150, 200, 250, 300, 350, 400].map(salary => {
              const y = scaleY(salary * 1000) + padding.top;
              return (
                <g key={`grid-y-${salary}`}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-600 font-medium"
                  >
                    ${salary}K
                  </text>
                </g>
              );
            })}
            
            {/* Average PM line */}
            <path
              d={averagePMPath}
              fill="none"
              stroke="#ef4444"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* High-performing PM line */}
            <path
              d={highPerformerPath}
              fill="none"
              stroke="#22c55e"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Promotion markers for average PM */}
            {averagePMData
              .filter(point => point.isPromotion && point.year > 0)
              .map(point => {
                const x = scaleX(point.year) + padding.left;
                const y = scaleY(point.salary) + padding.top;
                return (
                  <circle
                    key={`avg-promo-${point.year}`}
                    cx={x}
                    cy={y}
                    r={6}
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              })}
            
            {/* Promotion markers for high-performing PM */}
            {highPerformerData
              .filter(point => point.isPromotion && point.year > 0)
              .map(point => {
                const x = scaleX(point.year) + padding.left;
                const y = scaleY(point.salary) + padding.top;
                return (
                  <circle
                    key={`high-promo-${point.year}`}
                    cx={x}
                    cy={y}
                    r={6}
                    fill="#22c55e"
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              })}
            
            {/* Y-axis label */}
            <text
              x={-chartHeight / 2}
              y={20}
              transform={`rotate(-90, 20, ${chartHeight / 2})`}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-bold"
            >
              Annual Salary
            </text>
            
            {/* X-axis label */}
            <text
              x={chartWidth / 2}
              y={chartHeight - 10}
              textAnchor="middle"
              className="text-sm fill-gray-700 font-bold"
            >
              Years in Career
            </text>
          </svg>
        </div>
        
        {/* Summary stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="p-4 md:p-6 rounded-[1.5rem] bg-red-50 border-2 border-red-200">
            <p className="text-sm font-bold text-gray-600 mb-2">Average PM (15 years)</p>
            <p className="text-2xl md:text-3xl font-black text-red-600 mb-1">
              {formatCurrency(averageLifetimeEarnings)}
            </p>
            <p className="text-xs text-gray-600">Total lifetime earnings</p>
          </div>
          
          <div className="p-4 md:p-6 rounded-[1.5rem] bg-green-50 border-2 border-green-200">
            <p className="text-sm font-bold text-gray-600 mb-2">
              High-Performing PM (15 years)
            </p>
            <p className="text-2xl md:text-3xl font-black text-green-600 mb-1">
              {formatCurrency(highPerformerLifetimeEarnings)}
            </p>
            <p className="text-xs text-gray-600">Total lifetime earnings</p>
          </div>
          
          <div className="p-4 md:p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
            <p className="text-sm font-bold text-gray-600 mb-2">The Difference</p>
            <p className="text-2xl md:text-3xl font-black text-purple-600 mb-1">
              {formatCurrency(difference)}
            </p>
            <p className="text-xs text-gray-600">
              Extra earnings with Product Careerlyst
            </p>
          </div>
        </div>
        
        <div className="mt-6 p-4 rounded-[1rem] bg-blue-50 border-2 border-blue-200">
          <p className="text-sm text-gray-700 font-medium text-center">
            <span className="font-black">High-performing PMs</span> get 10% annual raises
            and promotions every 2 years (vs 3% raises and promotions every 4 years for
            average PMs). This is the difference Product Careerlyst makes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalaryProgressionChart;

