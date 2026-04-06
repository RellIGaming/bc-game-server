import { ethers } from "ethers"

export const verifyCryptoTx = async (txHash) => {

  const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC)

  const tx = await provider.getTransactionReceipt(txHash)

  if (!tx)
    return false

  if (tx.status !== 1)
    return false

  return true
}