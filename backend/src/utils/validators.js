import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  fullName: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().optional(),
  accountType: Joi.string().valid('user', 'student', 'faculty', 'educator').optional(),
  role: Joi.string().valid('user', 'student', 'faculty', 'educator').optional(),
  invitationCode: Joi.string().allow('', null).optional(),
  institutionName: Joi.string().allow('', null).max(200).optional(),
  department: Joi.string().allow('', null).max(150).optional(),
  agree: Joi.boolean().optional()
}).unknown(true)

export const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().required()
})

export const resumeUploadSchema = Joi.object({
  userId: Joi.string().required()
})

export const rexcodePromptSchema = Joi.object({
  prompt: Joi.string().min(5).max(2000).required(),
  userId: Joi.string().required()
})

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().optional(),
  token: Joi.string().optional(),
  credential: Joi.string().optional(),
  email: Joi.string().email().optional(),
  name: Joi.string().optional(),
  picture: Joi.string().optional()
}).unknown(true)

export const facultyProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  avatarUrl: Joi.string().allow('', null).optional(),
  professionalTitle: Joi.string().valid('Dr.', 'Professor', 'Prof.', 'Mr.', 'Ms.', 'Mrs.', 'Other').default('Professor'),
  designation: Joi.string().valid('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Faculty Member', 'Dean / Department Head', 'Other').default('Assistant Professor'),
  bio: Joi.string().allow('', null).max(3000).optional(),
  contactEmail: Joi.string().email().required().trim().lowercase(),
  phone: Joi.string().allow('', null).max(30).optional(),
  institutionName: Joi.string().trim().min(2).max(200).required(),
  institutionType: Joi.string().valid('University', 'College', 'School', 'Training Institute', 'Other').default('College'),
  department: Joi.string().trim().min(2).max(150).required(),
  city: Joi.string().allow('', null).max(100).optional(),
  state: Joi.string().allow('', null).max(100).optional(),
  country: Joi.string().allow('', null).max(100).optional(),
  website: Joi.string().allow('', null).max(300).optional(),
  employeeId: Joi.string().allow('', null).max(100).optional(),
  employmentType: Joi.string().valid('Full-time', 'Part-time', 'Visiting', 'Other').default('Full-time'),
  qualifications: Joi.array().items(
    Joi.object({
      degree: Joi.string().required().trim(),
      specialization: Joi.string().allow('', null).trim(),
      institution: Joi.string().required().trim(),
      graduationYear: Joi.number().integer().min(1950).max(2100).optional().allow(null)
    })
  ).optional(),
  teachingSubjects: Joi.array().items(Joi.string().trim()).optional(),
  yearsOfExperience: Joi.number().min(0).max(80).optional(),
  coursesTaught: Joi.array().items(Joi.string().trim()).optional(),
  certifications: Joi.array().items(Joi.string().trim()).optional(),
  researchInterests: Joi.array().items(Joi.string().trim()).optional(),
  achievements: Joi.array().items(Joi.string().trim()).optional()
}).unknown(true)

export const facultyVerificationSubmissionSchema = Joi.object({
  institutionalEmail: Joi.string().email().required().trim().lowercase(),
  employeeId: Joi.string().trim().required(),
  department: Joi.string().trim().required(),
  institutionName: Joi.string().trim().required(),
  idDocumentUrl: Joi.string().allow('', null).optional(),
  idDocumentName: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).max(2000).optional()
}).unknown(true)

export const facultyQuestionSchema = Joi.object({
  question: Joi.string().trim().min(3).required(),
  type: Joi.string().valid('multiple_choice', 'true_false', 'multiple_select', 'short_answer', 'code').default('multiple_choice'),
  code: Joi.string().allow('', null).optional(),
  language: Joi.string().allow('', null).optional(),
  options: Joi.array().items(Joi.string().trim().allow('')).optional(),
  correctIndex: Joi.number().integer().min(0).optional(),
  correctIndices: Joi.array().items(Joi.number().integer().min(0)).optional(),
  correctAnswer: Joi.string().allow('', null).optional(),
  explanation: Joi.string().allow('', null).optional(),
  subject: Joi.string().trim().min(2).required(),
  topic: Joi.string().trim().min(2).required(),
  difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Easy', 'Medium', 'Hard').default('Medium'),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  marks: Joi.number().min(0).default(1),
  negativeMarks: Joi.number().min(0).default(0)
}).unknown(true)