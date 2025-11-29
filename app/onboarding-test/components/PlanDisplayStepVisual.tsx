'use client';

interface PlanDisplayStepVisualProps {
  onNext: () => void;
  onBack: () => void;
}

export const PlanDisplayStepVisual = ({ onNext, onBack }: PlanDisplayStepVisualProps) => {
  // Mock plan data for visual display
  const mockPlan = {
    recommendedFeatures: [
      { feature: 'Resume Builder', reason: 'Your resume needs improvement', priority: 1 },
      { feature: 'Product Portfolio', reason: 'Showcase your work effectively', priority: 2 },
      { feature: 'Job Application Tracker', reason: 'Track your applications', priority: 3 },
    ],
    learningPath: {
      recommended: true,
      courses: [
        { title: 'Product Management Fundamentals', slug: 'pm-fundamentals', reason: 'Build core PM skills', order: 1 },
        { title: 'Interview Preparation', slug: 'interview-prep', reason: 'Ace your interviews', order: 2 },
      ],
      reason: 'These courses will help you achieve your goals',
    },
    nextSteps: [
      { step: 'Update your resume', description: 'Improve your resume with our AI-powered builder', timeline: 'Week 1', priority: 1, actionable: true },
      { step: 'Build your portfolio', description: 'Create a professional product portfolio', timeline: 'Week 2', priority: 2, actionable: true },
    ],
    milestones: [
      { milestone: 'First interview scheduled', targetDate: '2024-12-15', description: 'Get your first interview' },
      { milestone: 'First offer received', targetDate: '2025-01-15', description: 'Receive your first job offer' },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Your Customized Plan
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          We've created a personalized action plan based on your goals and challenges.
        </p>
      </div>

      {/* Mock Plan Display */}
      <div className="mb-6 md:mb-8 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 md:p-8">
        <div className="space-y-6">
          {/* Recommended Features */}
          {mockPlan.recommendedFeatures.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Recommended Features</h3>
              <div className="space-y-2">
                {mockPlan.recommendedFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{feature.feature}</p>
                      <p className="text-sm text-gray-600">{feature.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Path */}
          {mockPlan.learningPath.recommended && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Learning Path</h3>
              <p className="text-sm text-gray-600 mb-3">{mockPlan.learningPath.reason}</p>
              <div className="space-y-2">
                {mockPlan.learningPath.courses.map((course, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                    <p className="font-semibold text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-600">{course.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {mockPlan.nextSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Next Steps</h3>
              <div className="space-y-2">
                {mockPlan.nextSteps.map((step, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{step.step}</p>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Timeline: {step.timeline}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Milestones */}
          {mockPlan.milestones.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Milestones</h3>
              <div className="space-y-2">
                {mockPlan.milestones.map((milestone, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                    <p className="font-semibold text-gray-900">{milestone.milestone}</p>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Target: {milestone.targetDate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="px-4 md:px-6 py-2 md:py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm md:text-base"
        >
          Get Started on this Plan
        </button>
      </div>
    </div>
  );
};

