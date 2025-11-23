'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrackedButton } from '@/app/components/TrackedButton';

interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  shadowColor: string;
  features: string[];
}

const templates: PortfolioTemplate[] = [
  {
    id: 'modern-minimalist',
    name: 'Modern Minimalist',
    description: 'Clean, professional design with focus on content and white space. Perfect for showcasing your work with elegance.',
    icon: '✨',
    color: 'from-blue-200 to-cyan-200',
    borderColor: 'border-blue-300',
    shadowColor: 'rgba(37,99,235,0.3)',
    features: ['Clean typography', 'Minimal design', 'Content-first approach', 'Professional look'],
  },
  {
    id: 'story-driven',
    name: 'Story-Driven',
    description: 'Narrative-focused layout that guides readers through your product journey. Great for telling compelling stories.',
    icon: '📖',
    color: 'from-purple-200 to-pink-200',
    borderColor: 'border-purple-300',
    shadowColor: 'rgba(147,51,234,0.3)',
    features: ['Narrative flow', 'Story sections', 'Engaging layout', 'Journey-focused'],
  },
  {
    id: 'data-focused',
    name: 'Data-Focused',
    description: 'Metrics and results take center stage. Ideal for showcasing quantifiable impact and business outcomes.',
    icon: '📊',
    color: 'from-green-200 to-emerald-200',
    borderColor: 'border-green-300',
    shadowColor: 'rgba(22,163,74,0.3)',
    features: ['Metrics emphasis', 'Data visualization', 'Results-driven', 'Impact-focused'],
  },
  {
    id: 'visual-showcase',
    name: 'Visual Showcase',
    description: 'Image-rich portfolio that highlights your design work and visual thinking. Perfect for design-forward PMs.',
    icon: '🎨',
    color: 'from-pink-200 to-rose-200',
    borderColor: 'border-pink-300',
    shadowColor: 'rgba(236,72,153,0.3)',
    features: ['Image galleries', 'Visual emphasis', 'Design showcase', 'Creative layout'],
  },
];

export default function PortfolioEditorPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    router.push(`/dashboard/portfolio/editor/${templateId}`);
  };

  return (
    <div className="p-8 md:p-12">
      {/* Page Header */}
      <div className="mb-8">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-200 to-pink-200 shadow-[0_15px_0_0_rgba(147,51,234,0.3)] border-2 border-purple-300">
          <span className="text-5xl mb-4 block">🚀</span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3">
            Launch a Product Portfolio
          </h1>
          <p className="text-xl text-gray-700 font-semibold">
            Choose a template to get started building your portfolio
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template, index) => (
          <div
            key={template.id}
            className={`p-6 rounded-[2rem] bg-gradient-to-br ${template.color} border-2 ${template.borderColor} hover:translate-y-1 transition-all duration-200 cursor-pointer ${
              selectedTemplate === template.id ? 'ring-4 ring-gray-800 ring-offset-4' : ''
            }`}
            style={{
              boxShadow: `0 10px 0 0 ${template.shadowColor}`,
            }}
          >
            <div className="flex flex-col h-full">
              <span className="text-5xl mb-4 block">{template.icon}</span>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{template.name}</h3>
              <p className="text-gray-700 font-medium mb-4 flex-1">{template.description}</p>
              
              {/* Features List */}
              <div className="mb-6">
                <ul className="space-y-2">
                  {template.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <span className="text-gray-800">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Select Button */}
              <TrackedButton
                buttonId={`portfolio-editor-template-${template.id}-select-button`}
                eventName="User Clicked Portfolio Template"
                eventProperties={{
                  'Template ID': template.id,
                  'Template Name': template.name,
                  'Template Position': index + 1,
                  'Button Section': 'Template Selection Grid',
                  'Button Position': `Template ${index + 1}`,
                  'Button Text': 'Select Template',
                  'Button Type': 'Template Selection CTA',
                  'Button Context': `Below ${template.name} template description`,
                  'Page Section': index < 2 ? 'Above the fold' : 'Below the fold',
                }}
                onClick={() => handleTemplateSelect(template.id)}
                className="w-full px-6 py-3 rounded-[1.5rem] bg-white/80 hover:bg-white border-2 border-gray-300 font-black text-gray-800 transition-all duration-200"
                ariaLabel={`Select ${template.name} template`}
              >
                {selectedTemplate === template.id ? 'Selected ✓' : 'Select Template →'}
              </TrackedButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

