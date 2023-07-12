import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  usdtMainnetABI,
  usdtMainnetContractAddress,
} from "@/lib/abi/usdtMainnet";
import {
  usdtTestnetABI,
  usdtTestnetContractAddress,
} from "@/lib/abi/usdtTestnet";
import { chain } from "@/lib/chain";
import { useCompleteTransaction } from "@/lib/completeTransaction";
import { useDebounce } from "@/lib/hooks/useDebounce";
import useIsMounted from "@/lib/hooks/useIsMounted";
import { Web3Button } from "@web3modal/react";
import clsx from "clsx";
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { queryTypes, useQueryState } from "next-usequerystate";
import Image from "next/image";
import React, { useState } from "react";
import { P, match } from "ts-pattern";
import { parseEther } from "viem";
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWaitForTransaction,
} from "wagmi";

const useTestnetContract = Boolean(process.env.NEXT_PUBLIC_USE_TESTNET);

export default function Page() {
  const isMounted = useIsMounted();

  const { isConnected } = useAccount();
  const { chain: currentChain } = useNetwork();
  const { isLoading: isSwitching, switchNetwork } = useSwitchNetwork();

  const [tokenAmount, setTokenAmount] = useState("");
  const debouncedTokenAmount = parseFloat(useDebounce(tokenAmount));

  const [recipientAddress, setRecipientAddress] = useQueryState(
    "recipient",
    queryTypes.string.withDefault("")
  );
  const isRecipientAddressValid =
    isMounted && /[1-9A-HJ-NP-Za-km-z]{32,44}/.test(recipientAddress);
  // prettier-ignore
  const shortenedRecipientAddress =
    `${recipientAddress?.slice(0, 4)}...${recipientAddress?.slice(-4)}`;

  const preparedUsdtContractWrite = usePrepareContractWrite({
    // @ts-expect-error
    abi: useTestnetContract ? usdtTestnetABI : usdtMainnetABI,
    address: useTestnetContract
      ? usdtTestnetContractAddress
      : usdtMainnetContractAddress,
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
  const completeTransaction = useCompleteTransaction();

  const usdtTransaction = useWaitForTransaction({
    hash: usdtContractWrite.data?.hash,
    onSuccess(data) {
      completeTransaction.mutate({
        transactionHash: data.transactionHash,
        recipientAddress: recipientAddress,
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    completeTransaction.reset();
    usdtContractWrite.write?.();
    event.preventDefault();
  };

  const usingCorrectChain = currentChain?.id === chain.id;
  const isTransactionProcessing =
    usdtTransaction.isLoading || completeTransaction.isLoading;

  return (
    <>
      <div className="absolute top-0 right-0 p-8">
        <Web3Button />
      </div>

      <main className="flex flex-col md:justify-center items-center min-h-screen px-8 py-8 select-none">
        <header className="flex flex-row justify-center items-center space-x-4 pt-32 md:pt-0 pb-12">
          <Image alt="DAirdrop Logo" src="/logo.png" width={48} height={48} />
          <span className="text-4xl font-bold">DAirdrop</span>
        </header>

        <div className="flex flex-col w-full max-w-lg space-y-8">
          {match([isMounted, isConnected, completeTransaction])
            .with([true, true, { isSuccess: true }], () => (
              <Alert className="border-green-700/50 text-green-700 [&>svg]:text-green-700">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription className="">
                  <span className="font-semibold">
                    {debouncedTokenAmount} DOMI
                  </span>{" "}
                  has been successfully sent to{" "}
                  <span className="font-semibold">
                    {shortenedRecipientAddress}
                  </span>
                  .
                </AlertDescription>
              </Alert>
            ))
            .with(
              [true, true, { error: P.select(P.not(P.nullish)) }],
              (error) => {
                return (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>An error occurred</AlertTitle>
                    <AlertDescription>
                      {(error as any).statusCode === 401
                        ? "This transaction has already been completed by someone else."
                        : "Couldn't complete the transaction."}
                    </AlertDescription>
                  </Alert>
                );
              }
            )
            .with([true, true, P.any], () => (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>What is this?</AlertTitle>
                <AlertDescription>
                  Send USDT to receive airdrop of DOMI token at{" "}
                  <span className="font-semibold">
                    {shortenedRecipientAddress}
                  </span>{" "}
                  address.
                </AlertDescription>
              </Alert>
            ))
            .otherwise(() => null)}

          {match([isMounted, isConnected, usingCorrectChain])
            // [isMounted, isConnected, usingCorrectChain]
            .with([true, true, true], () => (
              <form className="flex flex-col space-y-5" onSubmit={handleSubmit}>
                <div className="flex flex-col w-full space-y-2">
                  <Label
                    htmlFor="recipientAddress"
                    className={clsx(
                      !isRecipientAddressValid && "text-destructive"
                    )}
                  >
                    DOMI Recipient Address
                  </Label>
                  <div className="relative flex items-center space-x-2">
                    <div className="flex flex-grow">
                      <Input
                        lang="en"
                        name="recipientAddress"
                        placeholder="Enter recipient address"
                        value={recipientAddress}
                        onChange={(event) =>
                          setRecipientAddress(event.target.value)
                        }
                        disabled={isTransactionProcessing}
                      />
                    </div>
                  </div>
                  {!isRecipientAddressValid && (
                    <span className="text-[0.8rem] font-medium text-destructive">
                      Please enter a valid Domichain wallet address
                    </span>
                  )}
                </div>

                <div className="flex flex-row space-x-2">
                  <div className="flex flex-col w-full space-y-2">
                    <Label htmlFor="usdtAmount">USDT</Label>
                    <div className="relative flex items-center space-x-2">
                      <div className="flex flex-grow">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-gray-500">$</span>
                        </div>
                        <Input
                          className="pl-6"
                          lang="en"
                          name="usdtAmount"
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

                  <ArrowLeftRight className="self-end h-10 w-10 text-gray-600" />

                  <div className="flex flex-col w-full space-y-2">
                    <Label htmlFor="domiReceived">DOMI</Label>
                    <div className="relative flex items-center space-x-2">
                      <div className="flex flex-grow">
                        <Input
                          lang="en"
                          name="domiReceived"
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
                      isTransactionProcessing ||
                      !usdtContractWrite.write ||
                      !isRecipientAddressValid
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
            // [isMounted, isConnected, usingCorrectChain]
            .with([true, true, false], () => (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Unsupported Network</AlertTitle>
                <AlertDescription>
                  Please switch your wallet over to {chain.name}.
                </AlertDescription>
                <Button
                  className="mt-2"
                  variant="destructive"
                  onClick={() => switchNetwork?.(chain.id)}
                  disabled={isSwitching}
                >
                  {isSwitching && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Switch Network
                </Button>
              </Alert>
            ))
            // [isMounted, isConnected, usingCorrectChain]
            .with([true, false, P.boolean], () => (
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
