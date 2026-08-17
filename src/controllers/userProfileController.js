import User from '../models/User.js';
import Transection from '../models/Transection.js';

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Pagination
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    // Get user
    const user = await User.findById(userId).select(
      '-password -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -wallets.xrpl.seed -wallets.xrpl.privateKey -wallets.ethereum.privateKey'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Transaction filter
    const transactionFilter = {
      $or: [{ sender: userId }, { receiver: userId }],
    };

    // Total transaction count
    const totalTransactions =
      await Transection.countDocuments(transactionFilter);

    // Get paginated transactions
    const transactions = await Transection.find(transactionFilter)
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Statistics
    const statistics = await Transection.aggregate([
      {
        $match: transactionFilter,
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },

          completedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },

          pendingTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },

          failedTransactions: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
            },
          },

          totalCostUSD: {
            $sum: {
              $ifNull: ['$totalCostUSD', 0],
            },
          },
        },
      },
    ]);

    const totalPages = Math.ceil(totalTransactions / limit);

    return res.status(200).json({
      success: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        country: user.country,
        isVerified: user.isVerified,

        defaultCurrency: user.defaultCurrency,

        kycStatus: user.kycStatus,

        dateOfBirth: user.dateOfBirth,

        wallets: {
          xrpl: {
            address: user.wallets?.xrpl?.address,
            publicKey: user.wallets?.xrpl?.publicKey,
          },

          ethereum: {
            address: user.wallets?.ethereum?.address,
          },
        },

        role: user.role,

        amlStatus: user.amlStatus,
        riskScore: user.riskScore,
        amlReasons: user.amlReasons,

        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },

      statistics: statistics[0] || {
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        totalCostUSD: 0,
      },

      transactions,

      pagination: {
        currentPage: page,
        limit,
        totalTransactions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message,
    });
  }
};

const supportedCurrencies = [
  'USD',
  'CAD',
  'MXN',
  'EUR',
  'GBP',
  'CHF',
  'AED',
  'SAR',
  'QAR',
  'JPY',
  'CNY',
  'KRW',
  'SGD',
  'AUD',
  'NZD',
  'BDT',
  'INR',
  'PKR',
  'NGN',
  'ZAR',
  'XRP',
];

export const updateDefaultCurrency = async (req, res) => {
  try {
    const userId = req.user._id;
    const { defaultCurrency } = req.body;

    // Check currency is provided
    if (!defaultCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Default currency is required',
      });
    }

    // Normalize currency
    const currency = defaultCurrency.toUpperCase();

    // Validate currency
    if (!supportedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported currency',
        supportedCurrencies,
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        defaultCurrency: currency,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select('name email defaultCurrency');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Default currency updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        defaultCurrency: user.defaultCurrency,
      },
    });
  } catch (error) {
    console.error('Update default currency error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update default currency',
      error: error.message,
    });
  }
};
