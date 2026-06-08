import { Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers';

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
    console.log(error.message);
    throw error;
  }
};
