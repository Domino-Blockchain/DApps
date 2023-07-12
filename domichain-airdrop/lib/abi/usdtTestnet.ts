export const usdtTestnetContractAddress =
  "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd";

export const usdtTestnetABI = [
  {
    name: "transfer",
    type: "function",
    constant: false,
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
  },
] as const;
