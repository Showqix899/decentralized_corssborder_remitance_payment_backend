import {
  Wallet,
  JsonRpcProvider,
  parseEther,
  formatEther,
  ethers,
} from 'ethers';

//create wallet
export const createEthereumWallet = () => {
  //creating ethereum wallet
  const wallet = Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

//send ETH
export const sendETH = async ({ senderPrivateKey, destination, amount }) => {
  try {
    const provider = new JsonRpcProvider(process.env.ETH_RPC_URL);

    const wallet = new Wallet(senderPrivateKey, provider);

    const tx = await wallet.sendTransaction({
      to: destination,
      value: parseEther(amount.toString()),
    });

    console.log('Transaction submitted:', tx.hash);

    const receipt = await tx.wait();

    const gasUsed = receipt.gasUsed;
    const gasPrice = receipt.gasPrice;

    const networkFeeWei = gasUsed * gasPrice;

    const networkFeeETH = Number(formatEther(networkFeeWei));

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: gasUsed.toString(),
      gasPrice: gasPrice.toString(),
      networkFeeETH,
    };
  } catch (error) {
    throw new Error(`errot at sending eth`, { cause: error });
  }
};

//get wallet balance
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);

export const getETHBalance = async (address) => {
  try {
    const balanceWei = await provider.getBalance(address);

    const balanceETH = ethers.formatEther(balanceWei);

    return balanceETH;
  } catch (error) {
    throw new Error(`failed to fetch error ${error.message}`, { cause: error });
  }
};
