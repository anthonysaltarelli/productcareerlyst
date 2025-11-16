// Utility to map between database format and UI format
import type {
  CompleteResumeData,
  ContactInfo as DBContactInfo,
  Experience as DBExperience,
  Education as DBEducation,
  SkillsGrouped as DBSkillsGrouped,
  ResumeStyles as DBResumeStyles,
} from '@/lib/hooks/useResumeData';

import type {
  ResumeData,
  ContactInfo as UIContactInfo,
  Experience as UIExperience,
  Education as UIEducation,
  Skills as UISkills,
  ResumeStyles as UIResumeStyles,
} from '@/app/components/resume/mockData';

// Map database contact info to UI format
export const mapDBContactToUI = (dbContact: DBContactInfo | null): UIContactInfo => {
  if (!dbContact) {
    return {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    };
  }

  return {
    name: dbContact.full_name,
    email: dbContact.email,
    phone: dbContact.phone || '',
    location: dbContact.location || '',
    linkedin: dbContact.linkedin || '',
    portfolio: dbContact.portfolio || '',
  };
};

// Map UI contact info to database format
export const mapUIContactToDB = (uiContact: UIContactInfo, versionId: string): Partial<DBContactInfo> => {
  return {
    version_id: versionId,
    full_name: uiContact.name,
    email: uiContact.email,
    phone: uiContact.phone || null,
    location: uiContact.location || null,
    linkedin: uiContact.linkedin || null,
    portfolio: uiContact.portfolio || null,
  };
};

// Map database experience to UI format
export const mapDBExperienceToUI = (dbExp: DBExperience): UIExperience => {
  return {
    id: dbExp.id,
    title: dbExp.title,
    company: dbExp.company,
    location: dbExp.location || '',
    startDate: dbExp.start_date || '',
    endDate: dbExp.end_date || '',
    bullets: (dbExp.bullets || []).map(bullet => ({
      id: bullet.id,
      content: bullet.content,
      isSelected: bullet.is_selected,
      score: bullet.score || 0,
      tags: bullet.tags || [],
      suggestions: [], // Suggestions not stored in DB
    })),
  };
};

// Map UI experience to database format
export const mapUIExperienceToDB = (uiExp: UIExperience, versionId: string): Partial<DBExperience> => {
  return {
    version_id: versionId,
    title: uiExp.title,
    company: uiExp.company,
    location: uiExp.location || null,
    start_date: uiExp.startDate || null,
    end_date: uiExp.endDate || null,
    display_order: 0, // Set by caller if needed
  };
};

// Map database education to UI format
export const mapDBEducationToUI = (dbEdu: DBEducation): UIEducation => {
  return {
    id: dbEdu.id,
    school: dbEdu.school,
    degree: dbEdu.degree,
    field: dbEdu.field || '',
    location: dbEdu.location || '',
    startDate: dbEdu.start_date || '',
    endDate: dbEdu.end_date || '',
    gpa: dbEdu.gpa || '',
    achievements: (dbEdu.achievements || []).map(ach => ({
      id: ach.id,
      achievement: ach.achievement,
      displayOrder: ach.display_order,
    })),
  };
};

// Map UI education to database format
export const mapUIEducationToDB = (uiEdu: UIEducation, versionId: string): Partial<DBEducation> => {
  return {
    version_id: versionId,
    school: uiEdu.school,
    degree: uiEdu.degree,
    field: uiEdu.field || null,
    location: uiEdu.location || null,
    start_date: uiEdu.startDate || null,
    end_date: uiEdu.endDate || null,
    gpa: uiEdu.gpa || null,
    display_order: 0, // Set by caller if needed
  };
};

// Map database skills to UI format
export const mapDBSkillsToUI = (dbSkills: DBSkillsGrouped): UISkills => {
  return {
    technical: dbSkills.technical.map(s => s.skill_name),
    product: dbSkills.product.map(s => s.skill_name),
    soft: dbSkills.soft.map(s => s.skill_name),
  };
};

// Map database styles to UI format
export const mapDBStylesToUI = (dbStyles: DBResumeStyles | null): UIResumeStyles => {
  if (!dbStyles) {
    return {
      fontFamily: 'Arial',
      fontSize: 11,
      lineHeight: 1.15,
      marginTop: 0.5,
      marginBottom: 0.5,
      marginLeft: 0.75,
      marginRight: 0.75,
      accentColor: '#000000',
      headingColor: '#000000',
      textColor: '#000000',
    };
  }

  return {
    fontFamily: dbStyles.font_family as UIResumeStyles['fontFamily'],
    fontSize: dbStyles.font_size,
    lineHeight: dbStyles.line_height,
    marginTop: dbStyles.margin_top,
    marginBottom: dbStyles.margin_bottom,
    marginLeft: dbStyles.margin_left,
    marginRight: dbStyles.margin_right,
    accentColor: dbStyles.accent_color,
    headingColor: dbStyles.heading_color,
    textColor: dbStyles.text_color,
  };
};

// Map UI styles to database format
export const mapUIStylesToDB = (uiStyles: UIResumeStyles, versionId: string): Partial<DBResumeStyles> => {
  return {
    version_id: versionId,
    font_family: uiStyles.fontFamily,
    font_size: uiStyles.fontSize,
    line_height: uiStyles.lineHeight,
    margin_top: uiStyles.marginTop,
    margin_bottom: uiStyles.marginBottom,
    margin_left: uiStyles.marginLeft,
    margin_right: uiStyles.marginRight,
    accent_color: uiStyles.accentColor,
    heading_color: uiStyles.headingColor,
    text_color: uiStyles.textColor,
  };
};

// Map complete database resume to UI format
export const mapCompleteDBResumeToUI = (dbResume: CompleteResumeData): ResumeData => {
  return {
    contactInfo: mapDBContactToUI(dbResume.contactInfo),
    summary: dbResume.summary || '',
    experiences: dbResume.experiences.map(mapDBExperienceToUI),
    education: dbResume.education.map(mapDBEducationToUI),
    skills: mapDBSkillsToUI(dbResume.skills),
  };
};

