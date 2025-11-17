import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  portfolio?: string;
};

type Bullet = {
  id: string;
  content: string;
  isSelected: boolean;
};

type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  roleGroupId?: string | null;
  bulletMode?: 'per_role' | 'per_experience' | null;
  bullets: Bullet[];
};

type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: (string | { achievement?: string; [key: string]: any })[];
};

type Skills = {
  technical?: string[];
  product?: string[];
  soft?: string[];
};

type ResumeStyles = {
  fontFamily: string;
  fontSize: number;
  lineHeight: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  accentColor: string;
  headingColor: string;
  textColor: string;
  experienceDisplayMode?: 'by_role' | 'grouped';
};

type ResumeData = {
  contactInfo: ContactInfo;
  summary?: string;
  experiences: Experience[];
  education: Education[];
  skills: Skills;
  styles: ResumeStyles;
};

const generateResumeHTML = (data: ResumeData): string => {
  const { contactInfo, summary, experiences, education, skills, styles } = data;

  // Group experiences by roleGroupId first (before filtering bullets)
  const groupExperiencesByRole = (exps: typeof experiences) => {
    const groups: Map<string | null, typeof experiences> = new Map();
    const standalone: typeof experiences = [];

    exps.forEach(exp => {
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

  const { groups: rawGroups, standalone: rawStandalone } = groupExperiencesByRole(experiences);

  // Filter bullets for grouped experiences - show all roles even if some have no selected bullets
  const groups = new Map<string | null, typeof experiences>();
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

  // Map font names to actual Google Fonts URLs
  const getFontImport = (fontName: string): string => {
    const fontUrls: Record<string, string> = {
      'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
      'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
      'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
      'Open Sans': 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap',
      'Source Sans 3': 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap',
      'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
      'PT Serif': 'https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap',
      'Crimson Text': 'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&display=swap',
    };
    return fontUrls[fontName] || fontUrls['Inter'];
  };

  const getFontFamily = (fontName: string): string => {
    // Return the font name with fallback
    return `"${fontName}", sans-serif`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${contactInfo.name} - Resume</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${getFontImport(styles.fontFamily)}" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: letter;
      margin: ${styles.marginTop}in ${styles.marginRight}in ${styles.marginBottom}in ${styles.marginLeft}in;
    }

    body {
      font-family: ${getFontFamily(styles.fontFamily)};
      font-size: ${styles.fontSize}pt;
      line-height: ${styles.lineHeight};
      color: ${styles.textColor};
      background: white;
      margin: 0;
      padding: 0;
      width: 8.5in;
    }

    .resume-content {
      padding: 0;
    }

    /* Header Styles */
    .resume-header {
      text-align: center;
      margin-bottom: 0.15in;
    }

    .resume-name {
      font-size: ${styles.fontSize * 2}pt;
      font-weight: 700;
      color: ${styles.headingColor};
      margin: 0 0 0.08in 0;
      letter-spacing: 0.5px;
    }

    .resume-contact-info {
      font-size: ${styles.fontSize * 0.9}pt;
      margin: 0.04in 0;
      color: ${styles.textColor};
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
      color: ${styles.textColor};
      text-decoration: none;
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
      font-size: ${styles.fontSize}pt;
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
      font-size: ${styles.fontSize * 1.05}pt;
      font-weight: 700;
      color: ${styles.headingColor};
      margin: 0 0 0.02in 0;
    }

    .resume-experience-title > span {
      font-weight: 400;
    }

    .resume-experience-company {
      font-weight: 600;
      color: ${styles.textColor};
      display: block;
    }

    .resume-experience-meta {
      text-align: right;
      flex-shrink: 0;
    }

    .resume-experience-location {
      display: block;
      font-size: ${styles.fontSize * 0.95}pt;
      font-style: italic;
      font-weight: 400;
    }

    .resume-experience-dates {
      display: block;
      font-size: ${styles.fontSize * 0.95}pt;
      font-weight: 600;
      color: ${styles.textColor};
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
      color: ${styles.headingColor};
      flex-shrink: 0;
      min-width: 1.5in;
    }

    .resume-skill-list {
      flex: 1;
    }
  </style>
</head>
<body>
  <div class="resume-content">
  <!-- Contact Information -->
  <header class="resume-header">
    <h1 class="resume-name">${contactInfo.name}</h1>
    <div class="resume-contact-info">
      ${(() => {
        const contactItems: string[] = [];
        
        if (contactInfo.location?.trim()) {
          contactItems.push(`<span class="resume-contact-item">${contactInfo.location}</span>`);
        }
        
        if (contactInfo.phone?.trim()) {
          contactItems.push(`<span class="resume-contact-item">${contactInfo.phone}</span>`);
        }
        
        if (contactInfo.email?.trim()) {
          contactItems.push(`<span class="resume-contact-item"><a href="mailto:${contactInfo.email}" class="resume-link">${contactInfo.email}</a></span>`);
        }
        
        if (contactInfo.linkedin?.trim()) {
          contactItems.push(`<span class="resume-contact-item"><a href="https://${contactInfo.linkedin}" class="resume-link">${contactInfo.linkedin}</a></span>`);
        }
        
        if (contactInfo.portfolio?.trim()) {
          contactItems.push(`<span class="resume-contact-item"><a href="https://${contactInfo.portfolio}" class="resume-link">${contactInfo.portfolio}</a></span>`);
        }
        
        // Only add bullets between items (not before the first one)
        return contactItems.map((item, index) => {
          if (index === 0) {
            return item;
          }
          return `<span class="resume-separator">•</span>${item}`;
        }).join('');
      })()}
    </div>
  </header>

  <!-- Professional Summary -->
  ${summary ? `
  <section class="resume-section">
    <h2 class="resume-section-heading">PROFESSIONAL SUMMARY</h2>
    <div class="resume-section-divider"></div>
    <p class="resume-summary">${summary}</p>
  </section>
  ` : ''}

  <!-- Work Experience -->
  ${(groups.size > 0 || standalone.length > 0) ? `
  <section class="resume-section">
    <h2 class="resume-section-heading">PROFESSIONAL EXPERIENCE</h2>
    <div class="resume-section-divider"></div>
    ${Array.from(groups.entries()).map(([groupId, groupExps]) => {
      const company = groupExps[0].company;
      const location = groupExps[0].location;
      // Get bulletMode from first experience in group (all experiences in a group share the same bulletMode)
      const bulletMode = groupExps[0].bulletMode || 'per_role';
      
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
      const sortedExps = [...groupExps].sort((a, b) => {
        const aDate = parseDate(a.startDate);
        const bDate = parseDate(b.startDate);
        return bDate - aDate; // Descending order (newest first)
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

      if (bulletMode === 'per_role') {
        // Mode 1: Company header, then each role with its bullets
        return `
        <div class="resume-experience-item">
          <div class="resume-experience-header">
            <div class="resume-experience-title-group">
              <h3 class="resume-experience-title"><strong>${company}</strong>${location?.trim() ? `<span>, ${location}</span>` : ''}</h3>
            </div>
            ${dateRange ? `<div class="resume-experience-meta"><span class="resume-experience-dates">${dateRange}</span></div>` : ''}
          </div>
          ${sortedExps.map(exp => `
            <div style="margin-top: 0.03in; margin-bottom: 0.1in;">
              <div style="margin-bottom: 0.05in; font-style: italic;">
                <em>${exp.title}</em>
                ${sortedExps.length > 1 && (exp.startDate || exp.endDate) ? `<span style="margin-left: 0.1in; font-size: calc(${styles.fontSize}pt * 0.95);">(${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})</span>` : ''}
              </div>
              <ul class="resume-bullets" style="margin-left: 0.15in;">
                ${exp.bullets.map(bullet => `
                  <li class="resume-bullet">${bullet.content}</li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
        `;
      } else {
        // Mode 2: Company header, all titles stacked, then all bullets
        const allBullets = sortedExps.flatMap(exp => exp.bullets);
        return `
        <div class="resume-experience-item">
          <div class="resume-experience-header">
            <div class="resume-experience-title-group">
              <h3 class="resume-experience-title"><strong>${company}</strong>${location?.trim() ? `<span>, ${location}</span>` : ''}</h3>
            </div>
            ${dateRange ? `<div class="resume-experience-meta"><span class="resume-experience-dates">${dateRange}</span></div>` : ''}
          </div>
          <div style="margin-bottom: 0.05in;">
            ${sortedExps.map((exp, idx) => `
              <div style="margin-bottom: ${idx < sortedExps.length - 1 ? '0.03in' : '0'}; font-style: italic;">
                <em>${exp.title}</em>
                ${sortedExps.length > 1 && (exp.startDate || exp.endDate) ? `<span style="margin-left: 0.1in; font-size: calc(${styles.fontSize}pt * 0.95);">(${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})</span>` : ''}
              </div>
            `).join('')}
          </div>
          <ul class="resume-bullets">
            ${allBullets.map(bullet => `
              <li class="resume-bullet">${bullet.content}</li>
            `).join('')}
          </ul>
        </div>
        `;
      }
    }).join('')}
    ${standalone.map(exp => `
    <div class="resume-experience-item">
      <div class="resume-experience-header">
        <div class="resume-experience-title-group">
          <h3 class="resume-experience-title"><strong>${exp.company}</strong>${exp.location?.trim() ? `<span>, ${exp.location}</span>` : ''}</h3>
        </div>
        ${exp.startDate || exp.endDate ? `<div class="resume-experience-meta"><span class="resume-experience-dates">${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')}</span></div>` : ''}
      </div>
      <div style="margin-top: 0.02in; margin-bottom: 0.05in; font-style: italic;">
        <em>${exp.title}</em>
      </div>
      <ul class="resume-bullets">
        ${exp.bullets.map(bullet => `
        <li class="resume-bullet">${bullet.content}</li>
        `).join('')}
      </ul>
    </div>
    `).join('')}
  </section>
  ` : ''}

  <!-- Education -->
  ${education.length > 0 ? `
  <section class="resume-section">
    <h2 class="resume-section-heading">EDUCATION</h2>
    <div class="resume-section-divider"></div>
    ${education.map(edu => `
    <div class="resume-education-item">
      <div class="resume-experience-header">
        <div class="resume-experience-title-group">
          <h3 class="resume-experience-title">${edu.school}</h3>
          <span class="resume-experience-company">
            ${edu.degree} - ${edu.field}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
          </span>
        </div>
        <div class="resume-experience-meta">
          <span class="resume-experience-location">${edu.location}</span>
          <span class="resume-experience-dates">${[edu.startDate, edu.endDate].filter(Boolean).join(' - ')}</span>
        </div>
      </div>
      ${edu.achievements && edu.achievements.length > 0 ? `
      <ul class="resume-bullets">
        ${edu.achievements.map(achievement => `
        <li class="resume-bullet">${typeof achievement === 'string' ? achievement : achievement.achievement || achievement}</li>
        `).join('')}
      </ul>
      ` : ''}
    </div>
    `).join('')}
  </section>
  ` : ''}

  <!-- Skills -->
  ${skills && (skills.technical || skills.product || skills.soft) ? `
  <section class="resume-section">
    <h2 class="resume-section-heading">SKILLS</h2>
    <div class="resume-section-divider"></div>
    <div class="resume-skills">
      ${skills.technical && skills.technical.length > 0 ? `
      <div class="resume-skill-group">
        <span class="resume-skill-category">Technical:</span>
        <span class="resume-skill-list">${skills.technical.join(', ')}</span>
      </div>
      ` : ''}
      ${skills.product && skills.product.length > 0 ? `
      <div class="resume-skill-group">
        <span class="resume-skill-category">Product Management:</span>
        <span class="resume-skill-list">${skills.product.join(', ')}</span>
      </div>
      ` : ''}
      ${skills.soft && skills.soft.length > 0 ? `
      <div class="resume-skill-group">
        <span class="resume-skill-category">Leadership:</span>
        <span class="resume-skill-list">${skills.soft.join(', ')}</span>
      </div>
      ` : ''}
    </div>
  </section>
  ` : ''}
  </div>
</body>
</html>
  `;
};

export async function POST(request: NextRequest) {
  try {
    const body: ResumeData = await request.json();

    // Generate HTML content
    const html = generateResumeHTML(body);

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set content and wait for fonts to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
    });

    // Additional wait to ensure fonts are fully loaded
    await page.evaluateHandle('document.fonts.ready');

    // Generate PDF - margins are handled via CSS @page rule
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    // Format date as "Month Year"
    const formatMonthYear = (date: Date = new Date()): string => {
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Return PDF as response with improved filename
    const resumeName = body.contactInfo.name || 'Resume';
    const filename = `${resumeName} - ${formatMonthYear()}.pdf`;
    
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

