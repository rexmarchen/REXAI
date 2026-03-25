import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required() {
        return !this.authProviders?.google?.sub
      },
      minlength: 8,
      select: false
    },
    authProviders: {
      google: {
        sub: {
          type: String,
          trim: true
        },
        email: {
          type: String,
          trim: true,
          lowercase: true
        },
        picture: {
          type: String,
          trim: true
        }
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

userSchema.index({ 'authProviders.google.sub': 1 }, { unique: true, sparse: true })

userSchema.pre('save', async function() {
  if (!this.password || !this.isModified('password')) {
    return
  }

  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false
  }

  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model('User', userSchema)
export default User
