import { Schema, model, models } from 'mongoose'

const unsubscribeListSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
)

const UnsubscribeList = models.UnsubscribeList || model('UnsubscribeList', unsubscribeListSchema)
export default UnsubscribeList
