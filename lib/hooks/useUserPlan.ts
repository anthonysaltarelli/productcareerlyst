'use client';

import { useState, useEffect } from 'react';
import { getUserPlanClient } from '@/lib/utils/resume-tracking';

type PlanType = 'learn' | 'accelerate' | null;

/**
 * Hook to get the current user's subscription plan
 * Returns the plan type and loading state
 */
export const useUserPlan = () => {
  const [plan, setPlan] = useState<PlanType>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const userPlan = await getUserPlanClient();
        setPlan(userPlan);
      } catch (error) {
        console.error('Error fetching user plan:', error);
        setPlan(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, []);

  return { plan, isLoading };
};

export default useUserPlan;






