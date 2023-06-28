import { connection } from "./utils/constants";
import { Wallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import * as borsh from "borsh";

const GREETING_SEED = "hello";

const PROGRAM_ID = new PublicKey(
  "GuiRTcyvuhBQMfRSYhvmRBx4jw7cwrgCF8iPyRwNRKz1"
);

class GreetingAccount {
  counter = 0;
  constructor(fields: { counter: number } | undefined = undefined) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

/**
 * Borsh schema definition for greeting accounts
 */
const GreetingSchema = new Map([
  [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
]);

/**
 * The expected size of each greeting account.
 */
const GREETING_SIZE = borsh.serialize(
  GreetingSchema,
  new GreetingAccount()
).length;

export async function getGreetedPubkey(wallet: Wallet): Promise<PublicKey> {
  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(PROGRAM_ID);
  if (programInfo === null) {
    throw new Error("Program needs to be built and deployed");
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }

  // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
  const greetedPubkey = await PublicKey.createWithSeed(
    wallet.adapter.publicKey!,
    GREETING_SEED,
    PROGRAM_ID
  );

  // Check if the greeting account has already been created
  const greetedAccount = await connection.getAccountInfo(greetedPubkey);
  if (greetedAccount === null) {
    console.log(
      "Creating account",
      greetedPubkey.toBase58(),
      "to say hello to"
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      GREETING_SIZE
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: wallet.adapter.publicKey!,
        basePubkey: wallet.adapter.publicKey!,
        seed: GREETING_SEED,
        newAccountPubkey: greetedPubkey,
        lamports,
        space: GREETING_SIZE,
        programId: PROGRAM_ID,
      })
    );
    await wallet.adapter.sendTransaction(transaction, connection);
  }

  return greetedPubkey;
}

export async function sendGreeting(wallet: Wallet) {
  const transaction = new Transaction().add(
    new TransactionInstruction({
      keys: [
        {
          pubkey: await getGreetedPubkey(wallet),
          isSigner: false,
          isWritable: true,
        },
      ],
      programId: PROGRAM_ID,
      data: Buffer.alloc(0), // All instructions are hellos
    })
  );
  await wallet.adapter.sendTransaction(transaction, connection);
}

export async function reportGreetings(wallet: Wallet): Promise<number> {
  const accountInfo = await connection.getAccountInfo(
    await getGreetedPubkey(wallet)
  );
  if (accountInfo === null) {
    throw "Error: cannot find the greeted account";
  }
  const greeting = borsh.deserialize(
    GreetingSchema,
    GreetingAccount,
    accountInfo.data
  );
  return greeting.counter;
}
