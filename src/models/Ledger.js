import mongoose from 'mongoose';

const testNetLedgerSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    ledger_hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    parent_ledger_hash: {
      type: String,
      required: true,
      index: true,
    },

    ledger_index: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    validated: {
      type: Boolean,
      required: true,
      default: false,
    },

    close_time_human: {
      type: String,
      required: true,
    },

    close_time_iso: {
      type: String,
      required: true,
    },

    transaction_hash: {
      type: String,
      required: true,
    },

    xrp_amount: {
      type: String,
      required: true,
    },

    source_currency: {
      type: String,
      required: true,
    },

    destination_currency: {
      type: String,
      required: true,
    },

    source_currency_amount: {
      type: String,
      required: true,
    },

    destination_currency_amount: {
      type: String,
      required: true,
    },

    sender_address: {
      type: String,
      required: true,
    },

    receiver_address: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TestNetLedger = mongoose.model('TestNetLedger', testNetLedgerSchema);

export default TestNetLedger;
