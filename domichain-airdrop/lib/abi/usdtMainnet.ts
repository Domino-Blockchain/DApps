export const usdtMainnetContractAddress =
  "0x0a70dDf7cDBa3E8b6277C9DDcAf2185e8B6f539f";

export const usdtMainnetABI = [
  {
    name: "transfer",
    type: "function",
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_value",
        type: "uint256",
      },
    ],
    outputs: [],
    payable: false,
    stateMutability: "nonpayable",
  },
] as const;
