
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
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
            <h1 className="text-3xl font-bold mb-6">SleekTrade – Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: 3/21/2025</p>

            <p>
              Welcome to SleekTrade! These Terms of Service ("Terms") govern your use of the SleekTrade 
              website, platform, mobile applications, and services (collectively, the "Service" or "SleekTrade"), 
              operated by [CMC Solutions] ("we," "our," or "us").
            </p>
            <p>
              By accessing or using SleekTrade, you agree to be bound by these Terms. If you do not agree, 
              please do not use our Service.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">1. Eligibility</h2>
            <p>
              You must be at least 18 years old or the legal age of majority in your jurisdiction to use 
              SleekTrade. By using our Service, you represent and warrant that you meet these requirements.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">2. Service Description</h2>
            <p>
              SleekTrade is a modern trading journal designed to help users track, analyze, and reflect on their 
              trading activities. It is intended for educational and informational purposes only and does not 
              provide financial, investment, or trading advice.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">3. Not Financial Advice – Do Your Own Research</h2>
            <p>
              All content and features provided by SleekTrade are strictly for informational and journaling 
              purposes. We are <strong>not financial advisors</strong>, and nothing on our platform should be construed as a 
              recommendation to buy, sell, or hold any financial instrument.
            </p>
            <p>
              Always do your own research (DYOR) and consult a licensed financial professional before 
              making any investment decisions. You are solely responsible for your trading decisions and any 
              outcomes resulting from them.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">4. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for all 
              activity under your account. You agree to notify us immediately if you suspect unauthorized 
              use of your account.
            </p>
            <p>
              We reserve the right to suspend or terminate your account if we believe you have violated 
              these Terms.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">5. Data & Privacy</h2>
            <p>
              We take data privacy seriously. Please review our <a href="/privacy">Privacy Policy</a> for information 
              on how we collect, use, and protect your data. By using SleekTrade, you consent to the collection 
              and use of your data as described in our Privacy Policy.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service for any illegal or unauthorized purpose.</li>
              <li>Upload or transmit harmful code or content.</li>
              <li>Attempt to reverse-engineer or interfere with the platform's security or functionality.</li>
              <li>Misrepresent your identity or impersonate others.</li>
            </ul>
            <p>We reserve the right to remove or restrict access to content or accounts that violate these Terms.</p>

            <h2 className="text-xl font-bold mt-8 mb-4">7. Subscription & Payments</h2>
            <p>
              Certain features of SleekTrade may be offered on a subscription basis. By subscribing, you 
              agree to pay the applicable fees and any applicable taxes.
            </p>
            <p>
              All payments are final and non-refundable, except as required by law or as explicitly stated by us.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">8. Intellectual Property</h2>
            <p>
              All content, branding, and technology on the SleekTrade platform are the intellectual property 
              of CMC Solutions or its licensors. You agree not to copy, modify, distribute, or create 
              derivative works without express permission.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">9. Disclaimer of Warranties</h2>
            <p>
              SleekTrade is provided "as is" and "as available" without warranties of any kind, express or 
              implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
            <p>
              We disclaim all liability for any loss or damage resulting from your reliance on the Service.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, SleekTrade and its affiliates shall not be liable for 
              any indirect, incidental, special, consequential, or punitive damages arising from or related 
              to your use of the Service.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">11. Modifications to the Terms</h2>
            <p>
              We may update these Terms at any time. We'll notify you of significant changes, but it is your 
              responsibility to review the Terms periodically. Continued use of SleekTrade after changes 
              constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">12. Termination</h2>
            <p>
              You may stop using SleekTrade at any time. We reserve the right to terminate or suspend your 
              access to the Service for any violation of these Terms or for any reason at our discretion.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of The Commonwealth 
              of Virginia, USA, without regard to conflict of law principles.
            </p>

            <h2 className="text-xl font-bold mt-8 mb-4">14. Contact</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p>📧 help@sleektrade.co</p>
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

export default Terms;
