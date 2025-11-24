'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, FileEdit, Briefcase, FolderKanban, Book } from 'lucide-react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';

interface FeaturesStepProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const FEATURES = [
  {
    id: 'courses',
    name: 'Courses/Lessons',
    description: 'Access comprehensive PM courses and video lessons to level up your skills',
    icon: BookOpen,
  },
  {
    id: 'resumeEditor',
    name: 'Resume Editor',
    description: 'AI-powered resume editor with bullet optimization and ATS compatibility',
    icon: FileEdit,
  },
  {
    id: 'jobCenter',
    name: 'Job Center',
    description: 'Contact discovery, company research, custom interview questions, and job tracking',
    icon: Briefcase,
  },
  {
    id: 'portfolio',
    name: 'Product Portfolio Hub',
    description: 'Build and showcase your product portfolio with case studies and templates',
    icon: FolderKanban,
  },
  {
    id: 'pmResources',
    name: 'PM Resources',
    description: 'Templates, guides, and resources to accelerate your product management career',
    icon: Book,
  },
] as const;

export const FeaturesStep = ({ onNext, onBack, onSkip }: FeaturesStepProps) => {
  const { progress, updateStep, completeStep } = useOnboardingProgress();
  const featureData = progress?.progress_data?.feature_interests || {};
  
  const [interests, setInterests] = useState<Record<string, boolean>>({
    courses: featureData.courses || false,
    resumeEditor: featureData.resumeEditor || false,
    jobCenter: featureData.jobCenter || false,
    portfolio: featureData.portfolio || false,
    pmResources: featureData.pmResources || false,
  });

  // Auto-save on change
  useEffect(() => {
    updateStep('feature_interests', interests);
  }, [interests, updateStep]);

  const handleToggle = useCallback((featureId: string) => {
    setInterests((prev) => {
      const newInterests = {
        ...prev,
        [featureId]: !prev[featureId],
      };
      
      // Track feature interest toggle (non-blocking)
      setTimeout(() => {
        try {
          const selectedFeatures = Object.entries(newInterests)
            .filter(([_, isSelected]) => isSelected)
            .map(([id]) => id);
          
          trackEvent('User Toggled Feature Interest', {
            'Page Route': '/onboarding',
            'Step': 'features',
            'Feature ID': featureId,
            'Feature Name': FEATURES.find(f => f.id === featureId)?.name || featureId,
            'Is Selected': newInterests[featureId],
            'Selected Features': selectedFeatures,
            'Selected Features Count': selectedFeatures.length,
            'All Selected Features': selectedFeatures.join(', ') || 'none',
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Tracking error (non-blocking):', error);
          }
        }
      }, 0);
      
      return newInterests;
    });
  }, []);

  const handleNext = useCallback(async () => {
    await completeStep('features');
    
    // Track step completion (non-blocking)
    setTimeout(() => {
      try {
        const selectedFeatures = Object.entries(interests)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);
        
        trackEvent('User Completed Onboarding Step', {
          'Page Route': '/onboarding',
          'Step': 'features',
          'Step Name': 'Features',
          'Selected Features': selectedFeatures,
          'Selected Features Count': selectedFeatures.length,
          'All Selected Features': selectedFeatures.join(', ') || 'none',
          'Interested in Courses': interests.courses,
          'Interested in Resume Editor': interests.resumeEditor,
          'Interested in Job Center': interests.jobCenter,
          'Interested in Portfolio': interests.portfolio,
          'Interested in PM Resources': interests.pmResources,
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Tracking error (non-blocking):', error);
        }
      }
    }, 0);
    
    onNext();
  }, [completeStep, onNext, interests]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Explore Our Features
        </h2>
        <p className="text-lg text-gray-700 font-semibold">
          Check out what we offer and let us know which features interest you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const isSelected = interests[feature.id];

          return (
            <div
              key={feature.id}
              onClick={() => handleToggle(feature.id)}
              className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    isSelected ? 'bg-purple-100' : 'bg-gray-100'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? 'text-purple-600' : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-black text-gray-900">
                      {feature.name}
                    </h3>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggle(feature.id)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <p className="text-sm text-gray-600 font-semibold">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              // Track skip (non-blocking)
              setTimeout(() => {
                try {
                  const selectedFeatures = Object.entries(interests)
                    .filter(([_, isSelected]) => isSelected)
                    .map(([id]) => id);
                  
                  trackEvent('User Skipped Onboarding Step', {
                    'Page Route': '/onboarding',
                    'Step': 'features',
                    'Step Name': 'Features',
                    'Selected Features Count': selectedFeatures.length,
                  });
                } catch (error) {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('⚠️ Tracking error (non-blocking):', error);
                  }
                }
              }, 0);
              
              onSkip();
            }}
            className="px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors"
          >
            Skip
          </button>
        </div>
        <button
          onClick={handleNext}
          className="px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Continue →
        </button>
      </div>
    </div>
  );
};

