import "../styles/globals.css";

import type { AppProps } from "next/app";
import Head from "next/head";

import { Web3Modal } from "@web3modal/react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import useIsMounted from "@/lib/hooks/useIsMounted";

const chains = [bsc, bscTestnet];
const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

function MyApp({ Component, pageProps }: AppProps) {
  const isMounted = useIsMounted();

  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>Domichain Airdrop</title>
      </Head>

      <WagmiConfig config={wagmiConfig}>
        <Component {...pageProps} />
        {isMounted && (
          <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
        )}
      </WagmiConfig>
    </>
  );
}

export default MyApp;
