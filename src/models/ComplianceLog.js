import mongoose from 'mongoose';

const complianceLogSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    riskScore: Number,

    amlStatus: String,

    reasons: [String],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ComplianceLog', complianceLogSchema);
