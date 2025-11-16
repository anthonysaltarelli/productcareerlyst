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

  // Group experiences by roleGroupId first (before filtering bullets)
  const groupExperiencesByRole = (experiences: typeof resumeData.experiences) => {
    const groups: Map<string | null, typeof resumeData.experiences> = new Map();
    const standalone: typeof resumeData.experiences = [];

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

  const { groups: rawGroups, standalone: rawStandalone } = groupExperiencesByRole(resumeData.experiences);

  // Filter bullets for grouped experiences - show all roles even if some have no selected bullets
  const groups = new Map<string | null, typeof resumeData.experiences>();
  rawGroups.forEach((groupExps, groupId) => {
    const filteredGroupExps = groupExps.map(exp => ({
      ...exp,
      bullets: exp.bullets.filter(b => b.isSelected),
    }));
    // Only include group if at least one role has selected bullets
    if (filteredGroupExps.some(exp => exp.bullets.length > 0)) {
      groups.set(groupId, filteredGroupExps);
    }
  });

  // Filter bullets for standalone experiences - only show if they have selected bullets
  const standalone = rawStandalone
    .map(exp => ({
      ...exp,
      bullets: exp.bullets.filter(b => b.isSelected),
    }))
    .filter(exp => exp.bullets.length > 0);
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
          margin-bottom: 0.03in;
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

        .resume-experience-title > span {
          font-weight: 400;
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
          font-weight: 400;
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
              {(() => {
                const contactItems: Array<{ content: React.ReactNode; key: string }> = [];
                
                if (resumeData.contactInfo.location?.trim()) {
                  contactItems.push({ content: resumeData.contactInfo.location, key: 'location' });
                }
                
                if (resumeData.contactInfo.phone?.trim()) {
                  contactItems.push({ content: resumeData.contactInfo.phone, key: 'phone' });
                }
                
                if (resumeData.contactInfo.email?.trim()) {
                  contactItems.push({
                    content: <a href={`mailto:${resumeData.contactInfo.email}`} className="resume-link">{resumeData.contactInfo.email}</a>,
                    key: 'email'
                  });
                }
                
                if (resumeData.contactInfo.linkedin?.trim()) {
                  contactItems.push({
                    content: <a href={`https://${resumeData.contactInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="resume-link">{resumeData.contactInfo.linkedin}</a>,
                    key: 'linkedin'
                  });
                }
                
                if (resumeData.contactInfo.portfolio?.trim()) {
                  contactItems.push({
                    content: <a href={`https://${resumeData.contactInfo.portfolio}`} target="_blank" rel="noopener noreferrer" className="resume-link">{resumeData.contactInfo.portfolio}</a>,
                    key: 'portfolio'
                  });
                }
                
                return contactItems.map((item, index) => (
                  <span key={item.key} className="resume-contact-item">
                    {index > 0 && <span className="resume-separator">•</span>}
                    {item.content}
                  </span>
                ));
              })()}
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
                
                // Helper to parse date for comparison (handles "September 2021", "2021", "2021-09", and "Present")
                const parseDate = (dateStr: string | null | undefined): number => {
                  if (!dateStr || dateStr.toLowerCase() === 'present') return Infinity;
                  
                  // Try Month Year format: "September 2021" or "Sep 2021"
                  const monthYearMatch = dateStr.match(/(\w+)\s+(\d{4})/i);
                  if (monthYearMatch) {
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                     'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                                    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
                    const monthStr = monthYearMatch[1].toLowerCase();
                    const year = parseInt(monthYearMatch[2]);
                    let month = monthNames.indexOf(monthStr);
                    if (month === -1) {
                      month = monthAbbr.indexOf(monthStr);
                    }
                    if (month !== -1) {
                      return year * 12 + month;
                    }
                  }
                  
                  // Try YYYY-MM format: "2021-09"
                  const dashMatch = dateStr.match(/(\d{4})-(\d{1,2})/);
                  if (dashMatch) {
                    return parseInt(dashMatch[1]) * 12 + parseInt(dashMatch[2]) - 1;
                  }
                  
                  // Try year only: "2021"
                  const yearMatch = dateStr.match(/(\d{4})/);
                  if (yearMatch) {
                    return parseInt(yearMatch[1]) * 12;
                  }
                  
                  // Fallback: return 0 if we can't parse
                  return 0;
                };
                
                // Sort experiences by start date in descending order (newest first)
                // If dates are equal or one is missing, use end date as tiebreaker
                const sortedExps = [...groupExps].sort((a, b) => {
                  const aStartDate = parseDate(a.startDate);
                  const bStartDate = parseDate(b.startDate);
                  
                  // Primary sort: by start date (descending - newest first)
                  if (aStartDate !== bStartDate) {
                    return bStartDate - aStartDate;
                  }
                  
                  // Tiebreaker: by end date (descending - newest first)
                  const aEndDate = parseDate(a.endDate);
                  const bEndDate = parseDate(b.endDate);
                  return bEndDate - aEndDate;
                });

                // Calculate min/max dates for grouped experiences
                const allStartDates = sortedExps.map(exp => exp.startDate).filter(Boolean);
                const allEndDates = sortedExps.map(exp => exp.endDate).filter(Boolean);
                const minStartDate = allStartDates.length > 0 
                  ? allStartDates.reduce((min, d) => !min || d < min ? d : min)
                  : null;
                const maxEndDate = allEndDates.length > 0
                  ? allEndDates.reduce((max, d) => !max || d > max ? d : max)
                  : null;
                const dateRange = (minStartDate || maxEndDate)
                  ? `${minStartDate || ''} - ${maxEndDate || ''}`.replace(/^ - | - $/g, '').trim()
                  : '';

                if (displayMode === 'by_role') {
                  // Mode 1: Company header, then each role with its bullets
                  return (
                    <div key={groupId} className="resume-experience-item">
                      <div className="resume-experience-header">
                        <div className="resume-experience-title-group">
                          <h3 className="resume-experience-title">
                            <strong>{company}</strong>
                            {location?.trim() && <span>, {location}</span>}
                          </h3>
                        </div>
                        {dateRange && (
                          <div className="resume-experience-meta">
                            <span className="resume-experience-dates">{dateRange}</span>
                          </div>
                        )}
                      </div>
                      {sortedExps.map((exp) => (
                        <div key={exp.id} style={{ marginTop: '0.03in', marginBottom: '0.1in' }}>
                          <div style={{ marginBottom: '0.05in', fontStyle: 'italic' }}>
                            <em>{exp.title}</em>
                            {sortedExps.length > 1 && (exp.startDate || exp.endDate) ? (
                              <span style={{ marginLeft: '0.1in', fontSize: 'calc(var(--resume-font-size) * 0.95)' }}>
                                ({[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})
                              </span>
                            ) : null}
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
                          <h3 className="resume-experience-title">
                            <strong>{company}</strong>
                            {location?.trim() && <span>, {location}</span>}
                          </h3>
                        </div>
                        {dateRange && (
                          <div className="resume-experience-meta">
                            <span className="resume-experience-dates">{dateRange}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ marginBottom: '0.05in' }}>
                        {sortedExps.map((exp, idx) => (
                          <div key={exp.id} style={{ marginBottom: idx < sortedExps.length - 1 ? '0.03in' : '0', fontStyle: 'italic' }}>
                            <em>{exp.title}</em>
                            {sortedExps.length > 1 && (exp.startDate || exp.endDate) ? (
                              <span style={{ marginLeft: '0.1in', fontSize: 'calc(var(--resume-font-size) * 0.95)' }}>
                                ({[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})
                              </span>
                            ) : null}
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
                      <h3 className="resume-experience-title">
                        <strong>{exp.company}</strong>
                        {exp.location?.trim() && <span>, {exp.location}</span>}
                      </h3>
                    </div>
                    {(exp.startDate || exp.endDate) && (
                      <div className="resume-experience-meta">
                        <span className="resume-experience-dates">
                          {[exp.startDate, exp.endDate].filter(Boolean).join(' - ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '0.02in', marginBottom: '0.05in', fontStyle: 'italic' }}>
                    <em>{exp.title}</em>
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
                      <span className="resume-experience-dates">
                        {[edu.startDate, edu.endDate].filter(Boolean).join(' - ')}
                      </span>
                    </div>
                  </div>
                  {edu.achievements && edu.achievements.length > 0 && (
                    <ul className="resume-bullets">
                      {edu.achievements.map((achievement) => (
                        <li key={achievement.id} className="resume-bullet">
                          {typeof achievement === 'string' ? achievement : achievement.achievement}
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
