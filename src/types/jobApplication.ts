export interface JobApplication {
  required: {
    // Personal Information
    firstName: string;
    lastName: string;
    email: string;
    phone: string;

    // Location Information
    city: string;
    country: string;

    // Work Eligibility
    legallyAuthorizedToWork: boolean;
    requireVisa: boolean;

    // Experience
    resume: File | string;
    coverLetter: File | string;
  },
  
  optional: {
    currentCompany: string;
    // Additional Personal Info
    middleName: string;
    preferredName: string;
    pronouns: string;
    linkedInUrl: string;
    portfolioUrl: string;
    personalWebsite: string;

    // Additional Location Info
    state: string;
    postalCode: string;

    // Desired Job Information
    desiredSalary: string;
    desiredLocation: string[];
    relocationWillingness: boolean;

    // Education
    education: {
      institution: string;
      degree: string;
      fieldOfStudy: string;
      graduationYear: number;
      gpa: number;
    }[],

    // Additional Documents
    additionalFiles: File[];

    // Diversity & Inclusion
    gender: string;
    ethnicity: string;
    veteranStatus: string;
    disabilityStatus: string;

    // Custom Questions
    customResponses: {
      questionId: string;
      response: string;
    }[],

    // References
    references: {
      name: string;
      relationship: string;
      email: string;
      phone: string;
    }[]
  }
}