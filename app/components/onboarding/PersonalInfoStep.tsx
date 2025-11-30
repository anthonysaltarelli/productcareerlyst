'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useOnboardingProgress } from '@/lib/hooks/useOnboardingProgress';
import { trackEvent } from '@/lib/amplitude/client';

interface PersonalInfoStepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

const CAREER_STAGES = [
  { value: 'breaking_into_product', label: 'Breaking into product' },
  { value: 'already_in_product_new_role', label: 'Already in product - looking for new role' },
  { value: 'promotion', label: 'Trying to get promoted' },
  { value: 'high_raise', label: 'Trying to get a high raise this year' },
] as const;

const ROLE_SUGGESTIONS = [
  "Product Management Intern",
  "Associate Product Manager",
  "Product Manager",
  "Product Manager II",
  "Senior Product Manager",
  "Lead Product Manager",
  "Staff Product Manager",
  "Principal Product Manager",
  "Group Product Manager",
  "Director of Product Management",
  "Senior Director of Product Management",
  "VP of Product",
  "Senior VP of Product",
  "Chief Product Officer",
  "Product Coordinator",
  "Junior Product Manager",
  "Product Owner",
  "Agile Product Owner",
  "Technical Product Owner",
  "Business Product Owner",
  "Project Manager",
  "Technical Project Manager",
  "IT Project Manager",
  "Digital Project Manager",
  "Implementation Project Manager",
  "Program Manager",
  "Technical Program Manager",
  "Digital Program Manager",
  "Business Program Manager",
  "Scrum Master",
  "Agile Coach",
  "Delivery Manager",
  "Engagement Manager",
  "Client Engagement Manager",
  "Customer Engagement Manager",
  "Business Analyst",
  "Senior Business Analyst",
  "IT Business Analyst",
  "Systems Business Analyst",
  "Technical Business Analyst",
  "Digital Business Analyst",
  "Product Business Analyst",
  "Operations Business Analyst",
  "Financial Business Analyst",
  "Marketing Business Analyst",
  "Strategy Analyst",
  "Product Analyst",
  "Senior Product Analyst",
  "Data Analyst",
  "Senior Data Analyst",
  "Business Intelligence Analyst",
  "Customer Insights Analyst",
  "User Insights Analyst",
  "UX Researcher",
  "User Researcher",
  "Design Researcher",
  "Market Research Analyst",
  "Competitive Intelligence Analyst",
  "Growth Analyst",
  "Web Analyst",
  "Conversion Rate Optimization Specialist",
  "Product Marketing Manager",
  "Associate Product Marketing Manager",
  "Senior Product Marketing Manager",
  "Growth Marketing Manager",
  "Digital Marketing Manager",
  "Performance Marketing Manager",
  "Lifecycle Marketing Manager",
  "Email Marketing Manager",
  "Demand Generation Manager",
  "Field Marketing Manager",
  "Marketing Operations Manager",
  "Brand Manager",
  "Content Marketing Manager",
  "Community Manager",
  "Partner Marketing Manager",
  "Sales Development Representative",
  "Business Development Representative",
  "Account Development Representative",
  "Inside Sales Representative",
  "Account Executive",
  "Senior Account Executive",
  "Enterprise Account Executive",
  "Mid-Market Account Executive",
  "Strategic Account Executive",
  "Account Manager",
  "Key Account Manager",
  "Territory Account Manager",
  "Strategic Account Manager",
  "Channel Account Manager",
  "Customer Success Manager",
  "Senior Customer Success Manager",
  "Customer Success Team Lead",
  "Customer Success Operations Manager",
  "Client Success Manager",
  "Customer Experience Manager",
  "Customer Onboarding Specialist",
  "Customer Implementation Specialist",
  "Customer Retention Specialist",
  "Customer Support Specialist",
  "Customer Support Engineer",
  "Technical Support Engineer",
  "Technical Support Specialist",
  "Support Team Lead",
  "Solutions Engineer",
  "Sales Engineer",
  "Pre-Sales Engineer",
  "Solutions Consultant",
  "Implementation Consultant",
  "Customer Solutions Architect",
  "Customer Implementation Engineer",
  "Training Specialist",
  "Customer Training Manager",
  "Enablement Specialist",
  "Sales Enablement Manager",
  "Partner Enablement Manager",
  "Implementation Manager",
  "Onboarding Project Manager",
  "Client Implementation Manager",
  "Professional Services Consultant",
  "Professional Services Engineer",
  "Professional Services Manager",
  "Management Consultant",
  "Strategy Consultant",
  "Technology Consultant",
  "Digital Transformation Consultant",
  "Business Process Consultant",
  "Product Strategy Consultant",
  "Innovation Consultant",
  "Associate Consultant",
  "Senior Consultant",
  "Engagement Lead",
  "Solutions Architect",
  "Enterprise Architect",
  "Technical Architect",
  "Application Architect",
  "Cloud Solutions Architect",
  "Implementation Architect",
  "Business Systems Analyst",
  "Systems Analyst",
  "IT Analyst",
  "Process Analyst",
  "Operations Analyst",
  "Revenue Operations Analyst",
  "Sales Operations Analyst",
  "Marketing Operations Analyst",
  "Customer Operations Analyst",
  "Operations Manager",
  "Business Operations Manager",
  "Strategy and Operations Manager",
  "Revenue Operations Manager",
  "Sales Operations Manager",
  "Marketing Operations Manager",
  "Customer Operations Manager",
  "Commercial Operations Manager",
  "Service Delivery Manager",
  "Business Process Manager",
  "Continuous Improvement Manager",
  "Change Manager",
  "Change Management Specialist",
  "Organizational Development Specialist",
  "Innovation Manager",
  "New Ventures Manager",
  "Corporate Strategy Manager",
  "Corporate Development Associate",
  "Corporate Development Manager",
  "Product Operations Manager",
  "Product Operations Specialist",
  "Product Enablement Manager",
  "Product Specialist",
  "Technical Product Specialist",
  "Solutions Specialist",
  "Platform Specialist",
  "Implementation Specialist",
  "Channel Partner Manager",
  "Partner Account Manager",
  "Alliances Manager",
  "Ecosystem Manager",
  "Vendor Manager",
  "Category Manager",
  "Portfolio Manager (Non-Financial / Product Portfolio)",
  "Service Manager",
  "Service Owner",
  "Capability Owner",
  "Feature Owner",
  "Domain Owner",
  "Business Owner (Internal Product/Platform)",
  "Platform Owner",
  "Product Line Manager",
  "Category Product Manager (Retail/CPG)",
  "Merchandising Manager",
  "E-commerce Manager",
  "Online Merchandise Manager",
  "Digital Experience Manager",
  "Web Product Owner",
  "Mobile App Owner",
  "UX Designer",
  "UI Designer",
  "Product Designer",
  "Interaction Designer",
  "Experience Designer",
  "Service Designer",
  "Information Architect",
  "Design Lead",
  "Design Manager",
  "Creative Strategist",
  "UX Lead",
  "UX Writer",
  "Content Designer",
  "Content Strategist",
  "Technical Writer",
  "Documentation Specialist",
  "Knowledge Management Specialist",
  "Learning Experience Designer",
  "Instructional Designer",
  "Release Manager",
  "Release Train Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",
  "Platform Engineer",
  "Infrastructure Engineer",
  "Automation Engineer",
  "Build and Release Engineer",
  "Software Engineer",
  "Backend Engineer",
  "Frontend Engineer",
  "Full Stack Engineer",
  "Mobile Engineer",
  "iOS Engineer",
  "Android Engineer",
  "Web Engineer",
  "Application Engineer",
  "Integration Engineer",
  "Implementation Engineer",
  "Embedded Software Engineer",
  "Firmware Engineer",
  "QA Engineer",
  "Quality Assurance Engineer",
  "Test Engineer",
  "Automation Test Engineer",
  "Quality Engineer",
  "Security Engineer",
  "Application Security Engineer",
  "Data Engineer",
  "Analytics Engineer",
  "Machine Learning Engineer",
  "ML Ops Engineer",
  "AI Engineer",
  "Data Scientist",
  "Applied Data Scientist",
  "Decision Scientist",
  "Quantitative Analyst (Tech / Product Analytics)",
  "Research Engineer",
  "Research Scientist (Applied / Product-Facing)",
  "Engineering Team Lead",
  "Technical Lead",
  "Lead Engineer",
  "Engineering Manager",
  "R&D Engineer",
  "R&D Project Manager",
  "Digital Product Owner (IT / Internal Tools)",
  "Intranet Product Owner",
  "Tools & Systems Product Owner",
  "Internal Tools Lead",
  "IT Service Manager",
  "IT Service Owner",
  "IT Portfolio Manager",
  "ERP Functional Consultant",
  "CRM Functional Consultant",
  "Salesforce Administrator",
  "Salesforce Consultant",
  "SAP Consultant",
  "Oracle Applications Consultant",
  "Workday Consultant",
  "HRIS Analyst",
  "HRIS Manager",
  "HR Technology Analyst",
  "HR Technology Manager",
  "Finance Systems Analyst",
  "Procurement Systems Analyst",
  "Supply Chain Systems Analyst",
  "E-commerce Product Owner",
  "Online Store Manager",
  "Marketplace Manager (e.g., Amazon, eBay)",
  "Digital Channel Manager",
  "Omnichannel Manager",
  "Retail Operations Manager (Digital Focused)",
  "Store Systems Manager",
  "Category Analyst (Retail / CPG)",
  "Trade Marketing Manager",
  "Shopper Insights Manager",
  "Healthcare Product Specialist",
  "Clinical Informatics Specialist",
  "Health IT Analyst",
  "EdTech Implementation Specialist",
  "Learning Technology Specialist",
  "Academy Program Manager (Internal Learning Platforms)",
  "Game Designer",
  "Game Producer",
  "Live Ops Manager (Gaming)",
  "Monetization Manager (Gaming / Apps)",
  "Ad Operations Manager",
  "Ad Tech Specialist",
  "Programmatic Advertising Specialist",
  "Platform Partnerships Manager (AdTech / MarTech)",
  "Content Operations Manager",
  "Editorial Operations Manager",
  "Media Operations Manager",
  "Localization Project Manager",
  "Localization Program Manager",
  "Localization Specialist",
  "Payments Operations Analyst",
  "Risk Operations Analyst",
  "Fraud Operations Analyst",
  "Trust and Safety Analyst",
  "Trust and Safety Operations Manager",
  "Policy Operations Specialist",
  "Marketplace Operations Manager",
  "Driver Operations Manager (Gig/Delivery Platforms)",
  "Courier Operations Manager",
  "Vendor Onboarding Specialist",
  "Seller Success Manager",
  "Creator Partnerships Manager",
  "Creator Success Manager",
  "Influencer Marketing Manager",
  "Platform Growth Manager",
  "Monetization Strategy Manager",
  "Pricing Analyst",
  "Pricing Manager",
  "Revenue Manager (Non-Financial Product)",
  "Yield Manager (AdTech / Media)",
  "Strategy and Planning Manager",
  "Chief of Staff (Product or Tech)",
  "Business Partner (Tech / Digital)",
  "Technology Business Manager",
  "Technical Account Manager",
  "Enterprise Account Manager",
  "Partner Success Manager",
  "Channel Success Manager",
  "Franchise Operations Manager",
  "Franchise Development Manager",
  "Product Trainer",
  "Solutions Trainer",
  "Customer Education Manager",
  "Developer Relations Engineer",
  "Developer Advocate",
  "Developer Evangelist",
  "API Evangelist",
  "Partner Solutions Architect",
  "Enterprise Customer Engineer",
  "Innovation Program Manager",
  "Incubation Program Manager",
  "Lab Manager (Innovation Lab / Digital Lab)",
  "Venture Architect",
  "Corporate Innovation Lead",
  "Digital Product Owner (Banking / Insurance)",
  "Channel Product Manager (Telecom / Utilities)",
  "Network Product Owner (Telecom)",
  "Tariff and Pricing Manager (Telecom / Utilities)",
  "Digital Channels Manager (Banking / Insurance)",
  "Self-Service Channel Manager",
  "Contact Center Technology Manager",
  "CRM Product Owner",
  "Customer 360 Product Owner",
  "Lead Management Owner",
  "Loyalty Program Manager",
  "Rewards Program Manager",
  "Membership Product Manager",
  "Subscription Manager",
  "Subscription Operations Manager",
  "Platform Governance Manager",
  "API Product Owner",
  "Integration Product Owner",
  "Data Product Owner",
  "Analytics Product Owner",
  "Experimentation Program Manager",
  "A/B Testing Specialist",
  "Personalization Specialist",
  "SEO Manager",
  "SEM Manager",
  "App Store Optimization Specialist",
  "Digital Analytics Manager",
  "Site Experience Manager",
  "Conversion Optimization Manager",
  "Journey Optimization Manager",
  "Customer Journey Manager",
  "Customer Experience Designer",
  "Service Delivery Product Owner",
  "Back Office Systems Product Owner",
  "Field Operations Manager (with apps/tools responsibility)",
  "Field Services Manager (with tools/platform focus)",
  "Logistics Technology Analyst",
  "Supply Chain Technology Analyst",
  "Warehouse Systems Analyst",
  "Transportation Management Systems Analyst",
  "Facilities Systems Manager",
  "IoT Solutions Engineer",
  "IoT Product Owner",
  "Smart Devices Program Manager",
  "Robotics Solutions Engineer",
  "Robotic Process Automation Analyst",
  "RPA Developer",
  "Automation Business Analyst",
  "Compliance Technology Analyst",
  "Regulatory Technology Analyst",
  "Legal Technology Analyst",
  "Knowledge Engineer",
  "Tax Technology Analyst",
  "Procurement Technology Manager",
  "Sourcing Technology Manager",
  "Learning Management System Administrator",
  "Digital Workplace Product Owner",
  "Collaboration Tools Product Owner",
  "Intranet Manager",
  "Knowledge Base Manager",
  "Helpdesk Manager (with tooling responsibility)",
  "Service Desk Manager (with tooling responsibility)",
  "Security Product Specialist (Non-PM)",
  "Identity and Access Management Analyst",
  "IAM Product Owner",
  "GRC Technology Analyst",
  "FinOps Analyst (Cloud Cost Management)",
  "FinOps Manager",
  "Innovation Facilitator",
  "Design Sprint Facilitator",
  "Agile Delivery Lead",
  "Tech Lead Manager",
  "Associate Product Owner",
  "Business Relationship Manager (IT / Tech)",
  "Line of Business Relationship Manager",
  "Startup Founder",
  "Co-founder",
  "Head of Operations (Early-Stage Startup)",
  "Head of Growth (Early-Stage Startup)",
  "Head of Customer Experience (Startup)",
  "General Manager (Business Unit / Country with digital focus)",
] as const;

export const PersonalInfoStep = ({ onNext, onBack }: PersonalInfoStepProps) => {
  const { progress, updateStep } = useOnboardingProgress();
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [careerStage, setCareerStage] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentSalary, setCurrentSalary] = useState<string>('');
  const [isCurrentRoleDropdownOpen, setIsCurrentRoleDropdownOpen] = useState<boolean>(false);
  const [highlightedRoleIndex, setHighlightedRoleIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved data on mount
  useEffect(() => {
    if (progress?.progress_data?.personal_info) {
      const saved = progress.progress_data.personal_info;
      if (saved.firstName) setFirstName(saved.firstName);
      if (saved.lastName) setLastName(saved.lastName);
      if (saved.careerStage) setCareerStage(saved.careerStage);
      if (saved.currentRole) setCurrentRole(saved.currentRole);
      if (saved.currentSalary) setCurrentSalary(saved.currentSalary.toString());
    }
  }, [progress]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrentRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRoleSuggestions = ROLE_SUGGESTIONS.filter((role) => {
    if (!currentRole) return true;
    return role.toLowerCase().includes(currentRole.toLowerCase());
  }).slice(0, 10);

  const handleCurrentRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setCurrentRole(nextValue);
    setIsCurrentRoleDropdownOpen(true);
    setHighlightedRoleIndex(null);
  };

  const handleSelectCurrentRole = (role: string) => {
    setCurrentRole(role);
    setIsCurrentRoleDropdownOpen(false);
    setHighlightedRoleIndex(null);
  };

  const handleCurrentRoleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredRoleSuggestions.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsCurrentRoleDropdownOpen(true);
      setHighlightedRoleIndex((prevIndex) => {
        if (prevIndex === null) return 0;
        return prevIndex + 1 >= filteredRoleSuggestions.length ? 0 : prevIndex + 1;
      });
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsCurrentRoleDropdownOpen(true);
      setHighlightedRoleIndex((prevIndex) => {
        if (prevIndex === null) return filteredRoleSuggestions.length - 1;
        return prevIndex - 1 < 0 ? filteredRoleSuggestions.length - 1 : prevIndex - 1;
      });
      return;
    }

    if (event.key === 'Enter' && highlightedRoleIndex !== null) {
      event.preventDefault();
      const selectedRole = filteredRoleSuggestions[highlightedRoleIndex];
      if (selectedRole) handleSelectCurrentRole(selectedRole);
      return;
    }

    if (event.key === 'Escape') {
      setIsCurrentRoleDropdownOpen(false);
      setHighlightedRoleIndex(null);
    }
  };

  const canProceed = firstName !== '' && lastName !== '' && careerStage !== '' && currentRole !== '';

  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!firstName) missing.push('First Name');
    if (!lastName) missing.push('Last Name');
    if (!careerStage) missing.push('Current Situation');
    if (!currentRole) missing.push('Current Role/Title');
    return missing;
  };

  const missingFields = getMissingFields();

  const handleContinue = useCallback(async () => {
    if (!canProceed || isSaving) return;

    setIsSaving(true);
    try {
      const stepData = {
        firstName,
        lastName,
        careerStage,
        currentRole,
        currentSalary: currentSalary ? parseInt(currentSalary, 10) : undefined,
      };

      // Save to database
      await updateStep('personal_info', stepData);

      // Track Amplitude event
      trackEvent('Onboarding Step Completed', {
        'Step': 'personal_info',
        'Step Name': 'Personal Info',
        'Career Stage': careerStage,
        'Current Role': currentRole,
        'Has Salary': !!currentSalary,
      });

      onNext();
    } catch (error) {
      console.error('Error saving personal info:', error);
    } finally {
      setIsSaving(false);
    }
  }, [canProceed, isSaving, firstName, lastName, careerStage, currentRole, currentSalary, updateStep, onNext]);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 md:mb-4">
          Tell Us About Yourself
        </h2>
        <p className="text-base md:text-lg text-gray-700 font-semibold">
          We'll personalize your experience based on your situation.
        </p>
      </div>

      <div className="space-y-6 md:space-y-8">
        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label htmlFor="firstName" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
              required
            />
          </div>
        </div>

        {/* Career Stage */}
        <div>
          <label className="block text-base md:text-lg font-bold text-gray-900 mb-4">
            What's your current situation? *
          </label>
          <div className="space-y-3">
            {CAREER_STAGES.map((stage) => (
              <label
                key={stage.value}
                className={`flex items-center p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  careerStage === stage.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <input
                  type="radio"
                  name="careerStage"
                  value={stage.value}
                  checked={careerStage === stage.value}
                  onChange={(e) => setCareerStage(e.target.value)}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-3 text-gray-900 font-semibold">
                  {stage.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Current Role */}
        <div className="relative" ref={dropdownRef}>
          <label htmlFor="currentRole" className="block text-base md:text-lg font-bold text-gray-900 mb-2">
            Current Role/Title *
          </label>
          <input
            id="currentRole"
            type="text"
            value={currentRole}
            onChange={handleCurrentRoleChange}
            placeholder="Software Engineer, Product Manager, etc."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            required
            aria-required="true"
            aria-autocomplete="list"
            aria-expanded={isCurrentRoleDropdownOpen}
            aria-controls="currentRole-suggestions"
            onFocus={() => setIsCurrentRoleDropdownOpen(true)}
            onKeyDown={handleCurrentRoleKeyDown}
          />
          {isCurrentRoleDropdownOpen && filteredRoleSuggestions.length > 0 && (
            <ul
              id="currentRole-suggestions"
              role="listbox"
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              {filteredRoleSuggestions.map((role, index) => {
                const isHighlighted = highlightedRoleIndex === index;
                return (
                  <li key={role} role="option" aria-selected={isHighlighted}>
                    <button
                      type="button"
                      className={`flex w-full items-center px-4 py-2 text-left text-sm font-semibold ${
                        isHighlighted ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50 text-gray-800'
                      }`}
                      onClick={() => handleSelectCurrentRole(role)}
                      aria-label={`Select role ${role}`}
                    >
                      {role}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Current Salary (Optional) */}
        <div>
          <label htmlFor="currentSalary" className="flex items-center justify-between w-full text-base md:text-lg font-bold text-gray-900 mb-2">
            <span>Current Salary (Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">
              $
            </span>
            <input
              id="currentSalary"
              type="number"
              value={currentSalary}
              onChange={(e) => setCurrentSalary(e.target.value)}
              placeholder="100000"
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-semibold"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            This helps us provide better salary guidance. Your information is private.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:items-center sm:justify-between">
        <div
          className="relative w-full sm:w-auto"
          onMouseEnter={() => !canProceed && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <button
            onClick={handleContinue}
            disabled={!canProceed || isSaving}
            className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-black rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
          >
            {isSaving ? 'Saving...' : 'Continue →'}
          </button>
          {showTooltip && !canProceed && missingFields.length > 0 && (
            <div className="absolute bottom-full right-0 mb-2 px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg shadow-xl z-50 min-w-[200px] sm:min-w-[250px]">
              <div className="flex items-start">
                <span className="mr-2">!</span>
                <div>
                  <p className="font-bold mb-1">Please complete the following:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {missingFields.map((field) => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
        {onBack && (
          <div className="flex justify-start">
            <button
              onClick={onBack}
              className="px-4 md:px-6 py-3 text-gray-600 font-bold hover:text-gray-800 transition-colors text-sm md:text-base"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
