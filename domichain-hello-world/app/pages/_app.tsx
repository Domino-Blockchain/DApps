import type { AppProps } from "next/app";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolletExtensionWalletAdapter } from "@solana/wallet-adapter-sollet"
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { endpoint } from "./api/utils/constants";
import "@solana/wallet-adapter-react-ui/styles.css";
import "../styles/globals.css";
import {DWalletExtensionWalletAdapter} from "dwallet"
import Head from "next/head";


function MyApp({ Component, pageProps }: AppProps) {
  const phantomWallet = new PhantomWalletAdapter();
  const solletWallet = new SolletExtensionWalletAdapter();
  // FIXME: Remove hardcoded long timeout once adapter gets fixed
  const dwallet = new DWalletExtensionWalletAdapter({ timeout: 500 * 1000 });

  return (
    <>
      <Head>
        <title>Example Domichain DApp</title>
      </Head>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[phantomWallet, solletWallet, dwallet]}>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}

export default MyApp;
