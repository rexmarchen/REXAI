import { Schema, model, models } from 'mongoose'

const resumeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    fileUrl: String,
    extractedText: String,
    sections: {
      summary: String,
      experience: [
        {
          company: String,
          role: String,
          duration: String,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          year: String,
          gpa: String,
        },
      ],
      skills: {
        type: [String],
        default: [],
      },
      projects: [
        {
          name: String,
          description: String,
          techStack: {
            type: [String],
            default: [],
          },
          link: String,
        },
      ],
      certifications: [
        {
          name: String,
          issuer: String,
          year: String,
        },
      ],
    },
    aiScore: Number,
    aiFeedback: {
      overall: String,
      strengths: {
        type: [String],
        default: [],
      },
      weaknesses: {
        type: [String],
        default: [],
      },
      suggestions: {
        type: [String],
        default: [],
      },
      atsScore: Number,
      keywordsFound: {
        type: [String],
        default: [],
      },
      keywordsMissing: {
        type: [String],
        default: [],
      },
    },
    version: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

const Resume = models.Resume || model('Resume', resumeSchema)
export default Resume
