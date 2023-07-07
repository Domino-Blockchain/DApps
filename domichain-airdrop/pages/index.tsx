import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usdtTestnetABI,
  usdtTestnetContractAddress,
} from "@/lib/abi/usdtTestnet";
import { useDebounce } from "@/lib/hooks/useDebounce";
import useIsMounted from "@/lib/hooks/useIsMounted";
import { cn } from "@/lib/utils";
import { Web3Button } from "@web3modal/react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import React, { useCallback, useEffect } from "react";
import { Address, parseEther } from "viem";
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
  const router = useRouter();
  const isMounted = useIsMounted();

  const { chain, chains } = useNetwork();
  const { isLoading: isSwitchingNetwork, switchNetwork } = useSwitchNetwork();
  const { isConnected } = useAccount();

  const [tokenAmount, setTokenAmount] = React.useState("");
  const debouncedTokenAmount = parseFloat(useDebounce(tokenAmount));

  const { config } = usePrepareContractWrite({
    abi: usdtTestnetABI,
    address: usdtTestnetContractAddress,
    functionName: "transfer",
    args: [
      process.env.NEXT_PUBLIC_USDT_RECIPIENT_ADDRESS as never,
      isNaN(debouncedTokenAmount)
        ? BigInt(0)
        : parseEther(String(debouncedTokenAmount)),
    ],
    enabled: Boolean(debouncedTokenAmount),
  });

  const { data, write } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({ hash: data?.hash });

  const { mutate } = useMutation(
    async ({
      transactionHash,
      recipientAddress,
    }: {
      transactionHash: string;
      recipientAddress: string;
    }) => {
      // FIXME: remove hardcoded URL
      return await fetch("http://192.168.0.216:8090/v1/handle", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionHash: transactionHash,
          recipientAddress: recipientAddress,
        }),
      });
    },
    {
      retry: true,
      retryDelay: (attempt) =>
        Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
    }
  );

  useEffect(() => {
    const transactionHash = data?.hash;
    const recipientAddress = router.query["recipient"];

    if (
      transactionHash &&
      typeof recipientAddress === "string" &&
      recipientAddress.length > 0
    ) {
      mutate({
        transactionHash,
        recipientAddress,
      });
    }
  }, [data?.hash, isSuccess, mutate, router]);

  const handleSelectedNetwork = (value: string) => {
    const newChain = chains.find((chain) => chain.network === value);
    switchNetwork?.(newChain?.id);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    write?.();
  };

  return (
    <>
      <div className="absolute top-0 right-0 p-8">
        <Web3Button />
      </div>

      <main className="flex flex-col md:justify-center items-center min-h-screen px-8">
        <h1 className="text-center text-3xl font-bold pt-44 md:pt-0 pb-16">
          Domichain Airdrop
        </h1>

        <div className="flex w-full max-w-lg">
          {isMounted && isConnected ? (
            <form
              className="flex flex-col w-full space-y-4"
              onSubmit={handleSubmit}
            >
              {isSuccess && (
                <Alert className="border-green-700/50 text-green-700 [&>svg]:text-green-700 mb-8">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription className="break-words">
                    Transaction Hash: {data?.hash}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-row w-full space-x-2">
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
                        name="usdtAmount"
                        placeholder="0.0"
                        type="number"
                        inputMode="decimal"
                        min={0.0}
                        step={0.1}
                        max={10000}
                        value={tokenAmount}
                        onChange={(event) => setTokenAmount(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="usdtAmount">Network</Label>
                  <Select
                    value={chain?.network}
                    onValueChange={handleSelectedNetwork}
                    disabled={isSwitchingNetwork}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Networks</SelectLabel>
                        {chains.map((chain) => (
                          <SelectItem key={chain.id} value={chain.network}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  type="submit"
                  disabled={debouncedTokenAmount <= 0.0 || !write || isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Processing…" : "Transfer"}
                </Button>
              </div>
            </form>
          ) : (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Wallet is required</AlertTitle>
              <AlertDescription>
                Please connect your wallet before you proceed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </>
  );
}
