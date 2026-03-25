import Joi from 'joi'

export const registerSchema = Joi.object({
  name: Joi.string().trim(),
  fullName: Joi.string().trim(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
}).or('name', 'fullName')

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export const googleAuthSchema = Joi.object({
  credential: Joi.string().trim().required()
})

export const resumeUploadSchema = Joi.object({
  userId: Joi.string().required()
})

export const rexcodePromptSchema = Joi.object({
  prompt: Joi.string().min(5).max(2000).required(),
  userId: Joi.string().required()
})
