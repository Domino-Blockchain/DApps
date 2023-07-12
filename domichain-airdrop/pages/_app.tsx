import "../styles/globals.css";

import type { AppProps } from "next/app";
import Head from "next/head";

import { chain } from "@/lib/chain";
import useIsMounted from "@/lib/hooks/useIsMounted";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { WagmiConfig, configureChains, createConfig } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

const { publicClient } = configureChains([chain], [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains: [chain] }),
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, [chain]);

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
          <Web3Modal
            projectId={projectId}
            ethereumClient={ethereumClient}
            defaultChain={chain}
          />
        )}
      </WagmiConfig>
    </>
  );
}

export default MyApp;
