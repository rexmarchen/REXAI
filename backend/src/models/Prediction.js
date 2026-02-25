import mongoose from 'mongoose'

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  mlServicePredictionId: {
    type: String,
    description: 'Reference to the prediction stored in ML Service'
  },
  prediction: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 100
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Prediction = mongoose.model('Prediction', predictionSchema)
export default Prediction