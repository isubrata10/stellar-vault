import { Contract, rpc, Networks, TransactionBuilder, xdr, Transaction } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';

export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE = process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
export const FLOWPAY_CONTRACT = process.env.NEXT_PUBLIC_FLOWPAY_CONTRACT_ID || '';

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
        } catch {
            throw new Error(`Failed to load account ${publicKey} on network`);
        }

        const contract = new Contract(contractId);
        
        // 1. Build Transaction
        const tx = new TransactionBuilder(sourceAccount, {
            fee: '1000',
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(contract.call(method, ...args))
        .setTimeout(30)
        .build();

        // 2. Prepare Transaction using simulation
        const sim = await server.simulateTransaction(tx);
        
        console.log("Simulation Result:", sim);

        if (rpc.Api.isSimulationError(sim)) {
             throw new Error(`Simulation failure: typeof sim.error === 'string' ? sim.error : 'Unknown'`);
        }

        if (rpc.Api.isSimulationRestore(sim)) {
             throw new Error(`Contract data needs restoration. State is archived.`);
        }

        if (!rpc.Api.isSimulationSuccess(sim)) {
             throw new Error("Simulation failed");
        }

        // Assembling tx for signing
        const builtPrepared = rpc.assembleTransaction(tx, sim);
        
        // 3. Wallet Interaction (Sign)
        onStatus?.('wallet interaction');
        
        const signedResponse = await signTransaction(builtPrepared.build().toXdr(), { networkPassphrase: NETWORK_PASSPHRASE });
        if (signedResponse.error) throw new Error(`Wallet rejection: ${signedResponse.error}`);
        if (!signedResponse.signedTxXdr) throw new Error("Wallet did not return signed transaction");

        // 4. Submit
        onStatus?.('submitted');
        
        const transactionToSubmit = TransactionBuilder.fromXdr(signedResponse.signedTxXdr, NETWORK_PASSPHRASE) as Transaction;
        const sendResponse = await server.sendTransaction(transactionToSubmit);
        
        if (sendResponse.status === 'ERROR') {
             throw new Error(`Submission failed: ${sendResponse.errorResult?.toXdr('base64') || 'Unknown error'}`);
        }

        // Wait for confirmation
        let txStatus = 'PENDING';
        let txResponse;
        while (txStatus === 'PENDING') {
            await new Promise(r => setTimeout(r, 2000));
            txResponse = await server.getTransaction(sendResponse.hash);
            txStatus = txResponse.status;
            
            if (txStatus === 'SUCCESS') {
                 onStatus?.('confirmed');
                 return txResponse;
            } else if (txStatus === 'FAILED') {
                 throw new Error(`Transaction failed on chain`);
            }
        }
        
        return txResponse;
    } catch (e: unknown) {
        onStatus?.('failed');
        if (e instanceof Error) {
            throw e;
        }
        throw new Error(String(e));
    }
}
