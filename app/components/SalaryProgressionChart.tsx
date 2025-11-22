"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

interface SalaryDataPoint {
  year: number;
  salary: number;
  isPromotion: boolean;
}

type CareerStage = "early" | "mid" | "senior";
type PresetType = "typical" | "senior-bigtech" | "aspiring";

interface PresetConfig {
  salary: number;
  careerStage: CareerStage;
  years: number;
}

const PRESETS: Record<PresetType, PresetConfig> = {
  typical: {
    salary: 120000,
    careerStage: "mid",
    years: 15,
  },
  "senior-bigtech": {
    salary: 180000,
    careerStage: "senior",
    years: 15,
  },
  aspiring: {
    salary: 95000,
    careerStage: "early",
    years: 15,
  },
};

// Career stage assumptions (internal - not shown to user)
const CAREER_STAGE_ASSUMPTIONS: Record<
  CareerStage,
  {
    withoutCareerlyst: { annualRaise: number; promotionInterval: number; promotionRaise: number };
    withCareerlyst: { annualRaise: number; promotionInterval: number; promotionRaise: number };
  }
> = {
  early: {
    withoutCareerlyst: { annualRaise: 3, promotionInterval: 4, promotionRaise: 20 },
    withCareerlyst: { annualRaise: 10, promotionInterval: 2, promotionRaise: 20 },
  },
  mid: {
    withoutCareerlyst: { annualRaise: 3, promotionInterval: 4, promotionRaise: 20 },
    withCareerlyst: { annualRaise: 10, promotionInterval: 2, promotionRaise: 20 },
  },
  senior: {
    withoutCareerlyst: { annualRaise: 3, promotionInterval: 5, promotionRaise: 25 },
    withCareerlyst: { annualRaise: 12, promotionInterval: 2.5, promotionRaise: 25 },
  },
};

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
  // Primary inputs
  const [startSalary, setStartSalary] = useState(120000);
  const [careerStage, setCareerStage] = useState<CareerStage>("mid");
  const [years, setYears] = useState(15);
  
  // Advanced settings (collapsed by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Without Product Careerlyst (defaults based on career stage)
  const withoutAssumptions = CAREER_STAGE_ASSUMPTIONS[careerStage].withoutCareerlyst;
  const [withoutAnnualRaise, setWithoutAnnualRaise] = useState(withoutAssumptions.annualRaise);
  const [withoutPromotionInterval, setWithoutPromotionInterval] = useState(withoutAssumptions.promotionInterval);
  const [withoutPromotionRaise, setWithoutPromotionRaise] = useState(withoutAssumptions.promotionRaise);
  
  // With Product Careerlyst (defaults based on career stage)
  const withAssumptions = CAREER_STAGE_ASSUMPTIONS[careerStage].withCareerlyst;
  const [withAnnualRaise, setWithAnnualRaise] = useState(withAssumptions.annualRaise);
  const [withPromotionInterval, setWithPromotionInterval] = useState(withAssumptions.promotionInterval);
  const [withPromotionRaise, setWithPromotionRaise] = useState(withAssumptions.promotionRaise);
  
  // Update advanced settings when career stage changes
  useMemo(() => {
    const without = CAREER_STAGE_ASSUMPTIONS[careerStage].withoutCareerlyst;
    const with_ = CAREER_STAGE_ASSUMPTIONS[careerStage].withCareerlyst;
    setWithoutAnnualRaise(without.annualRaise);
    setWithoutPromotionInterval(without.promotionInterval);
    setWithoutPromotionRaise(without.promotionRaise);
    setWithAnnualRaise(with_.annualRaise);
    setWithPromotionInterval(with_.promotionInterval);
    setWithPromotionRaise(with_.promotionRaise);
  }, [careerStage]);
  
  // Calculate data based on inputs
  const withoutCareerlystData = useMemo(
    () => calculateSalaryProgression(startSalary, withoutAnnualRaise, withoutPromotionInterval, withoutPromotionRaise, years),
    [startSalary, withoutAnnualRaise, withoutPromotionInterval, withoutPromotionRaise, years]
  );
  
  const withCareerlystData = useMemo(
    () => calculateSalaryProgression(startSalary, withAnnualRaise, withPromotionInterval, withPromotionRaise, years),
    [startSalary, withAnnualRaise, withPromotionInterval, withPromotionRaise, years]
  );
  
  // Calculate effective continuous growth rate from annual raises and promotions
  // This creates a smooth exponential curve without discrete jumps
  const calculateEffectiveGrowthRate = (
    annualRaisePercent: number,
    promotionInterval: number,
    promotionRaisePercent: number
  ): number => {
    // Annual growth from raises
    const annualGrowth = 1 + annualRaisePercent / 100;
    
    // Average annual growth from promotions (spread over promotion interval)
    const promotionAnnualGrowth = Math.pow(1 + promotionRaisePercent / 100, 1 / promotionInterval);
    
    // Combined effective annual growth rate
    return annualGrowth * promotionAnnualGrowth;
  };
  
  // Calculate salary at any fractional year using continuous exponential growth
  const calculateSalaryAtYear = (
    startSalary: number,
    annualRaisePercent: number,
    promotionInterval: number,
    promotionRaisePercent: number,
    targetYear: number
  ): number => {
    // Calculate effective continuous growth rate
    const effectiveGrowthRate = calculateEffectiveGrowthRate(
      annualRaisePercent,
      promotionInterval,
      promotionRaisePercent
    );
    
    // Apply continuous exponential growth
    return startSalary * Math.pow(effectiveGrowthRate, targetYear);
  };
  
  // Round up to the next sensible number above the value
  // Examples: $1.9M -> $2M, $2.1M -> $2.5M, $3.7M -> $4M
  const roundUpToNiceNumber = (value: number): number => {
    if (value === 0) return 0;
    
    // Convert to millions for easier calculation
    const valueInMillions = value / 1000000;
    
    // Define nice numbers in millions: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, etc.
    // Find the next nice number above the value
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
    else {
      // For values above 5M, round to next 1M increment
      niceNumber = Math.ceil(valueInMillions);
    }
    
    return niceNumber * 1000000;
  };
  
  // Generate data points at 1-year intervals for Recharts
  const chartData = useMemo(() => {
    const data = [];
    
    // Generate one data point per year (0, 1, 2, ..., years)
    for (let year = 0; year <= years; year++) {
      const withoutSalary = calculateSalaryAtYear(
        startSalary,
        withoutAnnualRaise,
        withoutPromotionInterval,
        withoutPromotionRaise,
        year
      );
      const withSalary = calculateSalaryAtYear(
        startSalary,
        withAnnualRaise,
        withPromotionInterval,
        withPromotionRaise,
        year
      );
      
      data.push({
        year: year,
        withoutCareerlyst: Math.round(withoutSalary),
        withCareerlyst: Math.round(withSalary),
      });
    }
    
    return data;
  }, [startSalary, withoutAnnualRaise, withoutPromotionInterval, withoutPromotionRaise, withAnnualRaise, withPromotionInterval, withPromotionRaise, years]);
  
  // Calculate rounded Y-axis domain for nice labels
  // Use "With Product Careerlyst" as the reference for max (the purple line)
  const rawMaxSalary = Math.max(
    ...chartData.map(d => d.withCareerlyst)
  );
  const rawMinSalary = Math.min(
    ...chartData.map(d => Math.min(d.withoutCareerlyst, d.withCareerlyst))
  );
  
  // Round max to next nice number above the "With Product Careerlyst" max (no padding needed)
  const maxSalary = roundUpToNiceNumber(rawMaxSalary);
  const minSalary = Math.max(0, Math.floor(rawMinSalary * 0.9 / 100000) * 100000); // Round down to nearest 100K, but not below 0
  
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
  
  const handlePresetClick = (preset: PresetType) => {
    const config = PRESETS[preset];
    setStartSalary(config.salary);
    setCareerStage(config.careerStage);
    setYears(config.years);
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
            {/* Presets */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">Quick presets:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handlePresetClick("typical")}
                  className="px-4 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-sm font-bold text-purple-700 transition-colors"
                >
                  Typical US PM
                </button>
                <button
                  onClick={() => handlePresetClick("senior-bigtech")}
                  className="px-4 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-sm font-bold text-purple-700 transition-colors"
                >
                  Senior PM at Big Tech
                </button>
                <button
                  onClick={() => handlePresetClick("aspiring")}
                  className="px-4 py-2 rounded-lg bg-purple-100 hover:bg-purple-200 border-2 border-purple-300 text-sm font-bold text-purple-700 transition-colors"
                >
                  Aspiring PM
                </button>
              </div>
            </div>
            
            {/* Primary input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Current or target base salary
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
            
            {/* Career stage selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Career stage
              </label>
              <div className="flex gap-2">
                {(["early", "mid", "senior"] as CareerStage[]).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setCareerStage(stage)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-bold transition-colors ${
                      careerStage === stage
                        ? "bg-purple-500 text-white border-purple-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {stage === "early" ? "Early PM" : stage === "mid" ? "Mid-level PM" : "Senior PM"}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Advanced settings toggle */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                {showAdvanced ? "Hide" : "Adjust"} assumptions
                <span className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}>▾</span>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-6 p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                  <div>
                    <h4 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      Without Product Careerlyst
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Annual Raise (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withoutAnnualRaise}
                            onChange={(e) => handleInputChange(setWithoutAnnualRaise, e.target.value)}
                            className="w-full pl-3 pr-7 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-gray-500 focus:outline-none font-medium"
                            min="0"
                            step="0.1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Promotion Every (Years)</label>
                        <input
                          type="number"
                          value={withoutPromotionInterval}
                          onChange={(e) => handleInputChange(setWithoutPromotionInterval, e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-gray-500 focus:outline-none font-medium"
                          min="0.5"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Promotion Raise (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withoutPromotionRaise}
                            onChange={(e) => handleInputChange(setWithoutPromotionRaise, e.target.value)}
                            className="w-full pl-3 pr-7 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-gray-500 focus:outline-none font-medium"
                            min="0"
                            step="1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-black text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      With Product Careerlyst (typical member results)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Annual Raise (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withAnnualRaise}
                            onChange={(e) => handleInputChange(setWithAnnualRaise, e.target.value)}
                            className="w-full pl-3 pr-7 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-green-500 focus:outline-none font-medium"
                            min="0"
                            step="0.1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Promotion Every (Years)</label>
                        <input
                          type="number"
                          value={withPromotionInterval}
                          onChange={(e) => handleInputChange(setWithPromotionInterval, e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-green-500 focus:outline-none font-medium"
                          min="0.5"
                          step="0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Promotion Raise (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={withPromotionRaise}
                            onChange={(e) => handleInputChange(setWithPromotionRaise, e.target.value)}
                            className="w-full pl-3 pr-7 py-1.5 text-sm rounded-lg border-2 border-gray-300 focus:border-green-500 focus:outline-none font-medium"
                            min="0"
                            step="1"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Years to Calculate</label>
                    <input
                      type="number"
                      value={years}
                      onChange={(e) => handleInputChange(setYears, e.target.value)}
                      className="w-24 px-3 py-1.5 text-sm rounded-lg border-2 border-purple-300 focus:border-purple-500 focus:outline-none font-medium"
                      min="1"
                      max="30"
                      step="1"
                    />
                  </div>
                </div>
              )}
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
