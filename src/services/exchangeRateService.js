import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

// GET LIVE EXCHANGE INFO
export const getExchangeInfo = async (from, to, amount) => {
  try {
    const response = await axios.get(
      process.env.EXCHANGERATE_API_URL,

      {
        params: {
          access_key: process.env.EXCHANGERATE_ACCESS_KEY,

          from,

          to,

          amount,
        },
      }
    );

    // API FAILURE
    if (!response.data.success) {
      throw new Error('Failed to fetch exchange rate', {
        cause: response.data,
      });
    }

    return {
      data: response.data,

      exchangeRate: response.data.info.quote,

      convertedAmount: response.data.result,
    };
  } catch (error) {
    console.log('Exchange API Error:', error.response?.data || error.message);
  }
};

// FX FEES
export const calculateFXFee = (amount) => {
  const feePercent = 1;

  return amount * (feePercent / 100);
};
