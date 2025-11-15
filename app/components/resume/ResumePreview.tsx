"use client";

import { useEffect, useRef, useState } from "react";
import { 
  mockExperiences, 
  mockContactInfo, 
  mockSummary, 
  mockEducation, 
  mockSkills,
  ResumeStyles,
  defaultResumeStyles 
} from "./mockData";

type Props = {
  styles?: ResumeStyles;
};

export default function ResumePreview({ styles = defaultResumeStyles }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [pageBreaks, setPageBreaks] = useState<number[]>([]);

  // Map font names to CSS variables for Google Fonts
  const getFontFamily = (fontName: string): string => {
    const fontMap: Record<string, string> = {
      'Inter': 'var(--font-inter)',
      'Lato': 'var(--font-lato)',
      'Roboto': 'var(--font-roboto)',
      'Open Sans': 'var(--font-open-sans)',
      'Source Sans 3': 'var(--font-source-sans)',
      'Merriweather': 'var(--font-merriweather)',
      'PT Serif': 'var(--font-pt-serif)',
      'Crimson Text': 'var(--font-crimson-text)',
    };
    
    // If it's a Google Font, use the CSS variable
    if (fontMap[fontName]) {
      return `${fontMap[fontName]}, sans-serif`;
    }
    
    // Otherwise, use the font name directly (web-safe fonts)
    return `"${fontName}", sans-serif`;
  };

  // Generate CSS variables from style config
  const cssVars = {
    '--resume-font-family': getFontFamily(styles.fontFamily),
    '--resume-font-size': `${styles.fontSize}pt`,
    '--resume-line-height': styles.lineHeight,
    '--resume-margin-top': `${styles.marginTop}in`,
    '--resume-margin-bottom': `${styles.marginBottom}in`,
    '--resume-margin-left': `${styles.marginLeft}in`,
    '--resume-margin-right': `${styles.marginRight}in`,
    '--resume-accent-color': styles.accentColor,
    '--resume-heading-color': styles.headingColor,
    '--resume-text-color': styles.textColor,
  } as React.CSSProperties;

  // Filter only selected bullets for preview
  const selectedExperiences = mockExperiences.map(exp => ({
    ...exp,
    bullets: exp.bullets.filter(b => b.isSelected),
  })).filter(exp => exp.bullets.length > 0);

  // Calculate where page breaks should occur
  useEffect(() => {
    if (!contentRef.current) return;

    const calculatePageBreaks = () => {
      const content = contentRef.current;
      if (!content) return;

      const pageHeightInches = 11;
      const marginTop = styles.marginTop;
      const marginBottom = styles.marginBottom;
      const contentHeightPerPage = pageHeightInches - marginTop - marginBottom;
      const pixelsPerInch = 96;
      const contentHeightPerPagePx = contentHeightPerPage * pixelsPerInch;

      const totalHeight = content.scrollHeight;
      const breaks: number[] = [];
      
      // Calculate break points
      for (let i = 1; i * contentHeightPerPagePx < totalHeight; i++) {
        breaks.push(i * contentHeightPerPagePx);
      }
      
      setPageBreaks(breaks);
    };

    const timer = setTimeout(calculatePageBreaks, 100);
    return () => clearTimeout(timer);
  }, [styles, selectedExperiences]);

  const renderResumeContent = () => (
    <>
      {/* Contact Information */}
      <header className="resume-header">
        <h1 className="resume-name">{mockContactInfo.name}</h1>
        <div className="resume-contact-info">
          <span className="resume-contact-item">{mockContactInfo.location}</span>
          <span className="resume-contact-item">
            <span className="resume-separator">•</span>
            {mockContactInfo.phone}
          </span>
          <span className="resume-contact-item">
            <span className="resume-separator">•</span>
            <a href={`mailto:${mockContactInfo.email}`} className="resume-link">{mockContactInfo.email}</a>
          </span>
          <span className="resume-contact-item">
            <span className="resume-separator">•</span>
            <a href={`https://${mockContactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="resume-link">{mockContactInfo.linkedin}</a>
          </span>
          <span className="resume-contact-item">
            <span className="resume-separator">•</span>
            <a href={`https://${mockContactInfo.portfolio}`} target="_blank" rel="noopener noreferrer" className="resume-link">{mockContactInfo.portfolio}</a>
          </span>
        </div>
      </header>

      {/* Professional Summary */}
      {mockSummary && (
        <section className="resume-section">
          <h2 className="resume-section-heading">PROFESSIONAL SUMMARY</h2>
          <div className="resume-section-divider"></div>
          <p className="resume-summary">{mockSummary}</p>
        </section>
      )}

      {/* Work Experience */}
      {selectedExperiences.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-heading">PROFESSIONAL EXPERIENCE</h2>
          <div className="resume-section-divider"></div>
          {selectedExperiences.map((exp) => (
            <div key={exp.id} className="resume-experience-item">
              <div className="resume-experience-header">
                <div className="resume-experience-title-group">
                  <h3 className="resume-experience-title">{exp.title}</h3>
                  <span className="resume-experience-company">{exp.company}</span>
                </div>
                <div className="resume-experience-meta">
                  <span className="resume-experience-location">{exp.location}</span>
                  <span className="resume-experience-dates">{exp.startDate} - {exp.endDate}</span>
                </div>
              </div>
              <ul className="resume-bullets">
                {exp.bullets.map((bullet) => (
                  <li key={bullet.id} className="resume-bullet">
                    {bullet.content}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {mockEducation.length > 0 && (
        <section className="resume-section">
          <h2 className="resume-section-heading">EDUCATION</h2>
          <div className="resume-section-divider"></div>
          {mockEducation.map((edu) => (
            <div key={edu.id} className="resume-education-item">
              <div className="resume-experience-header">
                <div className="resume-experience-title-group">
                  <h3 className="resume-experience-title">{edu.school}</h3>
                  <span className="resume-experience-company">
                    {edu.degree} - {edu.field}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </span>
                </div>
                <div className="resume-experience-meta">
                  <span className="resume-experience-location">{edu.location}</span>
                  <span className="resume-experience-dates">{edu.startDate} - {edu.endDate}</span>
                </div>
              </div>
              {edu.achievements && edu.achievements.length > 0 && (
                <ul className="resume-bullets">
                  {edu.achievements.map((achievement, idx) => (
                    <li key={idx} className="resume-bullet">
                      {achievement}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Skills */}
      {mockSkills && (
        <section className="resume-section">
          <h2 className="resume-section-heading">SKILLS</h2>
          <div className="resume-section-divider"></div>
          <div className="resume-skills">
            {mockSkills.technical && mockSkills.technical.length > 0 && (
              <div className="resume-skill-group">
                <span className="resume-skill-category">Technical:</span>
                <span className="resume-skill-list">{mockSkills.technical.join(', ')}</span>
              </div>
            )}
            {mockSkills.product && mockSkills.product.length > 0 && (
              <div className="resume-skill-group">
                <span className="resume-skill-category">Product Management:</span>
                <span className="resume-skill-list">{mockSkills.product.join(', ')}</span>
              </div>
            )}
            {mockSkills.soft && mockSkills.soft.length > 0 && (
              <div className="resume-skill-group">
                <span className="resume-skill-category">Leadership:</span>
                <span className="resume-skill-list">{mockSkills.soft.join(', ')}</span>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );

  const numPages = pageBreaks.length + 1;

  return (
    <>
      <style jsx global>{`
        /* Container for all pages */
        .resume-pages-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Single continuous content container */
        .resume-continuous-wrapper {
          width: 8.5in;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          position: relative;
        }

        .resume-content-flow {
          font-family: var(--resume-font-family);
          font-size: var(--resume-font-size);
          line-height: var(--resume-line-height);
          color: var(--resume-text-color);
          padding: var(--resume-margin-top) var(--resume-margin-right) var(--resume-margin-bottom) var(--resume-margin-left);
        }

        /* Visual page break indicator */
        .page-break-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            #cbd5e1 10%, 
            #94a3b8 50%, 
            #cbd5e1 90%, 
            transparent 100%
          );
          z-index: 10;
          pointer-events: none;
        }

        .page-break-label {
          position: absolute;
          right: -120px;
          top: -12px;
          background: #475569;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        /* Header Styles */
        .resume-header {
          text-align: center;
          margin-bottom: 0.25in;
        }

        .resume-name {
          font-size: calc(var(--resume-font-size) * 2);
          font-weight: 700;
          color: var(--resume-heading-color);
          margin: 0 0 0.08in 0;
          letter-spacing: 0.5px;
        }

        .resume-contact-info {
          font-size: calc(var(--resume-font-size) * 0.9);
          margin: 0.04in 0;
          color: var(--resume-text-color);
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 0;
        }

        .resume-contact-item {
          display: inline-block;
          white-space: nowrap;
        }

        .resume-link {
          color: var(--resume-text-color);
          text-decoration: none;
        }

        .resume-link:hover {
          text-decoration: underline;
        }

        .resume-separator {
          margin: 0 0.1in;
          color: #000000;
        }

        /* Section Styles */
        .resume-section {
          margin-bottom: 0.2in;
          page-break-inside: avoid;
        }

        .resume-section-heading {
          font-size: var(--resume-font-size);
          font-weight: 700;
          color: #000000;
          margin: 0 0 0.02in 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .resume-section-divider {
          height: 1px;
          background-color: #000000;
          margin-bottom: 0.1in;
        }

        /* Summary Styles */
        .resume-summary {
          margin: 0;
          text-align: justify;
        }

        /* Experience Styles */
        .resume-experience-item {
          margin-bottom: 0.18in;
          page-break-inside: avoid;
        }

        .resume-experience-item:last-child {
          margin-bottom: 0;
        }

        .resume-experience-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.08in;
        }

        .resume-experience-title-group {
          flex: 1;
        }

        .resume-experience-title {
          font-size: calc(var(--resume-font-size) * 1.05);
          font-weight: 700;
          color: var(--resume-heading-color);
          margin: 0 0 0.02in 0;
        }

        .resume-experience-company {
          font-weight: 600;
          color: var(--resume-text-color);
          display: block;
        }

        .resume-experience-meta {
          text-align: right;
          flex-shrink: 0;
        }

        .resume-experience-location {
          display: block;
          font-size: calc(var(--resume-font-size) * 0.95);
          font-style: italic;
        }

        .resume-experience-dates {
          display: block;
          font-size: calc(var(--resume-font-size) * 0.95);
          font-weight: 600;
          color: var(--resume-text-color);
        }

        /* Bullets Styles */
        .resume-bullets {
          margin: 0;
          padding-left: 0.25in;
          list-style-type: disc;
        }

        .resume-bullet {
          margin-bottom: 0.06in;
          padding-left: 0.02in;
        }

        .resume-bullet:last-child {
          margin-bottom: 0;
        }

        /* Education Styles */
        .resume-education-item {
          margin-bottom: 0.18in;
          page-break-inside: avoid;
        }

        .resume-education-item:last-child {
          margin-bottom: 0;
        }

        /* Skills Styles */
        .resume-skills {
          display: flex;
          flex-direction: column;
          gap: 0.08in;
        }

        .resume-skill-group {
          display: flex;
          gap: 0.1in;
        }

        .resume-skill-category {
          font-weight: 700;
          color: var(--resume-heading-color);
          flex-shrink: 0;
          min-width: 1.5in;
        }

        .resume-skill-list {
          flex: 1;
        }

        /* Print Media Queries - Optimized for PDF export */
        @media print {
          .resume-pages-wrapper {
            display: block;
          }

          .resume-continuous-wrapper {
            box-shadow: none;
          }

          .page-break-line,
          .page-break-label,
          .page-indicator {
            display: none !important;
          }

          .resume-content-flow {
            padding: 0.5in 0.75in;
          }

          /* Ensure sections don't break across pages */
          .resume-section,
          .resume-experience-item,
          .resume-education-item {
            page-break-inside: avoid;
          }

          @page {
            margin: 0;
            size: letter;
          }
        }
      `}</style>

      <div className="resume-pages-wrapper">
        {/* Continuous content with visual page breaks */}
        <div className="resume-continuous-wrapper" style={cssVars}>
          <div 
            ref={contentRef}
            className="resume-content-flow"
          >
            {renderResumeContent()}
          </div>

          {/* Visual page break indicators */}
          {pageBreaks.map((breakPoint, index) => (
            <div 
              key={index}
              className="page-break-line"
              style={{ top: `${breakPoint}px` }}
            >
              <div className="page-break-label">
                Page {index + 2} starts here
              </div>
            </div>
          ))}
        </div>

        {/* Page indicator below */}
        <div className="text-center py-3 text-sm font-medium text-gray-500 page-indicator">
          {numPages === 1 ? 'Single page resume' : `${numPages} pages total`}
        </div>
      </div>
    </>
  );
}
