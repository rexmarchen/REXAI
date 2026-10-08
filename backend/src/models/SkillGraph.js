import mongoose from 'mongoose'

const ActionTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['quiz', 'challenge', 'arena', 'tutor', 'project'],
    default: 'tutor'
  },
  title: { type: String, required: true },
  desc: { type: String, default: '' },
  url: { type: String, required: true },
  badge: { type: String, default: '' },
  actionLabel: { type: String, default: 'Learn More →' }
}, { _id: false })

const SubSkillSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  glyph: { type: String, default: 'code' },
  category: { type: String, default: 'Core' },
  primaryAction: {
    type: {
      type: String,
      enum: ['quiz', 'challenge', 'arena', 'tutor', 'project'],
      default: 'tutor'
    },
    title: { type: String, default: '' },
    label: { type: String, default: 'Learn More' },
    url: { type: String, default: '' }
  },
  whatToDo: [ActionTaskSchema]
}, { _id: false })

const ClusterSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  categoryTag: { type: String, default: null },
  color: { type: String, default: '#0284C7' },
  theme: { type: String, default: 'blue' },
  icon: { type: String, default: 'layers' },
  subSkills: [SubSkillSchema]
}, { _id: false })

const SkillGraphSchema = new mongoose.Schema({
  roleId: { type: String, required: true, unique: true, index: true },
  roleName: { type: String, required: true },
  domain: { type: String, default: 'engineering' },
  isAIGenerated: { type: Boolean, default: false },
  createdBy: { type: String, default: 'system' },
  centerNode: {
    id: { type: String, default: 'center-goal' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '0% complete' },
    icon: { type: String, default: 'brain' },
    status: { type: String, default: 'in-progress' }
  },
  clusters: [ClusterSchema],
  recommendedSkills: [{
    rank: { type: Number, default: 1 },
    name: { type: String, required: true },
    reason: { type: String, default: '' },
    actionType: { type: String, default: 'tutor' },
    actionUrl: { type: String, default: '' },
    actionLabel: { type: String, default: 'Learn More' },
    taskTitle: { type: String, default: '' },
    category: { type: String, default: 'General' },
    xp: { type: Number, default: 50 }
  }],
  quote: {
    text: { type: String, default: 'Small steps every day lead to big results.' },
    author: { type: String, default: 'REXION' }
  }
}, { timestamps: true })

export const SkillGraph = mongoose.model('SkillGraph', SkillGraphSchema)
export default SkillGraph
