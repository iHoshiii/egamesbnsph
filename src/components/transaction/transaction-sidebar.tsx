import { FulfillmentPanel } from "@/components/transaction/fulfillment-panel";
import { TermsPanel } from "@/components/transaction/terms-panel";
import { PaymentPanel } from "@/components/transaction/payment-panel";
import { ReviewPanel } from "@/components/transaction/review-panel";
import { DisputePanel } from "@/components/transaction/dispute-panel";

interface TransactionSidebarProps {
  transactionId: string;
  currentUserId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  isMidman: boolean;
  fulfillmentNotes: string | null;
  agreedAmountCentavos: number | null;
  midmanFeeCentavos: number | null;
  termsNotes: string | null;
  buyerApproved: boolean;
  sellerApproved: boolean;
  paymentMethods: { id: string; methodName: string; accountName: string; accountNumberMasked: string }[];
  payments: { id: string; amountCentavos: number; status: string; referenceNumber: string | null; signedReceiptUrl: string | null }[];
  review: { vouchSlug: string; rating: number; comment: string } | null;
  dispute: { id: string; status: string; reason: string; evidence: { id: string; notes: string | null; signedUrl: string | null }[] } | null;
}

export function TransactionSidebar(props: TransactionSidebarProps) {
  return (
    <div className="space-y-6">
      <FulfillmentPanel
        transactionId={props.transactionId}
        status={props.status}
        isMidman={props.isMidman}
        isSeller={props.isSeller}
        isBuyer={props.isBuyer}
        fulfillmentNotes={props.fulfillmentNotes}
      />
      <TermsPanel
        transactionId={props.transactionId}
        status={props.status}
        isMidman={props.isMidman}
        isBuyer={props.isBuyer}
        isSeller={props.isSeller}
        agreedAmountCentavos={props.agreedAmountCentavos}
        midmanFeeCentavos={props.midmanFeeCentavos}
        termsNotes={props.termsNotes}
        buyerApproved={props.buyerApproved}
        sellerApproved={props.sellerApproved}
      />
      <PaymentPanel
        transactionId={props.transactionId}
        currentUserId={props.currentUserId}
        status={props.status}
        isBuyer={props.isBuyer}
        isMidman={props.isMidman}
        paymentMethods={props.paymentMethods}
        payments={props.payments}
      />
      {props.status === "COMPLETED" && (
        <ReviewPanel
          transactionId={props.transactionId}
          isBuyer={props.isBuyer}
          existingVouchSlug={props.review?.vouchSlug ?? null}
          existingRating={props.review?.rating ?? null}
          existingComment={props.review?.comment ?? null}
        />
      )}
      <DisputePanel
        transactionId={props.transactionId}
        currentUserId={props.currentUserId}
        txStatus={props.status}
        isBuyerOrSeller={props.isBuyer || props.isSeller}
        dispute={props.dispute}
      />
    </div>
  );
}
