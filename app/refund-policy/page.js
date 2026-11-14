import LegalPage from "../components/LegalPage";

export const metadata = { title: "Refund Policy | ViralStudio AI", description: "Refunds and credit adjustments for ViralStudio AI purchases." };

export default function RefundPolicyPage() {
  return <LegalPage
    title="Refund Policy"
    updated="November 14, 2026"
    intro="ViralStudio AI credit packs are one-time digital purchases processed by Paddle.com, our Merchant of Record. Paddle administers buyer payment support and refunds under its current Buyer Refund Policy. This policy explains our service-side handling of generation failures and credit issues and does not remove any non-waivable rights under local law."
    sections={[
      { heading: "1. Paddle orders and refund requests", paragraphs: ["For order-related refund, withdrawal, or payment requests, use the support link in your Paddle receipt or visit paddle.net. Paddle reviews and processes refund requests under its current Buyer Refund Policy and applicable consumer protection law. Paddle's policy may provide statutory withdrawal rights in some countries and discretionary refunds in other circumstances. Nothing in this policy limits mandatory rights you have under the law that applies to you.", "Paddle is the seller of record for transactions processed through Paddle. ViralStudio AI does not independently collect payment card details or issue a separate payment outside Paddle. If a refund is agreed or required, it must be processed through Paddle rather than paid directly by us."] },
      { heading: "2. Failed or rejected generations", paragraphs: ["Credits are intended to be charged only when an AI generation completes successfully. If a job fails, is rejected by a provider, or does not produce a completed result, it should not consume credits. If credits were temporarily deducted, they should be restored after the failed status is confirmed. Contact contact@viralstudio-ai.com if your balance has not been corrected; include your account email, approximate time, and job reference. Never send your password or full payment card details."] },
      { heading: "3. Duplicate charges or missing credits", paragraphs: ["If you believe you were charged more than once, charged an incorrect amount, or paid but did not receive the purchased credits, first use the order support link in your Paddle receipt for payment assistance. You may also contact contact@viralstudio-ai.com about the service-side credit balance so we can investigate the transaction reference and generation ledger. Any payment refund is handled through Paddle."] },
      { heading: "4. One-time credit packs", paragraphs: ["Credit packs shown on the Pricing page are one-time purchases and do not automatically renew. Refund eligibility can depend on applicable law, the type of transaction, whether credits or digital services have been used, and Paddle's review. The fact that credits are delivered to an account does not remove statutory consumer rights or remedies for faulty, misdescribed, or unavailable services."] },
      { heading: "5. Applicable policy and contact", paragraphs: ["Read Paddle's current Refund Policy at https://www.paddle.com/legal/refund-policy and contact Paddle Buyer Support at https://paddle.net for order-related requests. For technical issues with generation or credit balances, contact contact@viralstudio-ai.com."] }
    ]}
  />;
}
