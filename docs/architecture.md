# FlowPay System Architecture

FlowPay utilizes a hybrid web3 architecture. 

- **Frontend Tier:** Next.js React client responsible for UI, wallet connection (Freighter), and transaction signing.
- **Backend Tier:** Next.js Serverless functions providing an indexed cache (Prisma) of contract metadata to ensure fast load times.
- **Blockchain Tier:** Soroban smart contracts enforcing business logic on the Stellar network.
