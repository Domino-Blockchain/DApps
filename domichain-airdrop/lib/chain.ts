import { bsc, bscTestnet } from "wagmi/chains";

export const chain = Boolean(process.env.NEXT_PUBLIC_USE_TESTNET)
  ? bscTestnet
  : bsc;
