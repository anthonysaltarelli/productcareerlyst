"use client";

import { ResumeStyles, defaultResumeStyles } from "./mockData";

type Props = {
  styles: ResumeStyles;
  onStyleChange: (styles: ResumeStyles) => void;
  onExportPDF: () => void;
  onExportDocx: () => void;
};

export default function CustomizationSidebar({ styles, onStyleChange, onExportPDF, onExportDocx }: Props) {
  return (
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-bold text-gray-900">Customize Resume</h2>
        <p className="text-sm text-gray-600 mt-1">Adjust styling & export</p>
      </div>

      {/* Customization Options */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Font Family */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Font Family</label>
          <div className="space-y-2">
            {(['Arial', 'Calibri', 'Georgia'] as const).map((font) => (
              <button
                key={font}
                onClick={() => onStyleChange({ ...styles, fontFamily: font })}
                className={`w-full px-4 py-3 rounded-xl border-2 font-semibold transition-all text-left ${
                  styles.fontFamily === font
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
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
            onChange={(e) => onStyleChange({ ...styles, fontSize: parseFloat(e.target.value) })}
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
            onChange={(e) => onStyleChange({ ...styles, lineHeight: parseFloat(e.target.value) })}
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
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onStyleChange({ ...styles, marginTop: val, marginBottom: val });
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
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onStyleChange({ ...styles, marginLeft: val, marginRight: val });
                }}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Accent Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={styles.accentColor}
              onChange={(e) => onStyleChange({ ...styles, accentColor: e.target.value })}
              className="w-16 h-16 rounded-xl border-2 border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={styles.accentColor}
              onChange={(e) => onStyleChange({ ...styles, accentColor: e.target.value })}
              className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl font-mono text-sm"
              placeholder="#2563eb"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => onStyleChange(defaultResumeStyles)}
          className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all border border-slate-200"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Export Actions */}
      <div className="p-6 border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 space-y-3">
        <button
          onClick={onExportPDF}
          className="w-full px-4 py-3 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Export PDF
        </button>

        <button
          onClick={onExportDocx}
          className="w-full px-4 py-3 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export DOCX
        </button>
      </div>
    </div>
  );
}

