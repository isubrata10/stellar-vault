import { useState, useEffect } from 'react';
import { rpc } from '@stellar/stellar-sdk';
import { parseSorobanEvent, NormalizedEvent } from '../lib/eventParser';

const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const VAULT_CONTRACT = process.env.NEXT_PUBLIC_VAULT_CONTRACT_ID;
const TREASURY_CONTRACT = process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID;

export function useStellarEvents() {
    const [events, setEvents] = useState<NormalizedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        let timeoutId: NodeJS.Timeout;

        async function fetchEvents() {
            if (!VAULT_CONTRACT || !TREASURY_CONTRACT) {
                if (isMounted) {
                    setError('Contract IDs not configured. Deployment pending.');
                    setLoading(false);
                }
                return;
            }

            try {
                const server = new rpc.Server(RPC_URL);
                
                const latestLedger = await server.getLatestLedger();
                const startLedger = Math.max(0, latestLedger.sequence - 5000);

                const response = await server.getEvents({
                    startLedger, 
                    filters: [
                        { type: 'contract', contractIds: [VAULT_CONTRACT, TREASURY_CONTRACT] }
                    ],
                    limit: 100
                });

                if (isMounted) {
                    const parsedEvents = response.events
                        .map(parseSorobanEvent)
                        .filter((e): e is NormalizedEvent => e !== null);
                    
                    setEvents(parsedEvents.reverse()); // Show newest first
                    setError(null);
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError('Connection Error: Failed to fetch events from RPC. Retrying...');
                    setLoading(false);
                }
            }

            if (isMounted) {
                timeoutId = setTimeout(fetchEvents, 10000);
            }
        }

        fetchEvents();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    return { events, loading, error };
}
