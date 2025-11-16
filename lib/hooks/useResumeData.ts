import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Types matching database schema
export type ResumeVersion = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  is_master: boolean;
  application_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactInfo = {
  id?: string;
  version_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  portfolio?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Summary = {
  id?: string;
  version_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export type ExperienceBullet = {
  id: string;
  experience_id: string;
  content: string;
  is_selected: boolean;
  display_order: number;
  score?: number | null;
  tags?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

export type Experience = {
  id: string;
  version_id: string;
  title: string;
  company: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  display_order: number;
  role_group_id?: string | null;
  bullets?: ExperienceBullet[];
  created_at?: string;
  updated_at?: string;
};

export type EducationAchievement = {
  id: string;
  education_id: string;
  achievement: string;
  display_order: number;
  created_at?: string;
};

export type Education = {
  id: string;
  version_id: string;
  school: string;
  degree: string;
  field?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  gpa?: string | null;
  display_order: number;
  achievements?: EducationAchievement[];
  created_at?: string;
  updated_at?: string;
};

export type Skill = {
  id: string;
  version_id: string;
  category: 'technical' | 'product' | 'soft';
  skill_name: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

export type SkillsGrouped = {
  technical: Skill[];
  product: Skill[];
  soft: Skill[];
};

export type ResumeStyles = {
  id?: string;
  version_id: string;
  font_family: string;
  font_size: number;
  line_height: number;
  margin_top: number;
  margin_bottom: number;
  margin_left: number;
  margin_right: number;
  accent_color: string;
  heading_color: string;
  text_color: string;
  experience_display_mode?: 'by_role' | 'grouped';
  created_at?: string;
  updated_at?: string;
};

export type CompleteResumeData = {
  version: ResumeVersion;
  contactInfo: ContactInfo | null;
  summary: string;
  experiences: Experience[];
  education: Education[];
  skills: SkillsGrouped;
  styles: ResumeStyles | null;
};

export const useResumeData = (versionId?: string) => {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [currentResume, setCurrentResume] = useState<CompleteResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all versions
  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch('/api/resume/versions');
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data.versions || []);
      return data.versions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch versions';
      setError(message);
      toast.error(message);
      return [];
    }
  }, []);

  // Fetch complete resume data for a version
  const fetchResumeData = useCallback(async (vId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching resume data for version:', vId);
      const response = await fetch(`/api/resume/versions/${vId}`);
      if (!response.ok) {
        console.error('Failed to fetch resume data:', response.status, response.statusText);
        throw new Error('Failed to fetch resume data');
      }
      const data = await response.json();
      console.log('Fetched resume data:', data);

      // API returns data directly, not wrapped in { resume: ... }
      const resumeData = {
        version: data.version,
        contactInfo: data.contactInfo,
        summary: data.summary || '', // Convert null to empty string
        experiences: data.experiences,
        education: data.education,
        skills: data.skills,
        styles: data.styles,
      };

      console.log('Mapped resume data:', resumeData);
      setCurrentResume(resumeData);
      return resumeData;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch resume data';
      console.error('Error fetching resume data:', err);
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new version
  const createVersion = useCallback(async (name: string, slug: string, isMaster: boolean = false, applicationId?: string | null) => {
    try {
      const response = await fetch('/api/resume/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, is_master: isMaster, application_id: applicationId }),
      });
      if (!response.ok) throw new Error('Failed to create version');
      const data = await response.json();
      await fetchVersions();
      toast.success('Resume version created successfully');
      return data.version;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create version';
      toast.error(message);
      throw err;
    }
  }, [fetchVersions]);

  // Clone version from a master resume
  const cloneVersion = useCallback(async (sourceVersionId: string, newName: string, applicationId?: string | null, isMaster: boolean = false) => {
    try {
      const response = await fetch(`/api/resume/versions/${sourceVersionId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName, applicationId, isMaster }),
      });
      if (!response.ok) throw new Error('Failed to clone version');
      const data = await response.json();
      await fetchVersions();
      toast.success('Resume cloned successfully');
      return data.version;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clone version';
      toast.error(message);
      throw err;
    }
  }, [fetchVersions]);

  // Update version metadata
  const updateVersion = useCallback(async (vId: string, updates: Partial<ResumeVersion>) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update version');
      const data = await response.json();
      await fetchVersions();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update version';
      toast.error(message);
      throw err;
    }
  }, [fetchVersions]);

  // Delete version
  const deleteVersion = useCallback(async (vId: string) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete version');
      await fetchVersions();
      toast.success('Resume version deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete version';
      toast.error(message);
      throw err;
    }
  }, [fetchVersions]);

  // Update contact info
  const updateContactInfo = useCallback(async (vId: string, contactInfo: Partial<ContactInfo>) => {
    try {
      console.log('Updating contact info:', { vId, contactInfo });
      const response = await fetch(`/api/resume/versions/${vId}/contact`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactInfo),
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        console.error('Contact info update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update contact info');
      }
      const data = await response.json();
      return data.contactInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update contact info';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update summary
  const updateSummary = useCallback(async (vId: string, content: string) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}/summary`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update summary');
      const data = await response.json();
      return data.summary;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update summary';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update styles
  const updateStyles = useCallback(async (vId: string, styles: Partial<ResumeStyles>) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}/styles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styles),
      });
      if (!response.ok) throw new Error('Failed to update styles');
      const data = await response.json();
      return data.styles;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update styles';
      toast.error(message);
      throw err;
    }
  }, []);

  // Create experience
  const createExperience = useCallback(async (vId: string, experience: Partial<Experience>) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}/experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experience),
      });
      if (!response.ok) throw new Error('Failed to create experience');
      const data = await response.json();
      toast.success('Experience added');
      return data.experience;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create experience';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update experience
  const updateExperience = useCallback(async (experienceId: string, updates: Partial<Experience>) => {
    try {
      const response = await fetch(`/api/resume/experiences/${experienceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update experience');
      const data = await response.json();
      return data.experience;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update experience';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete experience
  const deleteExperience = useCallback(async (experienceId: string) => {
    try {
      const response = await fetch(`/api/resume/experiences/${experienceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete experience');
      toast.success('Experience deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete experience';
      toast.error(message);
      throw err;
    }
  }, []);

  // Create bullet
  const createBullet = useCallback(async (experienceId: string, bullet: Partial<ExperienceBullet>) => {
    try {
      const response = await fetch(`/api/resume/experiences/${experienceId}/bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bullet),
      });
      if (!response.ok) throw new Error('Failed to create bullet');
      const data = await response.json();
      return data.bullet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bullet';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update bullet
  const updateBullet = useCallback(async (bulletId: string, updates: Partial<ExperienceBullet>) => {
    try {
      const response = await fetch(`/api/resume/bullets/${bulletId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update bullet');
      const data = await response.json();
      return data.bullet;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update bullet';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete bullet
  const deleteBullet = useCallback(async (bulletId: string) => {
    try {
      const response = await fetch(`/api/resume/bullets/${bulletId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete bullet');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete bullet';
      toast.error(message);
      throw err;
    }
  }, []);

  // Create education
  const createEducation = useCallback(async (vId: string, education: Partial<Education>) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(education),
      });
      if (!response.ok) throw new Error('Failed to create education');
      const data = await response.json();
      toast.success('Education added');
      return data.education;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create education';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update education
  const updateEducation = useCallback(async (educationId: string, updates: Partial<Education>) => {
    try {
      const response = await fetch(`/api/resume/education/${educationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update education');
      const data = await response.json();
      return data.education;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update education';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete education
  const deleteEducation = useCallback(async (educationId: string) => {
    try {
      const response = await fetch(`/api/resume/education/${educationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete education');
      toast.success('Education deleted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete education';
      toast.error(message);
      throw err;
    }
  }, []);

  // Create achievement
  const createAchievement = useCallback(async (educationId: string, achievement: string, displayOrder: number = 0) => {
    try {
      const response = await fetch(`/api/resume/education/${educationId}/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement, display_order: displayOrder }),
      });
      if (!response.ok) throw new Error('Failed to create achievement');
      const data = await response.json();
      return data.achievement;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create achievement';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update achievement
  const updateAchievement = useCallback(async (achievementId: string, achievement: string, displayOrder?: number) => {
    try {
      const response = await fetch(`/api/resume/achievements/${achievementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement, display_order: displayOrder }),
      });
      if (!response.ok) throw new Error('Failed to update achievement');
      const data = await response.json();
      return data.achievement;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update achievement';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete achievement
  const deleteAchievement = useCallback(async (achievementId: string) => {
    try {
      const response = await fetch(`/api/resume/achievements/${achievementId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete achievement');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete achievement';
      toast.error(message);
      throw err;
    }
  }, []);

  // Update skills for a category (batch operation)
  const updateSkillsForCategory = useCallback(async (vId: string, category: 'technical' | 'product' | 'soft', skills: string[]) => {
    try {
      const response = await fetch(`/api/resume/versions/${vId}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, skills }),
      });
      if (!response.ok) throw new Error('Failed to update skills');
      const data = await response.json();
      return data.skills;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update skills';
      toast.error(message);
      throw err;
    }
  }, []);

  // Delete single skill
  const deleteSkill = useCallback(async (skillId: string) => {
    try {
      const response = await fetch(`/api/resume/skills/${skillId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete skill');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete skill';
      toast.error(message);
      throw err;
    }
  }, []);

  // Load versions on mount
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Load specific version data if versionId provided
  useEffect(() => {
    if (versionId) {
      fetchResumeData(versionId);
    }
  }, [versionId, fetchResumeData]);

  return {
    // State
    versions,
    currentResume,
    isLoading,
    error,

    // Version operations
    fetchVersions,
    fetchResumeData,
    createVersion,
    cloneVersion,
    updateVersion,
    deleteVersion,

    // Content operations
    updateContactInfo,
    updateSummary,
    updateStyles,

    // Experience operations
    createExperience,
    updateExperience,
    deleteExperience,

    // Bullet operations
    createBullet,
    updateBullet,
    deleteBullet,

    // Education operations
    createEducation,
    updateEducation,
    deleteEducation,

    // Achievement operations
    createAchievement,
    updateAchievement,
    deleteAchievement,

    // Skills operations
    updateSkillsForCategory,
    deleteSkill,
  };
};

