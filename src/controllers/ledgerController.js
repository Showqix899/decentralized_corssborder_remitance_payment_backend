// controllers/testNetLedgerController.js

import TestNetLedger from '../models/Ledger.js';

// @desc    Get current user's ledgers
// @route   GET /api/testnet-ledgers
// @access  Private

export const getUserLedgers = async (req, res) => {
  try {
    const { address, sort = 'newest', page = 1, limit = 10 } = req.query;

    const currentPage = Math.max(parseInt(page), 1);
    const perPage = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (currentPage - 1) * perPage;

    const userId = req.user._id;

    const matchStage = {
      $or: [{ sender: userId }, { receiver: userId }],
    };

    if (address) {
      matchStage.$and = [
        { $or: [{ sender: userId }, { receiver: userId }] },
        { $or: [{ sender_address: address }, { receiver_address: address }] },
      ];
      delete matchStage.$or;
    }

    // Decide sort field + direction + whether it needs numeric conversion
    let sortField = 'close_time_iso';
    let sortDir = -1;
    let numeric = false;

    switch (sort) {
      case 'highest':
        sortField = 'xrp_amount_numeric';
        sortDir = -1;
        numeric = true;
        break;
      case 'lowest':
        sortField = 'xrp_amount_numeric';
        sortDir = 1;
        numeric = true;
        break;
      case 'oldest':
        sortField = 'close_time_iso';
        sortDir = 1;
        break;
      case 'newest':
      default:
        sortField = 'close_time_iso';
        sortDir = -1;
        break;
    }

    const pipeline = [
      { $match: matchStage },
      ...(numeric
        ? [{ $addFields: { xrp_amount_numeric: { $toDouble: '$xrp_amount' } } }]
        : []),
      { $sort: { [sortField]: sortDir } },
      { $skip: skip },
      { $limit: perPage },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$sender', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'receiver',
          foreignField: '_id',
          as: 'receiver',
          pipeline: [{ $project: { name: 1, email: 1 } }],
        },
      },
      { $unwind: { path: '$receiver', preserveNullAndEmptyArrays: true } },
    ];

    const [ledgers, total] = await Promise.all([
      TestNetLedger.aggregate(pipeline),
      TestNetLedger.countDocuments(matchStage),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      success: true,
      data: ledgers,
      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error('Get user ledgers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ledgers',
    });
  }
};

// @desc    Search current user's ledgers
// @route   GET /api/testnet-ledgers/search
// @access  Private

export const searchLedgers = async (req, res) => {
  try {
    const {
      ledger_hash,
      ledger_index,
      date,
      source_currency,
      destination_currency,
      page = 1,
      limit = 10,
    } = req.query;

    // Pagination
    const currentPage = Math.max(parseInt(page), 1);

    const perPage = Math.min(Math.max(parseInt(limit), 1), 100);

    const skip = (currentPage - 1) * perPage;

    // Current user
    const userId = req.user._id;

    // Base query
    const query = {
      $or: [{ sender: userId }, { receiver: userId }],
    };

    // Ledger hash
    if (ledger_hash) {
      query.ledger_hash = ledger_hash;
    }

    // Ledger index
    if (ledger_index) {
      const index = Number(ledger_index);

      if (Number.isNaN(index)) {
        return res.status(400).json({
          success: false,
          message: 'ledger_index must be a number',
        });
      }

      query.ledger_index = index;
    }

    // Source currency
    if (source_currency) {
      query.source_currency = {
        $regex: source_currency,
        $options: 'i',
      };
    }

    // Destination currency
    if (destination_currency) {
      query.destination_currency = {
        $regex: destination_currency,
        $options: 'i',
      };
    }

    // Date
    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);

      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date',
        });
      }

      const endDate = new Date(startDate);

      endDate.setUTCDate(endDate.getUTCDate() + 1);

      query.close_time_iso = {
        $gte: startDate.toISOString(),
        $lt: endDate.toISOString(),
      };
    }

    // Fetch
    const ledgers = await TestNetLedger.find(query)
      .sort({ ledger_index: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .lean();

    // Count
    const total = await TestNetLedger.countDocuments(query);

    const totalPages = Math.ceil(total / perPage);

    return res.status(200).json({
      success: true,

      data: ledgers,

      pagination: {
        total,
        page: currentPage,
        limit: perPage,
        totalPages,

        hasNextPage: currentPage < totalPages,

        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error('Search ledger error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to search ledgers',
    });
  }
};

// @desc    Get ledger details
// @route   GET /api/testnet-ledgers/:identifier
// @access  Private

export const getLedgerDetails = async (req, res) => {
  try {
    const { identifier } = req.params;

    const userId = req.user._id;

    let query = {
      $or: [{ sender: userId }, { receiver: userId }],
    };

    // If numeric -> ledger index
    if (/^\d+$/.test(identifier)) {
      query.ledger_index = Number(identifier);
    } else {
      // Otherwise -> ledger hash
      query.ledger_hash = identifier;
    }

    const ledger = await TestNetLedger.findOne(query)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .lean();

    if (!ledger) {
      return res.status(404).json({
        success: false,
        message: 'Ledger not found',
      });
    }

    return res.status(200).json({
      success: true,

      data: ledger,
    });
  } catch (error) {
    console.error('Get ledger details error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ledger details',
    });
  }
};
