
# MLBNSPH.com - Transaction Workflow

## 1. Purpose

This document defines the complete transaction workflow of MLBNSPH.com.

It explains how buyers, sellers, and midmen interact throughout a transaction, including:

- Purchase requests.
- Midman selection.
- Mutual acceptance.
- Transaction group chat.
- Midman queue.
- Transaction terms.
- Payment submission.
- Payment verification.
- Fulfillment.
- Buyer confirmation.
- Reviews and vouches.
- Dispute handling.

This document should be treated as the main reference when implementing transaction-related features.

The application must enforce all transaction rules on the server and database level.

---

## 2. Transaction Participants

### Buyer

The buyer is the user who wants to purchase a listing.

Responsibilities:

- Initiate a purchase request.
- Communicate with the seller.
- Propose or accept a midman.
- Review transaction terms.
- Approve the agreed amount and fee.
- Submit payment evidence.
- Wait for payment verification.
- Confirm successful fulfillment.
- Open a dispute if necessary.

### Seller

The seller owns the listing.

Responsibilities:

- Publish and maintain listings.
- Respond to purchase requests.
- Communicate with the buyer.
- Propose or accept a midman.
- Approve transaction terms.
- Perform the agreed fulfillment process.
- Respond to transaction issues.

### Midman

The midman coordinates the transaction.

Responsibilities:

- Maintain an approved midman profile.
- Accept or decline transaction assignments.
- Manage the transaction queue.
- Provide transaction instructions.
- Set the proposed transaction amount and fee.
- Obtain buyer and seller approval.
- Provide payment instructions.
- Independently verify actual payment receipt.
- Coordinate fulfillment.
- Assist with transaction issues.

### Admin

The admin supervises the platform.

Responsibilities:

- Verify midmen.
- Suspend or revoke midman verification.
- Moderate listings.
- Review reports.
- Monitor transactions.
- Handle disputes.
- Record dispute resolutions.
- Review audit logs.

---

## 3. High-Level Transaction Flow

The expected transaction process is:

1. Seller publishes a listing.
2. Buyer browses and selects the listing.
3. Buyer contacts the seller or creates a purchase request.
4. Buyer and seller communicate through private chat.
5. Either party proposes a verified midman.
6. The other party accepts or proposes another midman.
7. Both parties must agree on the same midman.
8. The system creates a transaction room.
9. The selected midman accepts the assignment.
10. The transaction enters the midman's queue.
11. The midman provides the transaction terms.
12. Buyer and seller approve the terms.
13. Buyer submits payment evidence.
14. Midman independently verifies the actual payment.
15. Seller performs the agreed fulfillment.
16. Buyer confirms successful receipt.
17. The transaction is completed.
18. Eligible participants can leave reviews and vouches.

If something goes wrong, the buyer or seller can open a dispute.

---

## 4. Detailed Transaction Process

### STEP 1: Seller Creates a Listing

The seller creates a listing.

Required information:

- Listing title.
- Description.
- Price.
- Category.
- Images.
- Listing status.

Suggested listing statuses:

- DRAFT
- ACTIVE
- RESERVED
- SOLD
- PAUSED
- REMOVED

Rules:

- Only the listing owner can edit their listing.
- Admins can moderate or remove listings.
- Only active listings can receive new purchase requests.
- The server must check listing availability when creating a transaction.
- Prevent multiple conflicting active purchases for the same listing.

### STEP 2: Buyer Selects a Listing

The buyer browses the marketplace.

The buyer can:

- View listing details.
- View seller profile.
- Contact the seller.
- Start a purchase request.

When the buyer initiates a purchase request, the system should create or reuse a private conversation between the buyer and seller.

### STEP 3: Private Buyer-Seller Chat

The buyer and seller communicate privately.

The conversation contains only:

- Buyer.
- Seller.

Features:

- Real-time messaging.
- Message timestamps.
- Read status.
- Image attachments.
- File attachments where permitted.

Security:

- Only conversation members can read messages.
- Only conversation members can send messages.
- Validate attachment types and sizes.
- Prevent unauthorized access to conversations.

Do not allow the platform to collect game passwords, OTPs, recovery codes, or other third-party account credentials.

### STEP 4: Midman Selection

Either buyer or seller can propose a midman.

The proposed midman must:

- Have an active account.
- Have an approved midman profile.
- Have a verification status of VERIFIED.
- Not be suspended or restricted.

The other party can:

1. Accept the proposed midman.
2. Reject the proposed midman.
3. Propose a different midman.

Important rules:

- Both buyer and seller must agree to the same midman.
- One party's acceptance is not enough.
- If a different midman is proposed, the previous proposal becomes superseded.
- Only mutually accepted midman proposals can proceed.
- The system must re-check the midman's verification status before assignment.

Suggested proposal statuses:

- PENDING
- ACCEPTED
- REJECTED
- SUPERSEDED
- EXPIRED

### STEP 5: Create Transaction Room

Once buyer and seller agree to the same midman, the system creates the transaction room.

The transaction room contains exactly three primary participants:

1. Buyer.
2. Seller.
3. Selected midman.

The room should display:

- Listing information.
- Buyer information.
- Seller information.
- Selected midman information.
- Transaction status.
- Queue position.
- Transaction terms.
- Payment status.
- Transaction instructions.
- Activity history.

The system automatically sends a welcome message.

Example:

"Welcome to your transaction room!

Your buyer, seller, and selected midman are now connected.

Please wait for the midman to review the transaction and provide the next instructions.

Do not send passwords, OTPs, or recovery codes through this platform."

Only authorized participants and admins should access the transaction room.

### STEP 6: Midman Accepts the Assignment

The selected midman receives a transaction notification.

The midman can:

- Accept the assignment.
- Decline the assignment.

If declined:

- Do not assign a queue position.
- Return the transaction to midman selection.
- Notify the buyer and seller.

If accepted:

- Record the acceptance.
- Assign the transaction to the midman's queue if queueing is enabled.
- Notify all participants.

### STEP 7: Midman Queue Management

The system displays the transaction's queue position.

Example:

Current queue position: #4

Rules:

- Queue positions must be assigned atomically in the database.
- Prevent duplicate positions when multiple transactions enter the queue simultaneously.
- Only authorized midman/admin actions can modify queue records.
- Queue position is informational.
- Do not promise an exact completion time.

Suggested queue statuses:

- WAITING
- IN_PROGRESS
- PAUSED
- COMPLETED
- CANCELLED

### STEP 8: Midman Creates Transaction Terms

The midman enters the proposed transaction details.

Required information:

- Transaction amount.
- Midman fee.
- Who pays the fee.
- Payment method.
- Payment destination.
- Additional instructions.
- Any agreed conditions.

The system displays the terms to both buyer and seller.

Both parties must approve the same version.

Example:

Transaction amount: PHP 2,000.00

Midman fee: PHP 100.00

Total amount: PHP 2,100.00

The actual calculation and who pays each component must be explicit.

Rules:

- Store money in integer centavos.
- Save a versioned snapshot of the terms.
- Buyer approval is required.
- Seller approval is required.
- Do not proceed to payment without both approvals.
- If the terms change, previous approvals become invalid.
- Both parties must approve the new version.

### STEP 9: Buyer Submits Payment

After both parties approve the terms, the system allows the buyer to proceed.

The buyer:

1. Views the approved payment instructions.
2. Sends payment through the agreed payment method.
3. Uploads the payment receipt.
4. Presses "I've Paid".

The system creates a payment record.

Payment status:

SUBMITTED

The payment receipt is stored in a private Supabase Storage bucket.

Important:

Uploading a receipt does not mean payment has been verified.

The system must not automatically mark payment as successful based on the uploaded screenshot.

### STEP 10: Midman Verifies Payment

The midman receives a notification.

The midman must independently check the actual receiving account or payment channel.

Possible actions:

**Verify Payment**

If the payment was actually received:

- Mark payment as VERIFIED.
- Record the verifier.
- Record the verification timestamp.
- Notify buyer and seller.
- Move the transaction to the next step.

**Reject Payment**

If the payment cannot be confirmed:

- Mark payment as REJECTED.
- Provide a reason.
- Notify the buyer.
- Allow a corrected payment submission or appropriate dispute process.

Payment statuses:

- PENDING
- SUBMITTED
- VERIFIED
- REJECTED
- REFUND_PENDING
- REFUNDED

Only the authorized midman should verify payment, unless a documented admin override is implemented.

A receipt screenshot alone is never sufficient proof of payment.

### STEP 11: Seller Performs Fulfillment

After payment verification, the seller receives a notification.

The seller performs the agreed fulfillment process.

The seller can mark the fulfillment step as completed.

The system records:

- Seller ID.
- Transaction ID.
- Fulfillment status.
- Timestamp.
- Optional permitted evidence.

The buyer is notified to inspect and confirm fulfillment.

Do not request game passwords, OTPs, recovery codes, or credentials through the transaction room.

### STEP 12: Buyer Confirms Fulfillment

The buyer has two main options.

**Option A: Confirm Received**

The buyer confirms that the agreed item or service was received.

The system:

- Records buyer confirmation.
- Moves the transaction to COMPLETED.
- Updates the listing status where appropriate.
- Marks the midman queue item as completed.
- Enables eligible reviews and vouches.

**Option B: Report a Problem**

The buyer opens a dispute.

The system:

- Records the dispute.
- Changes the transaction status to DISPUTED.
- Notifies the participants and admins.
- Prevents normal transaction completion actions while the dispute is active.

Do not automatically complete transactions after a timer unless a clear, disclosed, and reviewed timeout policy has been implemented.

### STEP 13: Reviews and Vouches

After a transaction is completed:

Eligible participants can submit reviews.

Review requirements:

- Must reference a completed transaction.
- Must be submitted by a transaction participant.
- Must reference the reviewed midman.
- Prevent duplicate reviews by the same reviewer for the same transaction and target.
- Allow users to report abusive or fraudulent reviews.

Midman profiles can display:

- Average rating.
- Completed transactions.
- Written feedback.
- Public vouch links.

A public vouch link must not expose private transaction details.

### STEP 14: Dispute Handling

A buyer or seller can open a dispute during an eligible transaction state.

Required information:

- Transaction ID.
- Person who opened the dispute.
- Reason.
- Description.
- Supporting evidence.
- Creation timestamp.

Dispute statuses:

- OPEN
- UNDER_REVIEW
- WAITING_FOR_INFORMATION
- RESOLVED
- CLOSED

Admin actions:

- Review transaction history.
- Review submitted evidence.
- Request additional information.
- Record a resolution.
- Notify the involved parties.

When a dispute is active:

- Pause normal transaction progression.
- Preserve transaction history.
- Restrict evidence to authorized participants and admins.
- Record every administrative decision.

---

## 5. Transaction State Machine

The transaction status must be controlled by server-side business logic.

Clients must never be allowed to directly set arbitrary transaction statuses.

| Status | Description |
|---|---|
| PENDING_SELLER | Waiting for seller response |
| PENDING_MIDMAN | Waiting for midman selection |
| MIDMAN_PROPOSED | A midman proposal is awaiting acceptance |
| MIDMAN_ACCEPTED | Buyer and seller accepted the same midman |
| QUEUED | Waiting in the midman's queue |
| AWAITING_TERMS | Midman is preparing transaction terms |
| AWAITING_AGREEMENT | Waiting for buyer and seller approval |
| AWAITING_PAYMENT | Waiting for buyer payment |
| PAYMENT_SUBMITTED | Buyer submitted payment evidence |
| PAYMENT_VERIFIED | Midman confirmed actual payment receipt |
| AWAITING_FULFILLMENT | Seller must perform fulfillment |
| AWAITING_BUYER_CONFIRMATION | Waiting for buyer confirmation |
| COMPLETED | Transaction successfully completed |
| DISPUTED | Transaction is under dispute review |
| CANCELLED | Transaction was cancelled |
| EXPIRED | Transaction expired under a defined policy |

### Allowed State Transitions

| Current State | Allowed Next State |
|---|---|
| PENDING_SELLER | PENDING_MIDMAN, CANCELLED, EXPIRED |
| PENDING_MIDMAN | MIDMAN_PROPOSED, CANCELLED, EXPIRED |
| MIDMAN_PROPOSED | MIDMAN_PROPOSED, MIDMAN_ACCEPTED, CANCELLED, EXPIRED |
| MIDMAN_ACCEPTED | QUEUED, AWAITING_TERMS, CANCELLED |
| QUEUED | AWAITING_TERMS, CANCELLED, DISPUTED |
| AWAITING_TERMS | AWAITING_AGREEMENT, CANCELLED, DISPUTED |
| AWAITING_AGREEMENT | AWAITING_PAYMENT, AWAITING_TERMS, CANCELLED, DISPUTED |
| AWAITING_PAYMENT | PAYMENT_SUBMITTED, CANCELLED, DISPUTED |
| PAYMENT_SUBMITTED | PAYMENT_VERIFIED, AWAITING_PAYMENT, DISPUTED |
| PAYMENT_VERIFIED | AWAITING_FULFILLMENT, DISPUTED |
| AWAITING_FULFILLMENT | AWAITING_BUYER_CONFIRMATION, DISPUTED |
| AWAITING_BUYER_CONFIRMATION | COMPLETED, DISPUTED |
| DISPUTED | COMPLETED, CANCELLED |
| COMPLETED | Terminal |
| CANCELLED | Terminal |
| EXPIRED | Terminal |

Important:

The exact transitions should be implemented according to the final business rules.

Every transition must validate:

- Current transaction status.
- Actor permissions.
- Required approvals.
- Payment conditions.
- Fulfillment conditions.
- Dispute conditions.

---

## 6. Payment State Machine

Payment status must be managed separately from transaction status.

| Payment Status | Description |
|---|---|
| PENDING | Payment has not been submitted |
| SUBMITTED | Buyer submitted payment evidence |
| VERIFIED | Midman confirmed actual payment receipt |
| REJECTED | Payment could not be confirmed |
| REFUND_PENDING | Refund is being processed |
| REFUNDED | Refund has been completed |

Never treat PAYMENT_SUBMITTED as equivalent to PAYMENT_VERIFIED.

---

## 7. Transaction Event Logging

Every important transaction action must create an event record.

Suggested events:

- TRANSACTION_CREATED
- SELLER_ACCEPTED
- MIDMAN_PROPOSED
- MIDMAN_REJECTED
- MIDMAN_ACCEPTED_BY_PARTIES
- MIDMAN_JOINED
- QUEUE_ASSIGNED
- TERMS_PROPOSED
- TERMS_APPROVED
- PAYMENT_SUBMITTED
- PAYMENT_VERIFIED
- PAYMENT_REJECTED
- FULFILLMENT_SUBMITTED
- BUYER_CONFIRMED
- DISPUTE_OPENED
- DISPUTE_RESOLVED
- TRANSACTION_COMPLETED
- TRANSACTION_CANCELLED

Each event should contain:

- Transaction ID.
- Actor ID.
- Event type.
- Timestamp.
- Relevant safe metadata.

Transaction events should be append-only.

Do not store passwords, OTPs, recovery codes, or secrets in event metadata.

---

## 8. Authorization Rules

### Buyer

Can:

- View their own transactions.
- Send messages in authorized transaction rooms.
- Propose or accept a midman.
- Approve transaction terms.
- Submit payment evidence.
- Confirm fulfillment.
- Open disputes.
- Submit eligible reviews.

Cannot:

- Verify their own payment.
- Change transaction status directly.
- Modify midman verification.
- Access unrelated transactions.

### Seller

Can:

- View their own transactions.
- Send messages in authorized transaction rooms.
- Propose or accept a midman.
- Approve transaction terms.
- Mark fulfillment as completed.
- Open disputes.
- Submit eligible reviews.

Cannot:

- Verify buyer payment.
- Change transaction status directly.
- Access unrelated transactions.

### Midman

Can:

- View assigned transactions.
- Accept or decline assignments.
- Manage their own queue.
- Propose transaction terms.
- Verify actual payment receipt.
- Update authorized transaction workflow fields.
- Coordinate fulfillment.

Cannot:

- Access unrelated transactions.
- Modify admin permissions.
- Approve their own midman verification.
- Silently modify approved transaction terms.

### Admin

Can:

- Verify midmen.
- Moderate users and listings.
- Review disputes.
- Record dispute resolutions.
- Access authorized administrative records.
- Perform documented overrides where explicitly supported.

Every admin action must be logged.

---

## 9. Important Edge Cases

### Midman Declines

- Return the transaction to midman selection.
- Notify buyer and seller.
- Do not assign queue position.

### Midman Verification Revoked

- Prevent new assignments.
- Review existing active transactions.
- Notify affected participants.
- Require a controlled reassignment or admin review.

### Buyer or Seller Cancels

- Record the person who cancelled.
- Record the reason.
- Apply the cancellation rules.
- Notify all participants.

### Listing Becomes Unavailable

- Prevent new purchase requests.
- Explicitly handle existing active transactions.
- Do not silently delete transaction history.

### Transaction Terms Change

- Create a new terms version.
- Invalidate previous approvals.
- Require buyer and seller to approve again.

### Payment Is Rejected

- Preserve the rejected payment record.
- Notify the buyer.
- Allow another payment attempt where appropriate.
- Allow dispute escalation if needed.

### Duplicate Payment Submission

- Prevent accidental duplicate submissions.
- Maintain a clear record of multiple payment attempts.
- Do not overwrite previous evidence.

### Buyer Does Not Confirm

- Keep the transaction pending.
- Notify the buyer.
- Use only a clearly defined and disclosed timeout policy.
- Do not automatically mark the transaction completed without an approved rule.

### Dispute Is Opened

- Freeze normal transaction progression.
- Notify authorized participants and admins.
- Preserve all evidence.
- Require an authorized resolution.

### Concurrent Queue Requests

- Use database transactions and row-level locking.
- Prevent duplicate queue positions.
- Ensure queue ordering remains consistent.

---

## 10. Implementation Requirements

The AI coding assistant must follow these rules when implementing the transaction system.

1. Implement transaction statuses as constrained database values.
2. Create a centralized transaction service.
3. Do not allow arbitrary status updates from the frontend.
4. Validate every action based on the user's role and transaction participation.
5. Use database transactions for critical operations.
6. Record every important action in transaction_events.
7. Implement mutual midman acceptance.
8. Implement concurrency-safe queue assignment.
9. Implement versioned transaction terms.
10. Require approval from both buyer and seller.
11. Separate payment submission from payment verification.
12. Restrict payment receipts using private storage and RLS.
13. Require actual payment verification before payment-dependent fulfillment.
14. Require buyer confirmation or an authorized dispute resolution before completion.
15. Allow reviews only after completed transactions.
16. Test unauthorized access and concurrent operations.

---

## 11. Suggested Backend Services

Organize transaction logic into services.

```text
services/
├── transaction.service.ts
├── transaction-proposal.service.ts
├── transaction-agreement.service.ts
├── transaction-queue.service.ts
├── payment.service.ts
├── fulfillment.service.ts
├── dispute.service.ts
└── review.service.ts
```

Each service should handle a specific business responsibility.

Do not place all transaction logic inside a single React component or route handler.

---

## 12. Important Security Rules

- Use Supabase RLS.
- Verify transaction participation before reading private records.
- Verify actor authorization before every state transition.
- Restrict transaction room membership.
- Restrict private attachments.
- Protect payment receipts.
- Protect dispute evidence.
- Prevent unauthorized midman assignment.
- Prevent self-assignment of admin permissions.
- Keep audit records.
- Rate-limit sensitive operations.
- Never expose service-role credentials to the browser.

---

## 13. Policy and Launch Restriction

The original marketplace concept involves Mobile Legends account transactions.

The publisher's Terms of Service may prohibit buying, selling, trading, transferring, or sharing game accounts.

Until the activity is confirmed as permitted or authorized:

- Keep real ML account trading disabled.
- Use simulated listings for development and testing.
- Do not claim official Moonton affiliation.
- Keep the marketplace configurable for permitted goods and services.

The manual payment workflow must also not be marketed as escrow unless the actual legal and operational arrangement supports that claim.
