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

// XRP price
export const getXRPPrice = async (fiatCurrency = 'usd') => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
        },
        params: {
          ids: 'ripple',
          vs_currencies: fiatCurrency,
        },
      }
    );

    return Number(response.data.ripple[fiatCurrency.toLowerCase()]);
  } catch (error) {
    throw new Error('Failed to fetch XRP price', { cause: error });
  }
};

// ETH price
export const getETHPrice = async (fiatCurrency = 'usd') => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
        },
        params: {
          ids: 'ethereum',
          vs_currencies: fiatCurrency,
        },
      }
    );

    return Number(response.data.ethereum[fiatCurrency.toLowerCase()]);
  } catch (error) {
    throw new Error('Failed to fetch ETH price', { cause: error });
  }
};

// ---------------------------
// XRP USD PRICE
// ---------------------------
export const getXRPPriceUSD = async () => {
  const response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: 'ripple',
        vs_currencies: 'usd',
      },

      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
      },
    }
  );

  return response.data.ripple.usd;
};

//get eth to usd
export const getETHPriceUSD = async () => {
  const response = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price',
    {
      params: {
        ids: 'ethereum',
        vs_currencies: 'usd',
      },
      headers: {
        'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
      },
    }
  );

  return response.data.ethereum.usd;
};
