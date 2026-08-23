'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isAllowed, setAllowed, getAddress, requestAccess } from '@stellar/freighter-api';

interface WalletContextType {
    address: string | null;
    isInstalled: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
    address: null,
    isInstalled: false,
    connect: async () => {},
    disconnect: () => {}
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // @ts-ignore
                if (window.freighter) {
                    setIsInstalled(true);
                    const allowed = await isAllowed();
                    if (allowed) {
                        const res = await getAddress();
                        if (res.address) setAddress(res.address);
                    }
                }
            } catch (e) {
                console.error("Wallet check failed", e);
            }
        };
        checkConnection();
    }, []);

    const connect = async () => {
        try {
            await setAllowed();
            await requestAccess();
            const res = await getAddress();
            if (res.address) setAddress(res.address);
        } catch (e) {
            console.error("Connection rejected", e);
            throw new Error("Connection rejected");
        }
    };

    const disconnect = () => {
        setAddress(null);
    };

    return (
        <WalletContext.Provider value={{ address, isInstalled, connect, disconnect }}>
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => useContext(WalletContext);
