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
