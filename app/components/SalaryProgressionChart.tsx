"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface SalaryDataPoint {
  year: number;
  salary: number;
  level: string;
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
        level: CAREER_LEVELS[currentLevelIndex][0] 
      });
      continue;
    }
    
    // Check if promotion happens this year
    // We promote when we've been at the current level long enough
    // Round down to promote at the first integer year that reaches the threshold
    const promotionThreshold = Math.max(1, Math.floor(nextPromotionYear));
    if (yearsAtCurrentLevel >= promotionThreshold && currentLevelIndex < CAREER_LEVELS.length - 1) {
      // Promotion! Always 20%
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
      level: CAREER_LEVELS[currentLevelIndex][0] 
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
  
  // Round up to next nice number
  const roundUpToNiceNumber = (value: number): number => {
    if (value === 0) return 0;
    const valueInMillions = value / 1000000;
    let niceNumber;
    if (valueInMillions <= 0.5) niceNumber = 0.5;
    else if (valueInMillions <= 1) niceNumber = 1;
    else if (valueInMillions <= 1.5) niceNumber = 1.5;
    else if (valueInMillions <= 2) niceNumber = 2;
    else if (valueInMillions <= 2.5) niceNumber = 2.5;
    else if (valueInMillions <= 3) niceNumber = 3;
    else if (valueInMillions <= 3.5) niceNumber = 3.5;
    else if (valueInMillions <= 4) niceNumber = 4;
    else if (valueInMillions <= 4.5) niceNumber = 4.5;
    else if (valueInMillions <= 5) niceNumber = 5;
    else niceNumber = Math.ceil(valueInMillions);
    return niceNumber * 1000000;
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
      <div className="bg-white/90 backdrop-blur-sm rounded-[2rem] p-6 md:p-8 border-2 border-slate-300 shadow-lg">
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-black text-gray-800 mb-2">
            Career Earnings Calculator
          </h3>
          <p className="text-base md:text-lg text-gray-600 font-medium">
            See how much more you could earn by becoming a top 1% PM with Product Careerlyst
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column - Simple inputs */}
          <div className="space-y-6">
            {/* PM Stage */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Stage of PM
              </label>
              <div className="flex flex-wrap gap-2">
                {(["Aspiring", "Associate PM", "Product Manager", "Senior PM", "Staff PM", "Director+"] as PMStage[]).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setPmStage(stage)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
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
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Current salary
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-medium">$</span>
                <input
                  type="number"
                  value={startSalary}
                  onChange={(e) => handleInputChange(setStartSalary, e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-lg rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none font-medium"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
            
            {/* Years to calculate */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Years to calculate
              </label>
              <input
                type="number"
                value={years}
                onChange={(e) => handleInputChange(setYears, e.target.value)}
                className="w-32 px-4 py-3 text-lg rounded-xl border-2 border-purple-300 focus:border-purple-500 focus:outline-none font-medium"
                min="1"
                max="30"
                step="1"
              />
            </div>
            
            {/* Info box about assumptions */}
            <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200">
              <p className="text-xs font-bold text-purple-800 mb-2">Assumptions:</p>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>• Promotion raises: Always 20%</li>
                <li>• Annual raises: 3% without Careerlyst, 8% with Careerlyst</li>
                <li>• With Careerlyst: Accelerated promotions (lower bound timeline)</li>
                <li>• Without Careerlyst: Normal promotions (upper bound timeline)</li>
                <li>• APM → PM: 1-3 years</li>
                <li>• PM → Senior PM: 2-5 years</li>
                <li>• Senior PM → Staff PM: 3-6 years</li>
                <li>• Staff PM → Principal PM: 4-7 years</li>
              </ul>
            </div>
          </div>
          
          {/* Right column - Big outcome number first */}
          <div className="space-y-6">
            {/* Big headline number */}
            <div className="text-center">
              <p className="text-lg md:text-xl font-bold text-gray-700 mb-2">
                You could earn an extra
              </p>
              <p className="text-5xl md:text-7xl font-black bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                +{formatCurrency(difference)}
              </p>
              <p className="text-base md:text-lg text-gray-600 font-medium">
                over the next {years} years as a PM
              </p>
            </div>
            
            {/* Breakdown */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                = ~{formatCurrencyFull(avgAnnualDifference)} more per year on average
              </p>
              <p className="text-sm text-gray-600">
                = ~{formatCurrencyFull(avgMonthlyDifference)} more per month
              </p>
            </div>
            
            {/* Comparison cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-1">Without Product Careerlyst</p>
                <p className="text-xl font-black text-gray-700">
                  {formatCurrency(withoutLifetimeEarnings)}
                </p>
                <p className="text-xs text-gray-500">Total earnings</p>
              </div>
              
              <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                <p className="text-xs font-bold text-gray-600 mb-1">With Product Careerlyst</p>
                <p className="text-xl font-black text-green-600">
                  {formatCurrency(withLifetimeEarnings)}
                </p>
                <p className="text-xs text-gray-500">Total earnings</p>
              </div>
            </div>
            
            {/* ROI card */}
            <div className="p-4 rounded-xl bg-purple-50 border-2 border-purple-200 text-center">
              <p className="text-xs font-bold text-gray-600 mb-1">
                Membership pays for itself in {monthsToPayoff} month{monthsToPayoff !== 1 ? "s" : ""}
              </p>
              <p className="text-sm text-gray-600">
                Product Careerlyst membership: ${ANNUAL_MEMBERSHIP_COST}/year → That's a {roiMultiplier}x ROI if you reach these outcomes
              </p>
            </div>
            
            {/* CTA Button */}
            <Link
              href="/auth/sign-up"
              className="block w-full px-6 py-4 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_8px_0_0_rgba(147,51,234,0.6)] border-2 border-purple-600 hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(147,51,234,0.6)] text-lg font-black text-white transition-all duration-200 text-center"
            >
              See how we help you get there →
            </Link>
          </div>
        </div>
        
        {/* Chart - below everything, smaller */}
        <div className="mt-8 pt-8 border-t-2 border-purple-200">
          <div className="w-full h-[300px] mb-4 p-4 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
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
                  formatter={(value: number) => formatCurrencyFull(value)}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #9333ea',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 6px rgba(147, 51, 234, 0.2)'
                  }}
                  labelStyle={{ color: '#6b21a8', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="withoutCareerlyst" 
                  stroke="#9ca3af" 
                  strokeWidth={3}
                  dot={false}
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
                  dot={false}
                  name="With Product Careerlyst"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-gray-300">
              <div className="w-6 h-1 bg-gray-400" style={{ borderTop: '2px dashed #9ca3af' }}></div>
              <span className="text-xs font-bold text-gray-700">Without Product Careerlyst</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/60 backdrop-blur-sm border-2 border-purple-300">
              <div className="w-6 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="text-xs font-bold text-gray-700">With Product Careerlyst</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryProgressionChart;
