import { Provider, Wallet } from "zksync-web3";

export const GetzkSyncSigner = (wallet: Wallet): Wallet => {
    const l2Provider = new Provider("https://zksync2-testnet.zksync.dev");
    const signer = wallet.connect(l2Provider)
    return signer;
}