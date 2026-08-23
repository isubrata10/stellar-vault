import { rpc, xdr, scValToNative } from '@stellar/stellar-sdk';

export interface NormalizedEvent {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    contractId: string;
}

export function parseSorobanEvent(event: rpc.Api.EventResponse): NormalizedEvent | null {
    if (event.type !== 'contract') return null;
    
    try {
        const topics = event.topic.map(t => typeof t === 'string' ? xdr.ScVal.fromXDR(t, 'base64') : t);
        if (topics.length < 2) return null;

        const contractType = scValToNative(topics[0]).toString();
        const action = scValToNative(topics[1]).toString();
        
        let value: any = null;
        if (event.value) {
            value = scValToNative(typeof event.value === 'string' ? xdr.ScVal.fromXDR(event.value, 'base64') : event.value);
        }

        let message = `Unknown event: ${action}`;

        if (contractType === 'Vault' && Array.isArray(value)) {
            switch (action) {
                case 'vault_created':
                    message = `Vault #${value[0]} created by ${shortenAddress(value[1])}`;
                    break;
                case 'participant_added':
                    message = `Participant ${shortenAddress(value[1])} added to Vault #${value[0]}`;
                    break;
                case 'deposit':
                    message = `${shortenAddress(value[1])} deposited ${value[2]} tokens into Vault #${value[0]}`;
                    break;
                case 'withdrawal_requested':
                    message = `Withdrawal #${value[1]} of ${value[4]} tokens requested by ${shortenAddress(value[2])} on Vault #${value[0]}`;
                    break;
                case 'withdrawal_approved':
                    message = `Withdrawal #${value[1]} approved by ${shortenAddress(value[2])} on Vault #${value[0]}`;
                    break;
                case 'withdrawal_rejected':
                    message = `Withdrawal #${value[1]} rejected by ${shortenAddress(value[2])} on Vault #${value[0]}`;
                    break;
                case 'withdrawal_executed':
                    message = `Withdrawal #${value[1]} executed on Vault #${value[0]}: ${value[4]} tokens released`;
                    break;
            }
        } else if (contractType === 'Treasury' && Array.isArray(value)) {
            switch (action) {
                case 'funds_received':
                    message = `Treasury received ${value[2]} tokens from ${shortenAddress(value[0])}`;
                    break;
                case 'funds_released':
                    message = `Treasury released ${value[2]} tokens to ${shortenAddress(value[0])}`;
                    break;
            }
        }

        return {
            id: event.id,
            type: action,
            message,
            timestamp: event.ledgerClosedAt,
            contractId: event.contractId,
        };
    } catch (e) {
        return null;
    }
}

function shortenAddress(addr: any): string {
    const s = String(addr);
    if (!s || s.length < 8) return s;
    return `${s.substring(0, 4)}...${s.substring(s.length - 4)}`;
}
