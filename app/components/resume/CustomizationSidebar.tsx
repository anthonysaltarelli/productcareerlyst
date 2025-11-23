"use client";

import { useState, useRef } from "react";
import { ResumeStyles, defaultResumeStyles, ResumeVersion, resumeFonts } from "./mockData";
import { trackEvent } from "@/lib/amplitude/client";
import { getUserPlanClient } from "@/lib/utils/resume-tracking";

type Props = {
  styles: ResumeStyles;
  onStyleChange: (styles: ResumeStyles) => void;
  onExportPDF: () => void;
  onExportDocx: () => void;
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  onBack: () => void;
  selectedVersion: string;
  versions: ResumeVersion[];
  isExportingPDF?: boolean;
  isExportingDocx?: boolean;
};

export default function CustomizationSidebar({ styles, onStyleChange, onExportPDF, onExportDocx, viewMode, onViewModeChange, onBack, selectedVersion, versions, isExportingPDF = false, isExportingDocx = false }: Props) {
  const currentVersion = versions.find((v) => v.id === selectedVersion);
  const [isFontSectionExpanded, setIsFontSectionExpanded] = useState<boolean>(false);
  const previousStylesRef = useRef<ResumeStyles>(styles);

  // Map font names to CSS variables for preview
  const getFontVariable = (fontName: string): string => {
    const fontMap: Record<string, string> = {
      'Inter': 'var(--font-inter)',
      'Lato': 'var(--font-lato)',
      'Roboto': 'var(--font-roboto)',
      'Open Sans': 'var(--font-open-sans)',
      'Source Sans 3': 'var(--font-source-sans)',
      'PT Serif': 'var(--font-pt-serif)',
      'Crimson Text': 'var(--font-crimson-text)',
    };
    return fontMap[fontName] || fontName;
  };

  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      {/* Resume Name Header & View Mode Switcher */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
            aria-label="Back to resumes"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {currentVersion?.name}
            </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1.5 border border-slate-200">
          <button
            onClick={() => onViewModeChange("edit")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "edit"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Edit
          </button>
          <button
            onClick={() => onViewModeChange("preview")}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              viewMode === "preview"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-base font-bold text-gray-900">Customize Resume</h2>
        <p className="text-xs text-gray-600 mt-0.5">Adjust styling & export</p>
      </div>

      {/* Customization Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Font Family */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Font Family</label>
          <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setIsFontSectionExpanded(!isFontSectionExpanded)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-all flex items-center justify-between"
              aria-label="Toggle font selection"
            >
              <span className="text-sm font-semibold text-gray-700">{styles.fontFamily}</span>
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  isFontSectionExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
             {isFontSectionExpanded && (
               <div className="p-2 space-y-2 bg-white max-h-80 overflow-y-auto">
                 {resumeFonts.map((font) => (
                   <button
                     key={font.name}
                     onClick={async () => {
                       const previousFont = styles.fontFamily;
                       onStyleChange({ ...styles, fontFamily: font.name });
                       
                       // Track font change
                       if (previousFont !== font.name) {
                         const userPlan = await getUserPlanClient();
                         trackEvent('User Changed Resume Font', {
                           'Resume Version ID': selectedVersion,
                           'Previous Font': previousFont,
                           'New Font': font.name,
                           'User Plan': userPlan,
                         });
                       }
                     }}
                     className={`w-full px-4 py-2.5 rounded-lg border-2 transition-all text-left ${
                       styles.fontFamily === font.name
                         ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                         : 'border-slate-200 bg-white text-gray-700 hover:border-blue-300'
                     }`}
                     style={{ fontFamily: getFontVariable(font.name) }}
                   >
                     {font.name}
                   </button>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Font Size: {styles.fontSize}pt
          </label>
          <input
            type="range"
            min="9"
            max="13"
            step="0.5"
            value={styles.fontSize}
            onChange={async (e) => {
              const previousSize = styles.fontSize;
              const newSize = parseFloat(e.target.value);
              onStyleChange({ ...styles, fontSize: newSize });
              
              // Track font size change (debounced)
              if (previousSize !== newSize) {
                setTimeout(async () => {
                  const userPlan = await getUserPlanClient();
                  trackEvent('User Changed Resume Font Size', {
                    'Resume Version ID': selectedVersion,
                    'Previous Font Size': previousSize,
                    'New Font Size': newSize,
                    'User Plan': userPlan,
                  });
                }, 500);
              }
            }}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>9pt</span>
            <span>13pt</span>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Line Height: {styles.lineHeight}
          </label>
          <input
            type="range"
            min="1.0"
            max="1.5"
            step="0.05"
            value={styles.lineHeight}
            onChange={async (e) => {
              const previousHeight = styles.lineHeight;
              const newHeight = parseFloat(e.target.value);
              onStyleChange({ ...styles, lineHeight: newHeight });
              
              // Track line height change (debounced)
              if (previousHeight !== newHeight) {
                setTimeout(async () => {
                  const userPlan = await getUserPlanClient();
                  trackEvent('User Changed Resume Line Height', {
                    'Resume Version ID': selectedVersion,
                    'Previous Line Height': previousHeight,
                    'New Line Height': newHeight,
                    'User Plan': userPlan,
                  });
                }, 500);
              }
            }}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Tight</span>
            <span>Loose</span>
          </div>
        </div>

        {/* Margins */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Margins (inches)</label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-2">Top/Bottom: {styles.marginTop}"</label>
              <input
                type="range"
                min="0.25"
                max="1.5"
                step="0.25"
                value={styles.marginTop}
                onChange={async (e) => {
                  const previousMargin = styles.marginTop;
                  const val = parseFloat(e.target.value);
                  onStyleChange({ ...styles, marginTop: val, marginBottom: val });
                  
                  // Track margin change (debounced)
                  if (previousMargin !== val) {
                    setTimeout(async () => {
                      const userPlan = await getUserPlanClient();
                      trackEvent('User Changed Resume Margins', {
                        'Resume Version ID': selectedVersion,
                        'Margin Type': 'top_bottom',
                        'Previous Margin Value': previousMargin,
                        'New Margin Value': val,
                        'User Plan': userPlan,
                      });
                    }, 500);
                  }
                }}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Left/Right: {styles.marginLeft}"</label>
              <input
                type="range"
                min="0.25"
                max="1.5"
                step="0.25"
                value={styles.marginLeft}
                onChange={async (e) => {
                  const previousMargin = styles.marginLeft;
                  const val = parseFloat(e.target.value);
                  onStyleChange({ ...styles, marginLeft: val, marginRight: val });
                  
                  // Track margin change (debounced)
                  if (previousMargin !== val) {
                    setTimeout(async () => {
                      const userPlan = await getUserPlanClient();
                      trackEvent('User Changed Resume Margins', {
                        'Resume Version ID': selectedVersion,
                        'Margin Type': 'left_right',
                        'Previous Margin Value': previousMargin,
                        'New Margin Value': val,
                        'User Plan': userPlan,
                      });
                    }, 500);
                  }
                }}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={async () => {
            onStyleChange(defaultResumeStyles);
            
            // Track reset styles
            const userPlan = await getUserPlanClient();
            trackEvent('User Reset Resume Styles', {
              'Resume Version ID': selectedVersion,
              'User Plan': userPlan,
            });
          }}
          className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all border border-slate-200"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Export Actions */}
      <div className="p-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 space-y-2.5">
        <button
          onClick={onExportPDF}
          disabled={isExportingPDF || isExportingDocx}
          className={`w-full px-4 py-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
            isExportingPDF || isExportingDocx
              ? 'opacity-75 cursor-not-allowed'
              : 'hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg'
          }`}
        >
          {isExportingPDF ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Export PDF
            </>
          )}
        </button>

        <button
          onClick={onExportDocx}
          disabled={isExportingPDF || isExportingDocx}
          className={`w-full px-4 py-2.5 bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
            isExportingPDF || isExportingDocx
              ? 'opacity-75 cursor-not-allowed'
              : 'hover:from-purple-600 hover:to-pink-600 hover:shadow-lg'
          }`}
        >
          {isExportingDocx ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating DOCX...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export DOCX
            </>
          )}
        </button>
      </div>
    </div>
  );
}

