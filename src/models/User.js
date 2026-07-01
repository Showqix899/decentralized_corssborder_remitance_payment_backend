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
      enum: ['pending', 'approved', 'rejected', 'in_review'],
      default: 'pending',
    },
    kyc_session_id: {
      type: String,
    },
    kyc_verification_url: String,
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

    wallets: {
      xrpl: {
        address: String,
        seed: String,
        publicKey: String,
        privateKey: String,
      },

      ethereum: {
        address: String,
        privateKey: String,
      },
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

    amlStatus: {
      type: String,
      enum: ['clear', 'under_review', 'blocked'],
      default: 'clear',
    },

    riskScore: {
      type: Number,
      default: 0,
    },
    amlReasons: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
