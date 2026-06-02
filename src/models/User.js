import mongoose from 'mongoose';

//userSchema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    nid_no: {
      type: String,
      required: true,
    },
    passport_no: {
      type: String,
      default: null,
    },

    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    governmentIdNumber: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },

    verificationToken: String,

    verificationTokenExpires: Date,

    resetPasswordToken: String,

    resetPasswordExpires: Date,

    wallet: {
      address: String,

      seed: String,

      publicKey: String,

      privateKey: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    balances: {
      type: Map,

      of: Number,

      default: {
        USD: 1000,
        XRP: 1000,
        BDT: 50000,
      },
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
