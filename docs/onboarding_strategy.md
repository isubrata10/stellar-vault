# FlowPay Real-User Onboarding Strategy

To meet the Level 4 Green Belt requirement of onboarding at least 10 **REAL** users, FlowPay implements a frictionless, guided onboarding flow.

### The Strategy

1. **The Welcome Guide (`/welcome`)**
   When you send the link to a new user, send them directly to `https://<your-vercel-domain>/welcome`.
   This page is specifically designed for non-crypto natives. It explains:
   - What Freighter is (and why it's safe).
   - What "Signing" a transaction means.
   - That they are on the "Testnet" (sandbox money).

2. **The Checklist**
   Users are guided through a 4-step checklist:
   - Connect Wallet
   - Fund Account via Friendbot
   - Create a Payment
   - Accept a Payment

3. **User Feedback Collection**
   At the bottom of the Welcome page, a built-in feedback form collects their Satisfaction Rating, what they liked, what confused them, and any bugs.

### How to Onboard Your 10 Users
1. Deploy the latest version of the code to Vercel (or share your localhost via ngrok).
2. Reach out to 10 colleagues, friends, or SCF community members.
3. Send them the `/welcome` URL.
4. Have them install the Freighter browser extension and switch to Testnet.
5. Ask them to complete the checklist and submit the feedback form at the end.

### Monitoring Onboarding
You can track their organic progress in real-time by visiting the `/admin` dashboard. 
**IMPORTANT:** The system strictly enforces the "No Fake Data" policy. You must invite real people to connect their wallets to see the numbers in the `/admin` panel go up!
