import LegalPage from "../components/LegalPage";

export const metadata = { title: "Privacy Policy | ViralStudio AI", description: "How ViralStudio AI handles personal information." };

export default function PrivacyPage() {
  return <LegalPage
    title="Privacy Policy"
    updated="November 14, 2026"
    intro="This Privacy Policy explains how ViralStudio AI collects, uses, and protects information when you visit our website, create an account, purchase credits, or use our AI creation tools."
    sections={[
      { heading: "1. Information we may collect", items: ["Account information such as your name, email address, and authentication details.", "Transaction and billing information, such as purchase amount, currency, payment status, and transaction identifiers. Full payment card details are collected by Paddle through its secure checkout and are not received or stored by ViralStudio AI.", "Prompts, uploaded images, videos, generated outputs, and settings you choose to submit when using AI features.", "Usage, device, diagnostic, and log information needed to operate, maintain, secure, and improve the service."] },
      { heading: "2. How we use information", items: ["Create and manage your account and provide requested features.", "Process purchases, maintain credit balances, and provide customer support.", "Send service-related notices and respond to requests.", "Detect fraud, abuse, security incidents, and technical problems.", "Maintain, troubleshoot, and improve the platform and comply with legal obligations."] },
      { heading: "3. AI and service providers", paragraphs: ["When you request an AI generation, relevant prompts and uploaded inputs may be sent to third-party AI model or infrastructure providers so they can perform that request. Paddle.com acts as Merchant of Record and processes checkout, payment, tax, and order-support information. AI model and infrastructure providers may process prompts, reference media, and technical job data to generate requested outputs. Authentication, hosting, storage, analytics, and security providers may also process information needed for their functions. These providers process information under their own terms and privacy practices as well as applicable contractual arrangements. Avoid submitting sensitive personal information unless it is necessary and you have a lawful basis to do so."] },
      { heading: "4. Sharing", paragraphs: ["We do not sell your personal information. We may share the minimum information reasonably needed with service providers that help operate the platform, when required by law or valid legal process, to protect rights and safety, or in connection with a business transfer. We do not make user prompts or private generated files public by default through this policy."] },
      { heading: "5. Retention and security", paragraphs: ["We keep information for as long as reasonably necessary to provide the service, maintain account and transaction records, resolve disputes, enforce agreements, and meet legal requirements. Retention periods may differ by data type and provider. We use reasonable technical and organizational safeguards, but no online service can guarantee absolute security."] },
      { heading: "6. Your choices and rights", paragraphs: ["Depending on where you live, you may have rights to request access to, correction of, or deletion of personal information, or to object to or restrict certain processing. You may also contact us about closing your account. Some records may need to be retained for legal, security, or accounting reasons."] },
      { heading: "7. Children", paragraphs: ["ViralStudio AI is not intended for children who are not legally permitted to use the service. We do not knowingly seek to collect personal information from children in violation of applicable law."] },
      { heading: "8. International processing and policy updates", paragraphs: ["Our service providers may process information in countries other than your own. Where required, appropriate safeguards will be used for international transfers. We may update this policy as the service changes; the date above shows the latest revision."] },
      { heading: "9. Contact", paragraphs: ["For privacy questions or requests, email contact@viralstudio-ai.com. Please do not include passwords or full payment card details in your message."] }
    ]}
  />;
}
