import { useMutation } from "wagmi";

class FetchError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
  }
}

export const useCompleteTransaction = () =>
  useMutation(
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
        throw new FetchError(`Failed to complete transaction`, response.status);
      }
      return response;
    },
    {
      retry: (_, error) => (error as FetchError).statusCode !== 401,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
