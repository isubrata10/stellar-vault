import { Contract, rpc, Networks, TransactionBuilder, xdr, Transaction } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
export const FLOWPAY_CONTRACT = process.env.NEXT_PUBLIC_FLOWPAY_CONTRACT_ID || process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID || '';

const server = new rpc.Server(RPC_URL);

export async function invokeContract({
    contractId,
    method,
    args,
    publicKey,
    onStatus
}: {
    contractId: string;
    method: string;
    args: xdr.ScVal[];
    publicKey: string;
    onStatus?: (status: string) => void;
}) {
    if (!contractId) throw new Error("Contract ID not configured in environment");

    try {
        onStatus?.('preparing');
        
        let sourceAccount;
        try {
            sourceAccount = await server.getAccount(publicKey);
        } catch (e: unknown) {
            throw new Error("Account not found on network. Please fund it first.");
        }

        onStatus?.('waiting for wallet');
        const contract = new Contract(contractId);
        
        const tx = new TransactionBuilder(sourceAccount, {
            fee: "100000",
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

        onStatus?.('signing');
        const signedTx = await signTransaction(tx.toXDR(), { network: NETWORK_PASSPHRASE });
        
        onStatus?.('submitting');
        const transactionToSubmit = TransactionBuilder.fromXDR(signedTx, NETWORK_PASSPHRASE) as Transaction;
        const response = await server.sendTransaction(transactionToSubmit);

        if (response.status !== "PENDING") {
            throw new Error("Transaction failed on submission");
        }

        onStatus?.('confirming');
        
        // Wait for confirmation
        let txResponse;
        for (let i = 0; i < 15; i++) {
            txResponse = await server.getTransaction(response.hash);
            if (txResponse.status === "SUCCESS") {
                onStatus?.('success');
                return txResponse;
            } else if (txResponse.status === "FAILED") {
                throw new Error("Transaction failed on chain");
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error("Transaction confirmation timeout");
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Unknown error occurred");
    }
}
