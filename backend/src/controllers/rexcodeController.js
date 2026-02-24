import GeneratedSite from '../models/GeneratedSite.js'
import { catchAsync } from '../utils/catchAsync.js'
import AppError from '../utils/AppError.js'

export const generateCode = catchAsync(async (req, res, next) => {
  const { prompt } = req.body

  if (!prompt) {
    return next(new AppError('Prompt is required', 400))
  }

  const site = await GeneratedSite.create({
    userId: req.user.id,
    prompt,
    htmlCode: '<div>Generated code</div>',
    cssCode: 'body { color: black; }',
    jsCode: 'console.log("Generated")'
  })

  res.status(201).json({
    success: true,
    data: site
  })
})

export const getGeneratedSites = catchAsync(async (req, res, next) => {
  const sites = await GeneratedSite.find({ userId: req.user.id })

  res.status(200).json({
    success: true,
    data: sites
  })
})
