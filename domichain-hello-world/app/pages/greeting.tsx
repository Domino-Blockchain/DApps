import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import useIsMounted from "./api/utils/useIsMounted";
import styles from "../styles/Home.module.css";
import { reportGreetings, sendGreeting } from "./api/sendGreeting";

export default function Page() {
  const [greetingCount, setGreetingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { wallet } = useWallet();
  const mounted = useIsMounted();

  const updateGreetingCount = useCallback(async () => {
    if (wallet?.adapter?.connected) {
      try {
        const newGreetingsCount = await reportGreetings(wallet);
        setGreetingCount(newGreetingsCount);
      } catch (error) {
        console.error(error);
      }
    }
  }, [wallet?.adapter?.connected]);

  const handleOnClick = async () => {
    if (!wallet?.adapter?.connected) {
      return;
    }
    setLoading(true);
    try {
      await sendGreeting(wallet);
      await updateGreetingCount();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateGreetingCount();
  }, [updateGreetingCount]);

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>{mounted && <WalletMultiButton />}</div>

      <div className={styles.main}>
        <h1 className={styles.title}>You've got {greetingCount} greetings!</h1>

        {wallet?.adapter?.connected && (
          <div className={styles.message_bar}>
            <button className={styles.message_button} onClick={handleOnClick}>
              Increase that count
            </button>
          </div>
        )}

        {loading ? (
          <div className={styles.loader_bar}>
            <h2>Loading</h2>
            <div className={styles.loader} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
