import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usdtTestnetABI,
  usdtTestnetContractAddress,
} from "@/lib/abi/usdtTestnet";
import { chain } from "@/lib/chain";
import { useDebounce } from "@/lib/hooks/useDebounce";
import useIsMounted from "@/lib/hooks/useIsMounted";
import { Web3Button } from "@web3modal/react";
import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { P, match } from "ts-pattern";
import { parseEther } from "viem";
import {
  useAccount,
  useContractWrite,
  useMutation,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";

export default function Page() {
  const isMounted = useIsMounted();

  const { isConnected } = useAccount();
  const { chain: currentChain } = useNetwork();
  const { isLoading: isSwitching, switchNetwork } = useSwitchNetwork({
    chainId: chain.id,
  });

  const [tokenAmount, setTokenAmount] = React.useState("");
  const debouncedTokenAmount = parseFloat(useDebounce(tokenAmount));

  const router = useRouter();
  const recipientAddress = router.query["recipient"] as string;
  const hasRecipientAddress =
    typeof recipientAddress === "string" && recipientAddress.length >= 32;
  // prettier-ignore
  const shortenedRecipientAddress =
    `${recipientAddress?.slice(0, 4)}...${recipientAddress?.slice(-4)}`;

  const preparedUsdtContractWrite = usePrepareContractWrite({
    abi: usdtTestnetABI,
    address: usdtTestnetContractAddress,
    functionName: "transfer",
    args: [
      process.env.NEXT_PUBLIC_USDT_RECIPIENT_ADDRESS as never,
      isNaN(debouncedTokenAmount)
        ? BigInt(0)
        : parseEther(String(debouncedTokenAmount)),
    ],
    chainId: chain.id,
    enabled: Boolean(debouncedTokenAmount),
  });

  const usdtContractWrite = useContractWrite(preparedUsdtContractWrite.config);
  const usdtTransaction = useWaitForTransaction(usdtContractWrite.data);

  const completeTransactionMutation = useMutation(
    async ({
      transactionHash,
      recipientAddress,
    }: {
      transactionHash: string;
      recipientAddress: string;
    }) => {
      const response = await fetch(
        process.env.NEXT_PUBLIC_HANDLE_TRANSACTION_URL!,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionHash: transactionHash,
            recipientAddress: recipientAddress,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to complete transaction: ${response}`);
      }
      return await response.json();
    },
    {
      retry: true,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  useEffect(() => {
    if (
      usdtTransaction.isSuccess &&
      usdtTransaction.data &&
      !completeTransactionMutation.isLoading
    ) {
      completeTransactionMutation.mutate({
        transactionHash: usdtTransaction.data.transactionHash,
        recipientAddress: recipientAddress,
      });
    }
  }, [
    usdtTransaction.isSuccess,
    usdtTransaction.data,
    recipientAddress,
    completeTransactionMutation,
  ]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    usdtContractWrite.write?.();
    event.preventDefault();
  };

  const usingCorrectChain = currentChain?.id === chain.id;
  const isTransactionProcessing =
    usdtTransaction.isLoading || completeTransactionMutation.isLoading;

  return (
    <>
      <div className="absolute top-0 right-0 p-8">
        <Web3Button />
      </div>

      <main className="flex flex-col md:justify-center items-center min-h-screen px-8">
        <h1 className="text-center text-3xl font-bold pt-44 md:pt-0 pb-16">
          Domichain Airdrop
        </h1>

        <div className="flex flex-col w-full max-w-lg space-y-8">
          {match([hasRecipientAddress, completeTransactionMutation.isSuccess])
            // [hasRecipientAddress, completeTransactionMutation.isSuccess]
            .with([true, true], () => (
              <Alert className="border-green-700/50 text-green-700 [&>svg]:text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription className="">
                  <span className="font-semibold">
                    {debouncedTokenAmount} DOMI
                  </span>{" "}
                  has been sent to{" "}
                  <span className="font-semibold">
                    {shortenedRecipientAddress}
                  </span>
                </AlertDescription>
              </Alert>
            ))
            // [hasRecipientAddress, completeTransactionMutation.isSuccess]
            .with([true, false], () => (
              <Alert variant="default">
                <Wallet className="h-4 w-4" />
                <AlertTitle>Airdrop Recipient Wallet</AlertTitle>
                <AlertDescription className="break-words">
                  This airdrop will be received by{" "}
                  <span className="font-semibold">
                    {shortenedRecipientAddress}
                  </span>
                  , make sure it&apos;s yours.
                </AlertDescription>
              </Alert>
            ))
            // [hasRecipientAddress, completeTransactionMutation.isSuccess]
            .with([false, P._], () => (
              <Alert variant="destructive">
                <Wallet className="h-4 w-4" />
                <AlertTitle>No Recipient Wallet Specified</AlertTitle>
                <AlertDescription className="break-words">
                  Try to open the Dapp again and make sure that the URL ends
                  with{" "}
                  <span className="font-mono bg-gray-100 rounded-sm px-1">
                    ?/recipient=YOUR_WALLET_ADDRESS
                  </span>
                </AlertDescription>
              </Alert>
            ))
            .exhaustive()}

          {match([
            isMounted,
            hasRecipientAddress,
            isConnected,
            usingCorrectChain,
          ])
            // [isMounted, hasRecipientAddress, isConnected, usingCorrectChain]
            .with([true, true, true, true], () => (
              <form className="flex flex-col" onSubmit={handleSubmit}>
                <div className="flex flex-row space-x-2">
                  <div className="flex flex-col w-full space-y-2">
                    <Label htmlFor="usdtAmount">USDT Amount</Label>
                    <div className="relative flex items-center space-x-2">
                      <div className="flex flex-grow">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500">$</span>
                        </div>

                        <Input
                          className="pl-6"
                          lang="en"
                          placeholder="0.0"
                          type="number"
                          inputMode="decimal"
                          min={0.0}
                          step={0.1}
                          max={10000}
                          value={tokenAmount}
                          onChange={(event) =>
                            setTokenAmount(event.target.value)
                          }
                          disabled={isTransactionProcessing}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    className="self-end"
                    type="submit"
                    disabled={
                      isTransactionProcessing || !usdtContractWrite.write
                    }
                  >
                    {isTransactionProcessing && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isTransactionProcessing ? "Processing…" : "Transfer"}
                  </Button>
                </div>
              </form>
            ))
            // [isMounted, hasRecipientAddress, isConnected, usingCorrectChain]
            .with([true, P.boolean, true, false], () => (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unsupported Network</AlertTitle>
                <AlertDescription>
                  Please switch your wallet over to {chain.name}
                </AlertDescription>
                <Button
                  className="mt-2"
                  variant="destructive"
                  onClick={() => switchNetwork?.()}
                  disabled={isSwitching}
                >
                  {isSwitching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Switch Network
                </Button>
              </Alert>
            ))
            // [isMounted, hasRecipientAddress, isConnected, usingCorrectChain]
            .with([true, P.boolean, false, P.boolean], () => (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ethereum Wallet is required</AlertTitle>
                <AlertDescription>
                  Please connect your wallet before you proceed.
                </AlertDescription>
              </Alert>
            ))
            .otherwise(() => null)}
        </div>
      </main>
    </>
  );
}
