import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How FutureBite collects, uses and protects your personal data.",
};

const sections = [
  {
    heading: "What we collect",
    body: "When you create an account we store your name, email address, phone number and order history. When you book a table we store the reservation details you give us. We do not store payment card numbers — payments are handled at the till and we retain only whether a bill was settled and by which method.",
  },
  {
    heading: "Why we collect it",
    body: "To manage your reservations and orders, to operate the Royal Points programme, and to contact you about bookings you have made. We will not use your details for marketing without your consent.",
  },
  {
    heading: "Royal Points",
    body: "You earn one point for every 10,000 kyat of settled spend, and a 10,000 kyat coupon for every 100 points. Points are credited once your bill is settled. Coupons belong to the account they were issued to and can only be spent by that account.",
  },
  {
    heading: "How long we keep it",
    body: "Account and order records are retained for as long as your account is open and for seven years afterwards for accounting purposes.",
  },
  {
    heading: "Your rights",
    body: "You can request a copy of the data we hold about you, ask us to correct it, or ask us to delete your account. Write to privacy@futurebite.com and we will respond within 30 days.",
  },
  {
    heading: "Sharing",
    body: "We share your details only with the payment processor handling a bill and, where required, with authorities. We never sell your data.",
  },
  {
    heading: "Contact",
    body: "Questions about this policy can be sent to privacy@futurebite.com or by post to FutureBite, Yangon, Myanmar.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10 max-w-3xl">
          <FadeIn>
            <p className="text-label mb-4">Privacy</p>
            <h1 className="text-display-lg text-ivory mb-4">Privacy Policy</h1>
            <p className="text-ivory-dim text-sm mb-12">
              Last updated October 2026
            </p>

            <div className="space-y-8">
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="text-display text-xl text-ivory mb-3">
                    {s.heading}
                  </h2>
                  <p className="text-ivory-muted text-sm leading-relaxed">
                    {s.body}
                  </p>
                </section>
              ))}
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}