/**
 * Innovation 360 Data Model
 * Represents the 12-stage circular innovation journey
 */

export type Department = 'HCD' | 'Zucker' | 'Office of Innovation' | 'Health Solutions';

export interface Innovation360Stage {
  id: number;
  title: string;
  department: Department;
  description: string;
  icon?: string;
  subLabel?: string;
}

export interface InnovationProject {
  id: string;
  name: string;
  description: string;
  currentStage: number;
  completedStages: number[];
  createdAt: string;
  updatedAt: string;
  team?: string[];
  tags?: string[];
}

// The 12 stages of MUSC Innovation 360
export const INNOVATION_STAGES: Innovation360Stage[] = [
  {
    id: 1,
    title: 'Clinical Need Discovery',
    department: 'HCD',
    description: 'Identify unmet clinical needs through human-centered design research and observation. Engage with clinicians, patients, and stakeholders to discover opportunities for innovation.',
    subLabel: 'Macro-Level'
  },
  {
    id: 2,
    title: 'Opportunity Validation',
    department: 'Zucker',
    description: 'Validate market opportunity and commercial viability. Assess the potential impact, market size, and competitive landscape for the identified need.',
    subLabel: 'Macro-Level'
  },
  {
    id: 3,
    title: 'Concept Ideation & Early Solutioning',
    department: 'HCD',
    description: 'Brainstorm and prototype early-stage solutions. Use design thinking methodologies to explore multiple approaches and iterate rapidly.',
    subLabel: 'Macro-Level'
  },
  {
    id: 4,
    title: 'Invention Disclosure',
    department: 'Zucker',
    description: 'Document and disclose your invention to protect intellectual property. Work with legal teams to assess patentability and IP strategy.',
  },
  {
    id: 5,
    title: 'Patent & IP Development',
    department: 'Zucker',
    description: 'File provisional or full patents. Develop comprehensive IP protection strategy including trademarks, copyrights, and trade secrets.',
  },
  {
    id: 6,
    title: 'Mentor Assignment',
    department: 'Office of Innovation',
    description: 'Connect with experienced mentors and advisors. Receive guidance on technical development, business strategy, and regulatory pathways.',
  },
  {
    id: 7,
    title: 'Strategic Direction & Regulatory Mapping',
    department: 'Health Solutions',
    description: 'Define strategic direction and map regulatory requirements. Plan FDA pathways, compliance strategies, and clinical trial design.',
  },
  {
    id: 8,
    title: 'Accelerator Program Enrollment',
    department: 'Office of Innovation',
    description: 'Join structured accelerator programs for intensive support. Access resources, training, and networking opportunities to fast-track development.',
  },
  {
    id: 9,
    title: 'Funding Strategy & Resource Support',
    department: 'Office of Innovation',
    description: 'Develop funding strategy and secure resources. Explore grants, investment, partnerships, and institutional support mechanisms.',
  },
  {
    id: 10,
    title: 'Prototype Development & Testing',
    department: 'HCD',
    description: 'Build functional prototypes and conduct user testing. Iterate based on feedback and validate technical feasibility.',
  },
  {
    id: 11,
    title: 'Clinical Pilot & Evaluation',
    department: 'Health Solutions',
    description: 'Execute clinical pilots and evaluate outcomes. Collect real-world evidence and refine solution based on clinical results.',
    subLabel: 'Operational Deployment'
  },
  {
    id: 12,
    title: 'Business Formation & Commercialization Prep',
    department: 'Zucker',
    description: 'Form business entity and prepare for commercialization. Develop go-to-market strategy, pricing, and distribution channels.',
  },
];

// Department color mapping based on the provided design
export const DEPARTMENT_COLORS: Record<Department, string> = {
  'HCD': '#0EA5E9', // Blue (cyan-500)
  'Zucker': '#E91E63', // Magenta (pink-500)
  'Office of Innovation': '#FFC107', // Yellow (amber-500)
  'Health Solutions': '#FF6B35', // Orange
};
