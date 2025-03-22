
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Show back to top button when scrolled down
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PageTransition>
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
          <Button
            variant="outline"
            size="sm"
            className="mb-6 flex items-center gap-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>

          <div className="prose prose-sm sm:prose dark:prose-invert max-w-full">
            <h1 className="text-3xl font-bold mb-6">SleekTrade – Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: 3/21/2025</p>

            <p>
              At SleekTrade, we prioritize protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our platform and services.
            </p>
            <p>
              By using SleekTrade, you consent to the data practices described in this Privacy Policy.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-bold mt-6 mb-3">Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Email address and login credentials</li>
              <li>Name and profile information</li>
              <li>Payment and billing information</li>
              <li>Trading data and journal entries you input</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-bold mt-6 mb-3">Usage Data</h3>
            <p>
              We automatically collect certain information about how you interact with our platform, including:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address and device information</li>
              <li>Browser type and settings</li>
              <li>Operating system</li>
              <li>Referring website</li>
              <li>Pages visited and features used</li>
              <li>Time and date of access</li>
              <li>User behavior and patterns</li>
            </ul>

            <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We may use the information we collect for the following purposes:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage your account</li>
              <li>Personalize your experience and deliver content relevant to your interests</li>
              <li>Send you administrative information, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Analyze usage patterns and optimize our platform</li>
              <li>Protect against unauthorized access and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-bold mt-8 mb-4">3. How We Share Your Information</h2>
            <p>We may share your information with the following third parties:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Service providers who perform services on our behalf</li>
              <li>Payment processors to complete transactions</li>
              <li>Analytics and search engine providers that assist us in platform optimization</li>
              <li>Legal authorities when required by law or to protect our rights</li>
            </ul>
            <p>
              We do not sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. However, no 
              method of transmission over the Internet or electronic storage is 100% secure, and we 
              cannot guarantee absolute security.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">5. Your Rights and Choices</h2>
            <p>You have certain rights regarding your personal information, including:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Accessing, correcting, or updating your personal information</li>
              <li>Requesting deletion of your data (subject to certain exceptions)</li>
              <li>Opting out of marketing communications</li>
              <li>Setting browser preferences to reject cookies</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information in the "Contact Us" section below.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">6. Children's Privacy</h2>
            <p>
              SleekTrade is not intended for individuals under the age of 18. We do not knowingly collect 
              personal information from children. If you believe a child has provided us with personal 
              information, please contact us immediately.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">7. Third-Party Links</h2>
            <p>
              SleekTrade may contain links to third-party websites. We are not responsible for the privacy 
              practices or content of these sites. We encourage you to review the privacy policies of any 
              third-party sites you visit.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">8. International Data Transfers</h2>
            <p>
              Your information may be processed, stored, and used outside of the country where you are located. 
              Data protection laws vary among countries, and the laws in your country may differ from those in 
              other countries where your data is stored.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">9. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal 
              requirements. We will notify you of significant changes by posting the new policy on our 
              platform or by email.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our data practices, 
              please contact us at:
            </p>
            <p>📧 privacy@sleektrade.co</p>
            <p>🌐 https://sleektrade.co/help</p>
          </div>

          {showBackToTop && (
            <Button
              className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              ↑
            </Button>
          )}
        </main>
      </PageTransition>
    </div>
  );
};

export default Privacy;
