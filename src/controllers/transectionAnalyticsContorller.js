import EthereumTransaction from '../models/EthereumTransection.js';
import Transection from '../models/Transection.js';

// Compare XRPL vs Ethereum
export const compareNetworks = async (req, res) => {
  try {
    const xrplTransactions = await Transection.find();

    const ethTransactions = await EthereumTransaction.find();

    const calculateStats = (transactions, network) => {
      if (transactions.length === 0) {
        return {
          network,
          totalTransactions: 0,
        };
      }

      const totalTransactions = transactions.length;

      const totalVolume = transactions.reduce(
        (sum, tx) => sum + (tx.amount || 0),
        0
      );

      const avgSettlementTime =
        transactions.reduce(
          (sum, tx) => sum + (tx.processingTimeSeconds || 0),
          0
        ) / totalTransactions;

      const fastestSettlement = Math.min(
        ...transactions.map((tx) => tx.processingTimeSeconds || 0)
      );

      const slowestSettlement = Math.max(
        ...transactions.map((tx) => tx.processingTimeSeconds || 0)
      );

      const avgFXFee =
        transactions.reduce((sum, tx) => sum + (tx.fxFee || 0), 0) /
        totalTransactions;

      const totalFXFee = transactions.reduce(
        (sum, tx) => sum + (tx.fxFee || 0),
        0
      );

      const avgNetworkFeeUSD =
        transactions.reduce((sum, tx) => sum + (tx.networkFeeUSD || 0), 0) /
        totalTransactions;

      const totalNetworkFeeUSD = transactions.reduce(
        (sum, tx) => sum + (tx.networkFeeUSD || 0),
        0
      );

      const avgTotalCostUSD =
        transactions.reduce((sum, tx) => sum + (tx.totalCostUSD || 0), 0) /
        totalTransactions;

      const totalCostUSD = transactions.reduce(
        (sum, tx) => sum + (tx.totalCostUSD || 0),
        0
      );

      const amlClear = transactions.filter(
        (tx) => tx.amlStatus === 'clear'
      ).length;

      const amlReview = transactions.filter(
        (tx) => tx.amlStatus === 'under_review'
      ).length;

      const amlBlocked = transactions.filter(
        (tx) => tx.amlStatus === 'blocked'
      ).length;

      return {
        network,

        totalTransactions,

        totalVolume,

        avgSettlementTime,

        fastestSettlement,

        slowestSettlement,

        avgFXFee,

        totalFXFee,

        avgNetworkFeeUSD,

        totalNetworkFeeUSD,

        avgTotalCostUSD,

        totalCostUSD,

        amlClear,

        amlReview,

        amlBlocked,
      };
    };

    const xrplStats = calculateStats(xrplTransactions, 'XRPL');

    const ethStats = calculateStats(ethTransactions, 'ETHEREUM');

    return res.status(200).json({
      thesisComparison: {
        cheaperNetwork:
          xrplStats.avgNetworkFeeUSD < ethStats.avgNetworkFeeUSD
            ? 'XRPL'
            : 'ETHEREUM',

        fasterNetwork:
          xrplStats.avgSettlementTime < ethStats.avgSettlementTime
            ? 'XRPL'
            : 'ETHEREUM',
      },

      xrpl: xrplStats,

      ethereum: ethStats,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Analytics failed',
      error: error.message,
    });
  }
};

//xrp transaction analytics
// analyticsController.js
// ============================================================
// TRANSACTION ANALYTICS — single endpoint, everything included
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ============================================================
export const getTransactionAnalytics = async (req, res) => {
  try {
    const { from, to } = req.query;

    const dateMatch = {};
    if (from || to) {
      dateMatch.createdAt = {};
      if (from) dateMatch.createdAt.$gte = new Date(from);
      if (to) dateMatch.createdAt.$lte = new Date(to);
    }

    const result = await Transection.aggregate([
      { $match: dateMatch },
      {
        $facet: {
          // ---- overview counts ----
          overview: [
            {
              $group: {
                _id: null,
                totalTransactions: { $sum: 1 },
                completedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                failedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                },
                pendingCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                totalVolumeSourceCurrency: { $sum: '$amount' },
                totalVolumeUSD: { $sum: '$totalCostUSD' },
                totalNetworkFeeXRP: { $sum: '$networkFeeXRP' },
                totalNetworkFeeUSD: { $sum: '$networkFeeUSD' },
                totalFxFee: { $sum: '$fxFee' },
              },
            },
            {
              $project: {
                _id: 0,
                totalTransactions: 1,
                completedCount: 1,
                failedCount: 1,
                pendingCount: 1,
                successRatePercent: {
                  $cond: [
                    { $eq: ['$totalTransactions', 0] },
                    0,
                    {
                      $multiply: [
                        { $divide: ['$completedCount', '$totalTransactions'] },
                        100,
                      ],
                    },
                  ],
                },
                totalVolumeSourceCurrency: 1,
                totalVolumeUSD: 1,
                totalNetworkFeeXRP: 1,
                totalNetworkFeeUSD: 1,
                totalFxFee: 1,
              },
            },
          ],

          // ---- processing time (completed only) ----
          processingTimeStats: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                avgProcessingTimeMs: { $avg: '$processingTimeMs' },
                minProcessingTimeMs: { $min: '$processingTimeMs' },
                maxProcessingTimeMs: { $max: '$processingTimeMs' },
                avgProcessingTimeSeconds: { $avg: '$processingTimeSeconds' },
                minProcessingTimeSeconds: { $min: '$processingTimeSeconds' },
                maxProcessingTimeSeconds: { $max: '$processingTimeSeconds' },
              },
            },
            { $project: { _id: 0 } },
          ],

          // ---- network fee stats (completed only) ----
          networkFeeStats: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: null,
                avgNetworkFeeXRP: { $avg: '$networkFeeXRP' },
                minNetworkFeeXRP: { $min: '$networkFeeXRP' },
                maxNetworkFeeXRP: { $max: '$networkFeeXRP' },
                totalNetworkFeeXRP: { $sum: '$networkFeeXRP' },
                avgNetworkFeeUSD: { $avg: '$networkFeeUSD' },
                totalNetworkFeeUSD: { $sum: '$networkFeeUSD' },
              },
            },
            { $project: { _id: 0 } },
          ],

          // ---- status breakdown ----
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, status: '$_id', count: 1 } },
            { $sort: { count: -1 } },
          ],

          // ---- settlement network breakdown ----
          settlementNetworkBreakdown: [
            {
              $group: {
                _id: '$settlementNetwork',
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, settlementNetwork: '$_id', count: 1 } },
          ],

          // ---- currency corridor breakdown (source -> destination) ----
          currencyCorridors: [
            {
              $group: {
                _id: {
                  source: '$sourceCurrency',
                  destination: '$destinationCurrency',
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                avgExchangeRate: { $avg: '$exchangeRate' },
              },
            },
            {
              $project: {
                _id: 0,
                sourceCurrency: '$_id.source',
                destinationCurrency: '$_id.destination',
                count: 1,
                totalAmount: 1,
                avgExchangeRate: 1,
              },
            },
            { $sort: { count: -1 } },
          ],

          // ---- country corridor breakdown (sender -> receiver country) ----
          countryCorridors: [
            {
              $group: {
                _id: {
                  senderCountry: '$senderCountry',
                  receiverCountry: '$receiverCountry',
                },
                count: { $sum: 1 },
                totalVolumeUSD: { $sum: '$totalCostUSD' },
              },
            },
            {
              $project: {
                _id: 0,
                senderCountry: '$_id.senderCountry',
                receiverCountry: '$_id.receiverCountry',
                count: 1,
                totalVolumeUSD: 1,
              },
            },
            { $sort: { count: -1 } },
          ],

          // ---- AML stats ----
          amlStats: [
            {
              $group: {
                _id: '$amlStatus',
                count: { $sum: 1 },
                avgRiskScore: { $avg: '$riskScore' },
              },
            },
            {
              $project: {
                _id: 0,
                amlStatus: '$_id',
                count: 1,
                avgRiskScore: 1,
              },
            },
            { $sort: { count: -1 } },
          ],

          // ---- volume over time (daily) ----
          dailyVolume: [
            { $match: { status: 'completed' } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                totalVolumeUSD: { $sum: '$totalCostUSD' },
                totalNetworkFeeXRP: { $sum: '$networkFeeXRP' },
                avgProcessingTimeMs: { $avg: '$processingTimeMs' },
              },
            },
            {
              $project: {
                _id: 0,
                date: '$_id',
                count: 1,
                totalAmount: 1,
                totalVolumeUSD: 1,
                totalNetworkFeeXRP: 1,
                avgProcessingTimeMs: 1,
              },
            },
            { $sort: { date: 1 } },
          ],

          // ---- most recent failed transactions (for debugging) ----
          recentFailed: [
            { $match: { status: 'failed' } },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
              $project: {
                _id: 1,
                sender: 1,
                receiver: 1,
                amount: 1,
                sourceCurrency: 1,
                destinationCurrency: 1,
                amlStatus: 1,
                amlReasons: 1,
                createdAt: 1,
              },
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};
