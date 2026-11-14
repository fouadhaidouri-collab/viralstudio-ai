import LegalPage from "../components/LegalPage";

export const metadata = { title: "Refund Policy | ViralStudio AI", description: "Refunds, credit adjustments, and cancellations for ViralStudio AI." };

export default function RefundPolicyPage() {
  return <LegalPage
    title="Refund Policy"
    updated="November 14, 2026"
    intro="This policy explains how ViralStudio AI handles unsuccessful AI generations, credit adjustments, and requests for refunds on purchases made through our website."
    sections={[
      { heading: "1. Failed or rejected generations", paragraphs: ["Credits are intended to be charged only when an AI generation completes successfully. If a job fails, is rejected by a provider, or does not produce a completed result, it should not consume credits. If credits were temporarily deducted, they will be restored after the failed status is confirmed. Please contact support if your balance has not been corrected."] },
      { heading: "2. Credit pack purchases", paragraphs: ["Credit packs are one-time digital purchases. Because credits are made available immediately, purchases are generally non-refundable once credits have been used. If you purchased a pack by mistake and none of its credits have been used, contact us within 14 days of purchase and we will review the request, subject to applicable consumer protection laws and any mandatory refund rights.", "We may ask for the account email, order or transaction reference, purchase date, and a short explanation so we can locate and review the payment. Never send full card details or your password."] },
      { heading: "3. Duplicate or incorrect charges", paragraphs: ["If you believe you were charged more than once for the same purchase, charged an incorrect amount, or paid but did not receive the purchased credits, contact us. We will investigate the transaction and, where an error is confirmed, correct the credit balance or arrange an appropriate refund through the payment provider."] },
      { heading: "4. Subscriptions and cancellation", paragraphs: ["The credit packs displayed on our Pricing page are one-time purchases unless checkout clearly identifies a recurring subscription. If a recurring subscription is offered to you, its billing interval and renewal terms will be shown before payment. You may cancel future renewals using the account or payment-management method provided for that subscription. Cancellation does not automatically refund a billing period already paid, except where required by law or stated at checkout."] },
      { heading: "5. How to request help", paragraphs: ["Email contact@viralstudio-ai.com with the subject “Refund or Credit Request”. Include your account email and transaction reference. We aim to review requests promptly; response times may vary depending on payment-provider verification. Approved refunds are returned through the original payment method where possible, and processing time depends on the provider and bank."] },
      { heading: "6. Your legal rights", paragraphs: ["This policy does not limit any mandatory rights you may have under applicable consumer protection laws. If local law gives you a right to a refund or cancellation that is broader than this policy, that law will apply."] }
    ]}
  />;
}
