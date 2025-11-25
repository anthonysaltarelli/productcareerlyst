"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface SalaryDataPoint {
  year: number;
  salary: number;
  level: string;
  isPromotion: boolean;
}

type PMStage = "Aspiring" | "Associate PM" | "Product Manager" | "Senior PM" | "Staff PM" | "Director+";

// Career progression levels with promotion time ranges
// Format: [levelName, upperBoundYears, lowerBoundYears]
// Upper bound = without Careerlyst, Lower bound = with Careerlyst
const CAREER_LEVELS: Array<[string, number, number]> = [
  ["APM", 0, 0], // Starting level, no promotion time
  ["PM", 3, 1], // APM to PM: 3 years without (upper), 1 year with (lower)
  ["Senior PM", 5, 2], // PM to Senior PM: 5 years without, 2 years with
  ["Staff PM", 6, 3], // Senior PM to Staff PM: 6 years without, 3 years with
  ["Principal PM", 7, 4], // Staff PM to Principal PM: 7 years without, 4 years with
];

// Map PM stages to career level indices
const STAGE_TO_LEVEL_INDEX: Record<PMStage, number> = {
  "Aspiring": 0, // APM
  "Associate PM": 0, // APM
  "Product Manager": 1, // PM
  "Senior PM": 2, // Senior PM
  "Staff PM": 3, // Staff PM
  "Director+": 4, // Principal PM (treating Director+ as Principal)
};

const PROMOTION_RAISE_PERCENT = 20; // Always 20% for promotions
const ANNUAL_RAISE_WITHOUT = 3; // 3% annual raise without Careerlyst
const ANNUAL_RAISE_WITH = 8; // 8% annual raise with Careerlyst

const calculateSalaryProgression = (
  startSalary: number,
  startingLevelIndex: number,
  years: number,
  useCareerlyst: boolean
): SalaryDataPoint[] => {
  const data: SalaryDataPoint[] = [];
  let currentSalary = startSalary;
  let currentLevelIndex = startingLevelIndex;
  let yearsAtCurrentLevel = 0;
  let nextPromotionYear = 0;
  
  // Get annual raise based on Careerlyst usage
  const annualRaisePercent = useCareerlyst ? ANNUAL_RAISE_WITH : ANNUAL_RAISE_WITHOUT;
  
  // Calculate when next promotion happens
  const getNextPromotionTime = (levelIndex: number): number => {
    if (levelIndex >= CAREER_LEVELS.length - 1) {
      return Infinity; // No more promotions
    }
    const [_, upperBound, lowerBound] = CAREER_LEVELS[levelIndex + 1];
    
    if (useCareerlyst) {
      // With Careerlyst: use lower bound (accelerated promotions)
      return lowerBound;
    } else {
      // Without Careerlyst: use upper bound
      return upperBound;
    }
  };
  
  nextPromotionYear = getNextPromotionTime(currentLevelIndex);
  
  for (let year = 0; year <= years; year++) {
    if (year === 0) {
      data.push({ 
        year, 
        salary: currentSalary, 
        level: CAREER_LEVELS[currentLevelIndex][0],
        isPromotion: false
      });
      continue;
    }
    
    // Check if promotion happens this year
    // We promote when we've been at the current level long enough
    // Round down to promote at the first integer year that reaches the threshold
    const promotionThreshold = Math.max(1, Math.floor(nextPromotionYear));
    let isPromotion = false;
    if (yearsAtCurrentLevel >= promotionThreshold && currentLevelIndex < CAREER_LEVELS.length - 1) {
      // Promotion! Always 20%
      isPromotion = true;
      currentSalary = currentSalary * (1 + PROMOTION_RAISE_PERCENT / 100);
      currentLevelIndex++;
      yearsAtCurrentLevel = 0;
      nextPromotionYear = getNextPromotionTime(currentLevelIndex);
    } else {
      // Regular year: apply annual raise (3% without, 8% with Careerlyst)
      currentSalary = currentSalary * (1 + annualRaisePercent / 100);
      yearsAtCurrentLevel++;
    }
    
    data.push({ 
      year, 
      salary: currentSalary, 
      level: CAREER_LEVELS[currentLevelIndex][0],
      isPromotion
    });
  }
  
  return data;
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  return `$${Math.round(amount / 1000)}K`;
};

const formatCurrencyFull = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface SalaryProgressionChartProps {
  className?: string;
}

const ANNUAL_MEMBERSHIP_COST = 144; // Accelerate plan yearly price

const SalaryProgressionChart = ({ className = "" }: SalaryProgressionChartProps) => {
  // Simplified inputs
  const [pmStage, setPmStage] = useState<PMStage>("Product Manager");
  const [startSalary, setStartSalary] = useState(120000);
  const [years, setYears] = useState(15);
  
  // Get starting level index from PM stage
  const startingLevelIndex = STAGE_TO_LEVEL_INDEX[pmStage];
  
  // Calculate data based on inputs
  // Promotion raises are always 20%, annual raises are 3% without Careerlyst and 8% with
  // Promotions use accelerated timeline (lower bound) with Careerlyst, normal (upper bound) without
  const withoutCareerlystData = useMemo(
    () => calculateSalaryProgression(
      startSalary, 
      startingLevelIndex,
      years,
      false
    ),
    [startSalary, startingLevelIndex, years]
  );
  
  const withCareerlystData = useMemo(
    () => calculateSalaryProgression(
      startSalary, 
      startingLevelIndex,
      years,
      true
    ),
    [startSalary, startingLevelIndex, years]
  );
  
  // Generate chart data points
  const chartData = useMemo(() => {
    const data = [];
    const maxLength = Math.max(withoutCareerlystData.length, withCareerlystData.length);
    
    for (let i = 0; i < maxLength; i++) {
      const withoutPoint = withoutCareerlystData[i];
      const withPoint = withCareerlystData[i];
      
      if (withoutPoint && withPoint) {
        data.push({
          year: withoutPoint.year,
          withoutCareerlyst: Math.round(withoutPoint.salary),
          withCareerlyst: Math.round(withPoint.salary),
          withoutPromotion: withoutPoint.isPromotion,
          withPromotion: withPoint.isPromotion,
          withoutLevel: withoutPoint.level,
          withLevel: withPoint.level,
        });
      }
    }
    
    return data;
  }, [withoutCareerlystData, withCareerlystData]);
  
  // Calculate rounded Y-axis domain for nice labels
  const rawMaxSalary = Math.max(
    ...chartData.map(d => d.withCareerlyst)
  );
  const rawMinSalary = Math.min(
    ...chartData.map(d => Math.min(d.withoutCareerlyst, d.withCareerlyst))
  );
  
  // Round up to next sensible number
  // Examples: $373K -> $400K, $401K -> $450K, $451K -> $500K
  const roundUpToNiceNumber = (value: number): number => {
    if (value === 0) return 0;
    const valueInThousands = value / 1000;
    
    // Up to $400K, round to $400K
    if (valueInThousands <= 400) {
      return 400000;
    }
    
    // Above $400K, round to next $50K increment
    // $401K -> $450K, $451K -> $500K, $501K -> $550K, etc.
    const roundedToFifty = Math.ceil(valueInThousands / 50) * 50;
    return roundedToFifty * 1000;
  };
  
  const maxSalary = roundUpToNiceNumber(rawMaxSalary);
  const minSalary = Math.max(0, Math.floor(rawMinSalary * 0.9 / 100000) * 100000);
  
  // Calculate lifetime earnings
  const withoutLifetimeEarnings = withoutCareerlystData.reduce(
    (sum, point) => sum + point.salary,
    0
  );
  const withLifetimeEarnings = withCareerlystData.reduce(
    (sum, point) => sum + point.salary,
    0
  );
  const difference = withLifetimeEarnings - withoutLifetimeEarnings;
  
  // Calculate breakdown
  const avgAnnualDifference = difference / years;
  const avgMonthlyDifference = avgAnnualDifference / 12;
  
  // Calculate ROI - how many months until membership pays for itself
  const monthsToPayoff = Math.ceil(ANNUAL_MEMBERSHIP_COST / (avgMonthlyDifference || 1));
  const roiMultiplier = Math.round(difference / ANNUAL_MEMBERSHIP_COST);
  
  const handleInputChange = (
    setter: (value: number) => void,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setter(numValue);
    }
  };
  
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 border-2 border-slate-300 shadow-lg">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 mb-2">
            Career Earnings Calculator
          </h3>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 font-medium px-2">
            See how much more you could earn by becoming a top 1% PM with Product Careerlyst
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6 lg:gap-8">
          {/* Left column - Simple inputs */}
          <div className="space-y-4 sm:space-y-6">
            {/* PM Stage */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Stage of PM
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(["Aspiring", "Associate PM", "Product Manager", "Senior PM", "Staff PM", "Director+"] as PMStage[]).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setPmStage(stage)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2 text-xs sm:text-sm font-bold transition-colors ${
                      pmStage === stage
                        ? "bg-purple-500 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Current salary */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-700 mb-2">
                Current salary
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={Math.round(startSalary / 1000)}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value);
                    if (!isNaN(numValue) && numValue >= 0) {
                      setStartSalary(numValue * 1000);
                    }
                  }}
                  className="w-24 sm:w-28 px-3 sm:px-4 py-3 sm:py-4 text-xl sm:text-2xl rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-medium"
                  min="0"
                  step="1"
                  aria-label="Current salary in thousands"
                />
                <span className="text-xl sm:text-2xl font-medium text-gray-500">K</span>
              </div>
            </div>
            
            {/* Years to calculate */}
            <div>
              <label className="block text-sm sm:text-base font-bold text-gray-700 mb-2">
                Years to calculate
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => handleInputChange(setYears, e.target.value)}
                className="w-32 sm:w-40 px-3 sm:px-4 py-3 sm:py-4 text-xl sm:text-2xl rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:outline-none font-medium"
                min="1"
                max="30"
                step="1"
              />
            </div>
          </div>
          
          {/* Right column - Big outcome number first */}
          <div className="pr-0 lg:pr-6">
            <div className="space-y-4 sm:space-y-6 px-3 sm:pl-6 py-4 sm:py-6 rounded-xl bg-gray-50">
            {/* Big headline number */}
            <div className="text-center">
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 mb-2">
                You could earn an extra
              </p>
              <p className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                +{formatCurrency(difference)}
              </p>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 font-medium">
                over the next {years} years as a PM
              </p>
            </div>
            
            {/* Breakdown */}
            <div className="text-center space-y-1">
              <p className="text-sm sm:text-base md:text-lg text-gray-600">
                = ~{formatCurrencyFull(avgAnnualDifference)} more per year on average
              </p>
              <p className="text-sm sm:text-base md:text-lg text-gray-600">
                = ~{formatCurrencyFull(avgMonthlyDifference)} more per month
              </p>
            </div>
            
            {/* Comparison cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-0 sm:pr-4 lg:pr-6">
              <div className="p-4 sm:p-5 rounded-xl bg-gray-50 border-2 border-gray-200">
                <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1 sm:mb-2">Without Product Careerlyst</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-gray-700">
                  {formatCurrency(withoutLifetimeEarnings)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Total earnings</p>
              </div>
              
              <div className="p-4 sm:p-5 rounded-xl bg-green-50 border-2 border-green-200">
                <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1 sm:mb-2">With Product Careerlyst</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-black text-green-600">
                  {formatCurrency(withLifetimeEarnings)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Total earnings</p>
              </div>
            </div>
            </div>
          </div>
        </div>
        
        {/* Chart - below everything, smaller */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-purple-200">
          <div className="mb-4 p-2 sm:p-4 rounded-[1rem] sm:rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 overflow-hidden">
            <ResponsiveContainer width="99%" height={200} minWidth={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d8b4fe" opacity={0.3} />
                <XAxis 
                  dataKey="year" 
                  stroke="#9333ea"
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: '#6b21a8' }}
                  label={{ value: 'Years in Career', position: 'insideBottom', offset: -5, style: { fontSize: '12px', fontWeight: 'bold', fill: '#6b21a8' } }}
                  tickFormatter={(value) => Math.round(value).toString()}
                  type="number"
                  scale="linear"
                  domain={[0, years]}
                  tick={{ fill: '#6b21a8', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#9333ea"
                  style={{ fontSize: '12px', fontWeight: 'bold', fill: '#6b21a8' }}
                  label={{ value: 'Annual Salary', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fontWeight: 'bold', fill: '#6b21a8' } }}
                  tickFormatter={(value) => formatCurrency(value)}
                  domain={[minSalary, maxSalary]}
                  type="number"
                  scale="linear"
                  tick={{ fill: '#6b21a8', fontWeight: 'bold' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    
                    const data = payload[0]?.payload;
                    const withoutPromotion = data?.withoutPromotion;
                    const withPromotion = data?.withPromotion;
                    const withoutLevel = data?.withoutLevel;
                    const withLevel = data?.withLevel;
                    
                    return (
                      <div style={{
                        backgroundColor: 'white',
                        border: '2px solid #9333ea',
                        borderRadius: '12px',
                        padding: '12px',
                        boxShadow: '0 4px 6px rgba(147, 51, 234, 0.2)'
                      }}>
                        <p style={{ color: '#6b21a8', fontWeight: 'bold', marginBottom: '8px' }}>
                          Year {label}
                        </p>
                        {payload.map((entry: any, index: number) => {
                          const isPromotion = entry.dataKey === 'withoutCareerlyst' 
                            ? withoutPromotion 
                            : withPromotion;
                          const level = entry.dataKey === 'withoutCareerlyst'
                            ? withoutLevel
                            : withLevel;
                          return (
                            <div key={index} style={{ marginBottom: '8px' }}>
                              <div>
                                <span style={{ fontWeight: 'bold', color: entry.color }}>
                                  {entry.name}: {formatCurrencyFull(entry.value)}
                                </span>
                              </div>
                              {isPromotion && (
                                <div style={{ marginTop: '4px' }}>
                                  <span style={{ 
                                    fontSize: '11px', 
                                    color: entry.dataKey === 'withoutCareerlyst' ? '#6b7280' : '#9333ea',
                                    fontWeight: 'bold',
                                    backgroundColor: entry.dataKey === 'withoutCareerlyst' ? '#f3f4f6' : '#f3e8ff',
                                    padding: '2px 6px',
                                    borderRadius: '4px'
                                  }}>
                                    {entry.dataKey === 'withoutCareerlyst' ? '' : '🎉 '}Promotion to {level}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="withoutCareerlyst" 
                  stroke="#9ca3af" 
                  strokeWidth={3}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload?.withoutPromotion) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="#6b7280"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}
                  name="Without Product Careerlyst"
                  strokeDasharray="5 5"
                  opacity={0.7}
                />
                <defs>
                  <linearGradient id="gradientWithCareerlyst" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <Line 
                  type="monotone" 
                  dataKey="withCareerlyst" 
                  stroke="#a855f7" 
                  strokeWidth={3.5}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (payload?.withPromotion) {
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={7}
                          fill="#9333ea"
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  }}
                  name="With Product Careerlyst"
                />
                </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-6">
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-gray-300">
              <div className="w-5 sm:w-6 h-1 bg-gray-400" style={{ borderTop: '2px dashed #9ca3af' }}></div>
              <span className="text-xs sm:text-sm font-bold text-gray-700">Without Product Careerlyst</span>
            </div>
            <div className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-purple-300">
              <div className="w-5 sm:w-6 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="text-xs sm:text-sm font-bold text-gray-700">With Product Careerlyst</span>
            </div>
          </div>
        </div>
        
        {/* CTA Button */}
        <div className="mt-6 sm:mt-8 text-center">
          <Link
            href="/auth/sign-up"
            className="inline-block px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_6px_0_0_rgba(147,51,234,0.6)] sm:shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_3px_0_0_rgba(147,51,234,0.6)] sm:hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] text-base sm:text-lg font-black text-white transition-all duration-200"
          >
            Get started for free
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SalaryProgressionChart;
