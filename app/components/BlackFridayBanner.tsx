'use client';

import { useState, useEffect } from 'react';
import { Tag } from 'lucide-react';
import { useFlags } from 'launchdarkly-react-client-sdk';

// Black Friday deal configuration
const BLACK_FRIDAY_END_DATE = new Date('2025-12-02T04:59:59Z'); // Dec 1st 11:59pm EST = Dec 2nd 04:59:59 UTC

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeRemaining = (): TimeRemaining | null => {
  const now = new Date();
  const difference = BLACK_FRIDAY_END_DATE.getTime() - now.getTime();
  
  if (difference <= 0) {
    return null;
  }
  
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
};

export const BlackFridayBanner = () => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Feature flags
  const flags = useFlags();
  const blackFridayEnabled = flags['blackFriday2025'] ?? false;
  
  // Check if Black Friday deal is active (feature flag + date check)
  const isBlackFridayActive = isClient && blackFridayEnabled && timeRemaining !== null;
  
  // Update countdown timer
  useEffect(() => {
    setIsClient(true);
    setTimeRemaining(calculateTimeRemaining());
    
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (!isBlackFridayActive || !timeRemaining) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[60] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-red-500">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          {/* Bouncing Tag */}
          <div className="animate-bounce-gentle">
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600 text-white font-black text-xs sm:text-sm shadow-lg">
              <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              BLACK FRIDAY
            </span>
          </div>
          
          {/* Deal Text */}
          <p className="text-white font-black text-sm sm:text-base">
            50% OFF FOREVER — USE CODE <span className="text-yellow-400">BLACKFRIDAY50</span>
          </p>
        </div>
      </div>
    </div>
  );
};


