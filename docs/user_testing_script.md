# FlowPay 5-Minute User Testing Script

Send this exact script to your 10 required real users. Do not modify the steps. Have them open `https://<your-vercel-domain>/welcome` to follow along and submit feedback.

## The Script

**Context for Tester:**
"Hi! I am testing FlowPay, a programmable cross-border payout system built on the Stellar network. You will be acting as a Business creating a payment, and then as the Recipient accepting it. It takes about 5 minutes. No real money is involved."

**Task 1: Connect Wallet**
1. Install the Freighter Browser Extension.
2. Switch network to **Testnet** (Settings -> Network -> Testnet).
3. Click "Connect Wallet" on the FlowPay UI.

**Task 2: Create a Payment**
1. Navigate to the Dashboard.
2. Click **Create Payment**.
3. Fill out the Recipient address (use a secondary wallet address or one provided by me).
4. Enter an amount and a short description.
5. Click **Submit**.

**Task 3: Fund the Payment**
1. Once created, the payment will be in a "Created" state.
2. Click **Fund**.
3. Sign the transaction in Freighter. This escrows the testnet XLM.

**Task 4: Open as Recipient**
1. (If testing alone, switch your Freighter wallet to the Recipient account).
2. The payment should now say "Funded".

**Task 5: Accept & Complete**
1. Click **Accept Payment** and sign.
2. Click **Submit Milestone** and sign.
3. Switch back to the Business account and click **Approve Milestone**.
4. The payment is now ready for settlement! Click **Release**.

**Task 6 & 7: View Status**
1. Look at the payment status. It should now be **Completed**.
2. Check the Activity log to see the chain of events.

## Feedback
Return to the `/welcome` page and fill out the Validation Feedback form!
