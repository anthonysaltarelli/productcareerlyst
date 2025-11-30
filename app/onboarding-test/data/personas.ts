import { OnboardingData } from '../utils/planGenerator';

export interface Persona {
  id: string;
  name: string;
  description: string;
  data: OnboardingData;
}

export const PERSONAS: Persona[] = [
  {
    id: 'persona-1',
    name: 'Sarah - Data Analyst to APM',
    description: 'Data Analyst pivoting to Associate Product Manager, not getting interviews',
    data: {
      personalInfo: {
        firstName: 'Sarah',
        lastName: 'Chen',
        currentRole: 'Data Analyst',
        careerStage: 'breaking_into_product',
        currentSalary: 75000,
      },
      goals: {
        targetRole: 'associate_product_manager',
        timeline: '3_months',
        struggles: 'I struggle with getting interviews despite applying to many positions. I have trouble writing a strong resume that stands out to recruiters. I need help building a product portfolio to showcase my work.',
        jobSearchStage: 'not_getting_interviews',
        interviewConfidence: 2,
      },
    },
  },
  {
    id: 'persona-2',
    name: 'Marcus - Software Engineer to PM',
    description: 'Senior Software Engineer pivoting to Product Manager, not passing first round',
    data: {
      personalInfo: {
        firstName: 'Marcus',
        lastName: 'Rodriguez',
        currentRole: 'Senior Software Engineer',
        careerStage: 'breaking_into_product',
        currentSalary: 140000,
      },
      goals: {
        targetRole: 'product_manager',
        timeline: '6_months',
        struggles: 'I get some interviews but rarely pass the first round. I find it difficult to communicate my technical background in a way that resonates with product hiring managers.',
        jobSearchStage: 'not_passing_first_round',
        interviewConfidence: 3,
      },
    },
  },
  {
    id: 'persona-3',
    name: 'Jessica - Current PM Seeking New Role',
    description: 'Product Manager looking for new role, struggling with later-stage interviews',
    data: {
      personalInfo: {
        firstName: 'Jessica',
        lastName: 'Kim',
        currentRole: 'Product Manager',
        careerStage: 'already_in_product_new_role',
        currentSalary: 120000,
      },
      goals: {
        targetRole: 'senior_product_manager',
        timeline: '3_months',
        struggles: 'I pass first rounds but struggle with later interview stages. I need help with system design questions and product strategy discussions.',
        jobSearchStage: 'not_passing_later_rounds',
        interviewConfidence: 4,
      },
    },
  },
  {
    id: 'persona-4',
    name: 'David - UX Designer to PM',
    description: 'UX Designer pivoting to Product Manager, getting to final rounds but no offers',
    data: {
      personalInfo: {
        firstName: 'David',
        lastName: 'Thompson',
        currentRole: 'UX Designer',
        careerStage: 'breaking_into_product',
        currentSalary: 95000,
      },
      goals: {
        targetRole: 'product_manager',
        timeline: '1_year',
        struggles: 'I get to final rounds but don\'t receive offers. I think I need to improve my negotiation skills and better demonstrate my product thinking.',
        jobSearchStage: 'not_getting_offers',
        interviewConfidence: 4,
      },
    },
  },
  {
    id: 'persona-5',
    name: 'Emily - PM Seeking Promotion',
    description: 'Product Manager trying to get promoted, hasn\'t started actively applying yet',
    data: {
      personalInfo: {
        firstName: 'Emily',
        lastName: 'Watson',
        currentRole: 'Product Manager',
        careerStage: 'promotion',
        currentSalary: 115000,
      },
      goals: {
        targetRole: 'senior_product_manager',
        timeline: '6_months',
        struggles: 'I haven\'t started actively applying yet. I need help preparing my portfolio and resume to demonstrate my readiness for a senior role.',
        jobSearchStage: 'not_started',
        interviewConfidence: 3,
      },
    },
  },
  {
    id: 'persona-6',
    name: 'Alex - PM Seeking Better Fit',
    description: 'Product Manager getting offers but they\'re not the right fit',
    data: {
      personalInfo: {
        firstName: 'Alex',
        lastName: 'Martinez',
        currentRole: 'Product Manager',
        careerStage: 'already_in_product_new_role',
        currentSalary: 130000,
      },
      goals: {
        targetRole: 'director_of_product',
        timeline: '1_year',
        struggles: 'I\'m getting offers but they\'re not the right fit for me. I need help identifying the right opportunities and negotiating for what I want.',
        jobSearchStage: 'offers_not_right_fit',
        interviewConfidence: 5,
      },
    },
  },
  {
    id: 'persona-7',
    name: 'Priya - Senior Engineer to Senior PM',
    description: 'Principal Software Engineer pivoting to Senior PM, not getting interviews',
    data: {
      personalInfo: {
        firstName: 'Priya',
        lastName: 'Patel',
        currentRole: 'Principal Software Engineer',
        careerStage: 'breaking_into_product',
        currentSalary: 180000,
      },
      goals: {
        targetRole: 'senior_product_manager',
        timeline: '3_months',
        struggles: 'I\'m applying but not getting interviews. My technical background is strong but I need help translating that into product management language on my resume.',
        jobSearchStage: 'not_getting_interviews',
        interviewConfidence: 2,
      },
    },
  },
  {
    id: 'persona-8',
    name: 'Jordan - Marketing Manager to PM',
    description: 'Marketing Manager pivoting to Product Manager, not passing first round',
    data: {
      personalInfo: {
        firstName: 'Jordan',
        lastName: 'Lee',
        currentRole: 'Marketing Manager',
        careerStage: 'breaking_into_product',
        currentSalary: 85000,
      },
      goals: {
        targetRole: 'product_manager',
        timeline: '6_months',
        struggles: 'I get some interviews but rarely pass the first round. I need help demonstrating product thinking and technical understanding.',
        jobSearchStage: 'not_passing_first_round',
        interviewConfidence: 2,
      },
    },
  },
  {
    id: 'persona-9',
    name: 'Taylor - APM to PM',
    description: 'Associate Product Manager looking for PM role, struggling with later rounds',
    data: {
      personalInfo: {
        firstName: 'Taylor',
        lastName: 'Brown',
        currentRole: 'Associate Product Manager',
        careerStage: 'already_in_product_new_role',
        currentSalary: 95000,
      },
      goals: {
        targetRole: 'product_manager',
        timeline: '1_month',
        struggles: 'I pass first rounds but struggle with later interview stages. I need help with more advanced product strategy and system design questions.',
        jobSearchStage: 'not_passing_later_rounds',
        interviewConfidence: 3,
      },
    },
  },
  {
    id: 'persona-10',
    name: 'Morgan - Business Analyst to PM',
    description: 'Business Analyst pivoting to Product Manager, getting to finals but no offers',
    data: {
      personalInfo: {
        firstName: 'Morgan',
        lastName: 'Davis',
        currentRole: 'Business Analyst',
        careerStage: 'breaking_into_product',
        currentSalary: 70000,
      },
      goals: {
        targetRole: 'product_manager',
        timeline: '3_months',
        struggles: 'I get to final rounds but don\'t receive offers. I think I need to improve my closing skills and better articulate my value proposition.',
        jobSearchStage: 'not_getting_offers',
        interviewConfidence: 3,
      },
    },
  },
];

