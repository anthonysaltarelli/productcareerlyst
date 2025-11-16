// DOCX Export Utility
// FUTURE ENHANCEMENT: Add more sophisticated formatting options
// FUTURE ENHANCEMENT: Support custom templates and layouts
// FUTURE ENHANCEMENT: Integrate with Google Docs API for direct upload

import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip, BorderStyle } from "docx";

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
  const displayMode = styles?.experienceDisplayMode || 'by_role';

  const sections: Paragraph[] = [];

  // Contact Information (Header)
  sections.push(
    new Paragraph({
      text: contactInfo.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      style: "Strong",
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
        text: "PROFESSIONAL SUMMARY",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "2563eb",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
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
        text: "PROFESSIONAL EXPERIENCE",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "2563eb",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
      })
    );

    let experienceIndex = 0;

    // Render grouped experiences
    Array.from(groups.entries()).forEach(([groupId, groupExps]) => {
      const company = groupExps[0].company;
      const location = groupExps[0].location;
      const sortedExps = [...groupExps].sort((a, b) => {
        if (a.startDate && b.startDate) {
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        }
        return 0;
      });

      // Company header
      sections.push(
        new Paragraph({
          spacing: { before: experienceIndex === 0 ? 0 : 150, after: 50 },
          children: [
            new TextRun({ text: company, bold: true, size: 22 }),
            ...(location ? [
              new TextRun({ text: " | ", size: 22 }),
              new TextRun({ text: location, size: 22 }),
            ] : []),
          ],
        })
      );

      if (displayMode === 'by_role') {
        // Mode 1: Each role with its bullets
        sortedExps.forEach((exp) => {
          // Role title and dates
          sections.push(
            new Paragraph({
              spacing: { before: 50, after: 30 },
              children: [
                new TextRun({ text: exp.title, bold: true, size: 20 }),
                new TextRun({ text: " | ", size: 20 }),
                new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, size: 20 }),
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
          sections.push(
            new Paragraph({
              spacing: { before: 30, after: 10 },
              children: [
                new TextRun({ text: exp.title, bold: true, size: 20 }),
                new TextRun({ text: " | ", size: 20 }),
                new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, size: 20 }),
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
      // Job Title and Company
      sections.push(
        new Paragraph({
          spacing: { before: experienceIndex === 0 ? 0 : 150, after: 50 },
          children: [
            new TextRun({ text: exp.title, bold: true, size: 22 }),
            new TextRun({ text: " | ", size: 22 }),
            new TextRun({ text: exp.company, bold: true, size: 22 }),
          ],
        })
      );

      // Location and Dates
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: exp.location, italics: true, size: 20 }),
            new TextRun({ text: " | ", size: 20 }),
            new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, bold: true, size: 20 }),
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
        text: "EDUCATION",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "2563eb",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
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
      sections.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: edu.location, italics: true, size: 20 }),
            new TextRun({ text: " | ", size: 20 }),
            new TextRun({ text: `${edu.startDate} - ${edu.endDate}`, bold: true, size: 20 }),
          ],
        })
      );

      // Achievements
      if (edu.achievements && edu.achievements.length > 0) {
        edu.achievements.forEach((achievement) => {
          sections.push(
            new Paragraph({
              text: achievement,
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
        text: "SKILLS",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
        border: {
          bottom: {
            color: "2563eb",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
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

