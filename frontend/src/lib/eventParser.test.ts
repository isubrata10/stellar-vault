import { describe, it, expect } from 'vitest';
import { parseSorobanEvent } from './eventParser';
import { nativeToScVal } from '@stellar/stellar-sdk';

describe('Event Parser', () => {
    it('should parse a vault_created event correctly', () => {
        const mockEvent: any = {
            id: 'event123',
            type: 'contract',
            ledgerClosedAt: '2023-01-01T00:00:00Z',
            contractId: 'C123',
            topic: [nativeToScVal('Vault'), nativeToScVal('vault_created')],
            value: nativeToScVal([123n, 'GDX5QG6J54T2WZY7K2C']),
            inSuccessfulContractCall: true,
            pagingToken: 'token1',
            ledger: 100,
            txHash: 'hash1',
        };

        const result = parseSorobanEvent(mockEvent);
        expect(result).not.toBeNull();
        expect(result?.message).toBe('Vault #123 created by GDX5...7K2C');
    });

    it('should ignore non-contract events', () => {
        const mockEvent: any = {
            id: 'event123',
            type: 'system',
            ledgerClosedAt: '2023-01-01T00:00:00Z',
            contractId: 'C123',
            topic: [],
            value: '',
            inSuccessfulContractCall: true,
            pagingToken: 'token1',
            ledger: 100,
            txHash: 'hash1',
        };

        const result = parseSorobanEvent(mockEvent);
        expect(result).toBeNull();
    });
});
