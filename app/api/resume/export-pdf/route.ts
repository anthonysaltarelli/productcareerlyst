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
  achievements?: string[];
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

  // Filter only selected bullets
  const selectedExperiences = experiences
    .map(exp => ({
      ...exp,
      bullets: exp.bullets.filter(b => b.isSelected),
    }))
    .filter(exp => exp.bullets.length > 0);

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
    }

    body {
      font-family: ${getFontFamily(styles.fontFamily)};
      font-size: ${styles.fontSize}pt;
      line-height: ${styles.lineHeight};
      color: ${styles.textColor};
      background: white;
      margin: 0;
      padding: 0;
    }

    /* Header Styles */
    .resume-header {
      text-align: center;
      margin-bottom: 0.25in;
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
      margin-bottom: 0.08in;
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
      const sortedExps = [...groupExps].sort((a, b) => {
        if (a.startDate && b.startDate) {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
        return 0;
      });

      if (displayMode === 'by_role') {
        // Mode 1: Company header, then each role with its bullets
        return `
        <div class="resume-experience-item">
          <div class="resume-experience-header">
            <div class="resume-experience-title-group">
              <h3 class="resume-experience-title">${company}</h3>
              ${location ? `<span class="resume-experience-company">${location}</span>` : ''}
            </div>
          </div>
          ${sortedExps.map(exp => `
            <div style="margin-top: 0.1in; margin-bottom: 0.1in;">
              <div style="margin-bottom: 0.05in;">
                <strong style="font-size: calc(${styles.fontSize}pt * 1.02);">${exp.title}</strong>
                <span style="margin-left: 0.1in; font-size: calc(${styles.fontSize}pt * 0.95);">
                  ${exp.startDate} - ${exp.endDate}
                </span>
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
              <h3 class="resume-experience-title">${company}</h3>
              ${location ? `<span class="resume-experience-company">${location}</span>` : ''}
            </div>
          </div>
          <div style="margin-bottom: 0.08in;">
            ${sortedExps.map((exp, idx) => `
              <div style="margin-bottom: ${idx < sortedExps.length - 1 ? '0.03in' : '0'};">
                <strong style="font-size: calc(${styles.fontSize}pt * 1.02);">${exp.title}</strong>
                <span style="margin-left: 0.1in; font-size: calc(${styles.fontSize}pt * 0.95);">
                  ${exp.startDate} - ${exp.endDate}
                </span>
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
          <h3 class="resume-experience-title">${exp.title}</h3>
          <span class="resume-experience-company">${exp.company}</span>
        </div>
        <div class="resume-experience-meta">
          <span class="resume-experience-location">${exp.location}</span>
          <span class="resume-experience-dates">${exp.startDate} - ${exp.endDate}</span>
        </div>
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
          <span class="resume-experience-dates">${edu.startDate} - ${edu.endDate}</span>
        </div>
      </div>
      ${edu.achievements && edu.achievements.length > 0 ? `
      <ul class="resume-bullets">
        ${edu.achievements.map(achievement => `
        <li class="resume-bullet">${achievement}</li>
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

    // Generate PDF with proper margins
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: {
        top: `${body.styles.marginTop}in`,
        right: `${body.styles.marginRight}in`,
        bottom: `${body.styles.marginBottom}in`,
        left: `${body.styles.marginLeft}in`,
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${body.contactInfo.name.replace(/\s+/g, '_')}_Resume_${new Date().toISOString().split('T')[0]}.pdf"`,
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

