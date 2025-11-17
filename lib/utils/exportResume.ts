// DOCX Export Utility
// FUTURE ENHANCEMENT: Add more sophisticated formatting options
// FUTURE ENHANCEMENT: Support custom templates and layouts
// FUTURE ENHANCEMENT: Integrate with Google Docs API for direct upload

import { Document, Paragraph, TextRun, AlignmentType, convertInchesToTwip, BorderStyle } from "docx";

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

type ResumeData = {
  contactInfo: ContactInfo;
  summary?: string;
  experiences: Experience[];
  education: Education[];
  skills: Skills;
  styles?: {
    experienceDisplayMode?: 'by_role' | 'grouped';
  };
};

export const createResumeDocument = (data: ResumeData): Document => {
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
  const displayMode = styles?.experienceDisplayMode || 'by_role';

  const sections: Paragraph[] = [];

  // Contact Information (Header)
  sections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ text: contactInfo.name, bold: true, size: 24 }),
      ],
    })
  );

  // Build contact info items array, filtering out empty fields
  const contactItems: Array<{ text: string }> = [];
  
  if (contactInfo.location?.trim()) {
    contactItems.push({ text: contactInfo.location });
  }
  
  if (contactInfo.phone?.trim()) {
    contactItems.push({ text: contactInfo.phone });
  }
  
  if (contactInfo.email?.trim()) {
    contactItems.push({ text: contactInfo.email });
  }
  
  if (contactInfo.linkedin?.trim()) {
    contactItems.push({ text: contactInfo.linkedin });
  }
  
  if (contactInfo.portfolio?.trim()) {
    contactItems.push({ text: contactInfo.portfolio });
  }

  // Build TextRun array with bullets only between items
  const contactTextRuns: TextRun[] = [];
  contactItems.forEach((item, index) => {
    if (index > 0) {
      contactTextRuns.push(new TextRun({ text: " • ", size: 20 }));
    }
    contactTextRuns.push(new TextRun({ text: item.text, size: 20 }));
  });

  if (contactTextRuns.length > 0) {
    sections.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contactTextRuns,
      })
    );
  }

  // Professional Summary
  if (summary) {
    sections.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({ text: "PROFESSIONAL SUMMARY", bold: true, size: 20 }),
        ],
      })
    );

    sections.push(
      new Paragraph({
        text: summary,
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
  }

  // Professional Experience
  if (groups.size > 0 || standalone.length > 0) {
    sections.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({ text: "PROFESSIONAL EXPERIENCE", bold: true, size: 20 }),
        ],
      })
    );

    let experienceIndex = 0;

    // Render grouped experiences
    Array.from(groups.entries()).forEach(([groupId, groupExps]) => {
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

      // Company header with location and date range
      const companyHeaderChildren: TextRun[] = [
        new TextRun({ text: company, bold: true, size: 22 }),
      ];
      if (location?.trim()) {
        companyHeaderChildren.push(new TextRun({ text: `, ${location}`, size: 22 }));
      }
      if (dateRange) {
        // Add date range aligned to the right - we'll use tab stops for this
        companyHeaderChildren.push(
          new TextRun({ text: "\t", size: 22 }),
          new TextRun({ text: dateRange, size: 22 })
        );
      }

      sections.push(
        new Paragraph({
          spacing: { before: experienceIndex === 0 ? 0 : 150, after: 50 },
          alignment: AlignmentType.JUSTIFIED,
          tabStops: dateRange ? [{ type: "right", position: convertInchesToTwip(7.5) }] : [],
          children: companyHeaderChildren,
        })
      );

      if (bulletMode === 'per_role') {
        // Mode 1: Each role with its bullets
        sortedExps.forEach((exp) => {
          // Role title and dates (italic) - only show dates if multiple roles
          const roleDateText = sortedExps.length > 1 && (exp.startDate || exp.endDate)
            ? ` (${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})`
            : '';
          sections.push(
            new Paragraph({
              spacing: { before: 20, after: 30 },
              children: [
                new TextRun({ text: exp.title, italics: true, size: 20 }),
                ...(roleDateText ? [new TextRun({ text: roleDateText, size: 20 })] : []),
              ],
            })
          );

          // Bullets for this role
          exp.bullets.forEach((bullet) => {
            sections.push(
              new Paragraph({
                text: bullet.content,
                bullet: { level: 0 },
                spacing: { after: 80 },
              })
            );
          });
        });
      } else {
        // Mode 2: All titles stacked, then all bullets
        sortedExps.forEach((exp) => {
          // Only show dates if multiple roles
          const roleDateText = sortedExps.length > 1 && (exp.startDate || exp.endDate)
            ? ` (${[exp.startDate, exp.endDate].filter(Boolean).join(' - ')})`
            : '';
          sections.push(
            new Paragraph({
              spacing: { before: 20, after: 10 },
              children: [
                new TextRun({ text: exp.title, italics: true, size: 20 }),
                ...(roleDateText ? [new TextRun({ text: roleDateText, size: 20 })] : []),
              ],
            })
          );
        });

        // All bullets together
        sortedExps.forEach((exp) => {
          exp.bullets.forEach((bullet) => {
            sections.push(
              new Paragraph({
                text: bullet.content,
                bullet: { level: 0 },
                spacing: { after: 80 },
              })
            );
          });
        });
      }

      experienceIndex++;
    });

    // Render standalone experiences
    standalone.forEach((exp, index) => {
      // Company header with location and dates
      const companyHeaderChildren: TextRun[] = [
        new TextRun({ text: exp.company, bold: true, size: 22 }),
      ];
      if (exp.location?.trim()) {
        companyHeaderChildren.push(new TextRun({ text: `, ${exp.location}`, size: 22 }));
      }
      const dateRange = exp.startDate || exp.endDate 
        ? [exp.startDate, exp.endDate].filter(Boolean).join(' - ')
        : '';
      if (dateRange) {
        companyHeaderChildren.push(
          new TextRun({ text: "\t", size: 22 }),
          new TextRun({ text: dateRange, size: 22 })
        );
      }

      sections.push(
        new Paragraph({
          spacing: { before: experienceIndex === 0 ? 0 : 150, after: 20 },
          alignment: AlignmentType.JUSTIFIED,
          tabStops: dateRange ? [{ type: "right", position: convertInchesToTwip(7.5) }] : [],
          children: companyHeaderChildren,
        })
      );

      // Role title (italic)
      sections.push(
        new Paragraph({
          spacing: { after: 100, before: 10 },
          children: [
            new TextRun({ text: exp.title, italics: true, size: 20 }),
          ],
        })
      );

      // Bullets
      exp.bullets.forEach((bullet) => {
        sections.push(
          new Paragraph({
            text: bullet.content,
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
      });

      experienceIndex++;
    });
  }

  // Education
  if (education.length > 0) {
    sections.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({ text: "EDUCATION", bold: true, size: 20 }),
        ],
      })
    );

    education.forEach((edu, index) => {
      // School Name
      sections.push(
        new Paragraph({
          spacing: { before: index === 0 ? 0 : 150, after: 50 },
          children: [
            new TextRun({ text: edu.school, bold: true, size: 22 }),
          ],
        })
      );

      // Degree Info
      sections.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: `${edu.degree} - ${edu.field}`, bold: true, size: 20 }),
            ...(edu.gpa ? [new TextRun({ text: ` • GPA: ${edu.gpa}`, size: 20 })] : []),
          ],
        })
      );

      // Location and Dates
      const dateText = [edu.startDate, edu.endDate].filter(Boolean).join(' - ');
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: edu.location, italics: true, size: 20 }),
            ...(dateText ? [
              new TextRun({ text: " | ", size: 20 }),
              new TextRun({ text: dateText, bold: true, size: 20 }),
            ] : []),
          ],
        })
      );

      // Achievements
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach((achievement) => {
          const achievementText = typeof achievement === 'string' 
            ? achievement 
            : achievement.achievement || String(achievement);
          sections.push(
            new Paragraph({
              text: achievementText,
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          );
        });
      }
    });
  }

  // Skills
  if (skills && (skills.technical || skills.product || skills.soft)) {
    sections.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "000000",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [
          new TextRun({ text: "SKILLS", bold: true, size: 20 }),
        ],
      })
    );

    if (skills.technical && skills.technical.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Technical: ", bold: true, size: 20 }),
            new TextRun({ text: skills.technical.join(", "), size: 20 }),
          ],
        })
      );
    }

    if (skills.product && skills.product.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Product Management: ", bold: true, size: 20 }),
            new TextRun({ text: skills.product.join(", "), size: 20 }),
          ],
        })
      );
    }

    if (skills.soft && skills.soft.length > 0) {
      sections.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Leadership: ", bold: true, size: 20 }),
            new TextRun({ text: skills.soft.join(", "), size: 20 }),
          ],
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
            },
          },
        },
        children: sections,
      },
    ],
  });
};

export const downloadDocx = async (doc: Document, filename: string): Promise<void> => {
  const { Packer } = await import("docx");
  
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

