"use client";

import { 
  ResumeData,
  ResumeStyles,
  defaultResumeStyles 
} from "./mockData";

type Props = {
  styles?: ResumeStyles;
  resumeData: ResumeData;
};

export default function ResumePreview({ styles = defaultResumeStyles, resumeData }: Props) {
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
  const selectedExperiences = resumeData.experiences.map(exp => ({
    ...exp,
    bullets: exp.bullets.filter(b => b.isSelected),
  })).filter(exp => exp.bullets.length > 0);

  // Group experiences by roleGroupId
  const groupExperiencesByRole = (experiences: typeof selectedExperiences) => {
    const groups: Map<string | null, typeof selectedExperiences> = new Map();
    const standalone: typeof selectedExperiences = [];

    experiences.forEach(exp => {
      if (exp.roleGroupId) {
        if (!groups.has(exp.roleGroupId)) {
          groups.set(exp.roleGroupId, []);
        }
        groups.get(exp.roleGroupId)!.push(exp);
      } else {
        standalone.push(exp);
      }
    });

    return { groups, standalone };
  };

  const { groups, standalone } = groupExperiencesByRole(selectedExperiences);
  const displayMode = styles.experienceDisplayMode || 'by_role';

  return (
    <>
      <style jsx global>{`
        /* Resume Container */
        .resume-preview-wrapper {
          width: 8.5in;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .resume-preview-content {
          font-family: var(--resume-font-family);
          font-size: var(--resume-font-size);
          line-height: var(--resume-line-height);
          color: var(--resume-text-color);
          padding: var(--resume-margin-top) var(--resume-margin-right) var(--resume-margin-bottom) var(--resume-margin-left);
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
          .resume-preview-wrapper {
            box-shadow: none;
          }

          .resume-preview-content {
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

      <div className="resume-preview-wrapper" style={cssVars}>
        <div className="resume-preview-content">
          {/* Contact Information */}
          <header className="resume-header">
            <h1 className="resume-name">{resumeData.contactInfo.name}</h1>
            <div className="resume-contact-info">
              <span className="resume-contact-item">{resumeData.contactInfo.location}</span>
              <span className="resume-contact-item">
                <span className="resume-separator">•</span>
                {resumeData.contactInfo.phone}
              </span>
              <span className="resume-contact-item">
                <span className="resume-separator">•</span>
                <a href={`mailto:${resumeData.contactInfo.email}`} className="resume-link">{resumeData.contactInfo.email}</a>
              </span>
              <span className="resume-contact-item">
                <span className="resume-separator">•</span>
                <a href={`https://${resumeData.contactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="resume-link">{resumeData.contactInfo.linkedin}</a>
              </span>
              <span className="resume-contact-item">
                <span className="resume-separator">•</span>
                <a href={`https://${resumeData.contactInfo.portfolio}`} target="_blank" rel="noopener noreferrer" className="resume-link">{resumeData.contactInfo.portfolio}</a>
              </span>
            </div>
          </header>

          {/* Professional Summary */}
          {resumeData.summary && (
            <section className="resume-section">
              <h2 className="resume-section-heading">PROFESSIONAL SUMMARY</h2>
              <div className="resume-section-divider"></div>
              <p className="resume-summary">{resumeData.summary}</p>
            </section>
          )}

          {/* Work Experience */}
          {(groups.size > 0 || standalone.length > 0) && (
            <section className="resume-section">
              <h2 className="resume-section-heading">PROFESSIONAL EXPERIENCE</h2>
              <div className="resume-section-divider"></div>
              
              {/* Render grouped experiences */}
              {Array.from(groups.entries()).map(([groupId, groupExps]) => {
                const company = groupExps[0].company;
                const location = groupExps[0].location;
                const sortedExps = [...groupExps].sort((a, b) => {
                  if (a.startDate && b.startDate) {
                    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                  }
                  return 0;
                });

                if (displayMode === 'by_role') {
                  // Mode 1: Company header, then each role with its bullets
                  return (
                    <div key={groupId} className="resume-experience-item">
                      <div className="resume-experience-header">
                        <div className="resume-experience-title-group">
                          <h3 className="resume-experience-title">{company}</h3>
                          {location && <span className="resume-experience-company">{location}</span>}
                        </div>
                      </div>
                      {sortedExps.map((exp) => (
                        <div key={exp.id} style={{ marginTop: '0.1in', marginBottom: '0.1in' }}>
                          <div style={{ marginBottom: '0.05in' }}>
                            <strong style={{ fontSize: 'calc(var(--resume-font-size) * 1.02)' }}>{exp.title}</strong>
                            <span style={{ marginLeft: '0.1in', fontSize: 'calc(var(--resume-font-size) * 0.95)' }}>
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          <ul className="resume-bullets" style={{ marginLeft: '0.15in' }}>
                            {exp.bullets.map((bullet) => (
                              <li key={bullet.id} className="resume-bullet">
                                {bullet.content}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Mode 2: Company header, all titles stacked, then all bullets
                  const allBullets = sortedExps.flatMap(exp => 
                    exp.bullets.map(bullet => ({ ...bullet, roleTitle: exp.title }))
                  );

                  return (
                    <div key={groupId} className="resume-experience-item">
                      <div className="resume-experience-header">
                        <div className="resume-experience-title-group">
                          <h3 className="resume-experience-title">{company}</h3>
                          {location && <span className="resume-experience-company">{location}</span>}
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.08in' }}>
                        {sortedExps.map((exp, idx) => (
                          <div key={exp.id} style={{ marginBottom: idx < sortedExps.length - 1 ? '0.03in' : '0' }}>
                            <strong style={{ fontSize: 'calc(var(--resume-font-size) * 1.02)' }}>{exp.title}</strong>
                            <span style={{ marginLeft: '0.1in', fontSize: 'calc(var(--resume-font-size) * 0.95)' }}>
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                        ))}
                      </div>
                      <ul className="resume-bullets">
                        {allBullets.map((bullet) => (
                          <li key={bullet.id} className="resume-bullet">
                            {bullet.content}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              })}

              {/* Render standalone experiences */}
              {standalone.map((exp) => (
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
          {resumeData.education.length > 0 && (
            <section className="resume-section">
              <h2 className="resume-section-heading">EDUCATION</h2>
              <div className="resume-section-divider"></div>
              {resumeData.education.map((edu) => (
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
                      {edu.achievements.map((achievement) => (
                        <li key={achievement.id} className="resume-bullet">
                          {achievement.achievement}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Skills */}
          {resumeData.skills && (
            <section className="resume-section">
              <h2 className="resume-section-heading">SKILLS</h2>
              <div className="resume-section-divider"></div>
              <div className="resume-skills">
                {resumeData.skills.technical && resumeData.skills.technical.length > 0 && (
                  <div className="resume-skill-group">
                    <span className="resume-skill-category">Technical:</span>
                    <span className="resume-skill-list">{resumeData.skills.technical.join(', ')}</span>
                  </div>
                )}
                {resumeData.skills.product && resumeData.skills.product.length > 0 && (
                  <div className="resume-skill-group">
                    <span className="resume-skill-category">Product Management:</span>
                    <span className="resume-skill-list">{resumeData.skills.product.join(', ')}</span>
                  </div>
                )}
                {resumeData.skills.soft && resumeData.skills.soft.length > 0 && (
                  <div className="resume-skill-group">
                    <span className="resume-skill-category">Leadership:</span>
                    <span className="resume-skill-list">{resumeData.skills.soft.join(', ')}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
