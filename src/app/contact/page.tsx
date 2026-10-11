import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";
import { FadeIn } from "@/components/motion";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach FutureBite in Yangon. Opening hours, location and enquiries.",
};

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-24">
        <div className="container-narrow mx-auto px-6 lg:px-10">
          <FadeIn>
            <div className="text-center mb-16">
              <p className="text-label mb-4">Contact</p>
              <h1 className="text-display-lg text-ivory mb-6">Get In Touch</h1>
              <p className="text-body-lg max-w-xl mx-auto">
                For reservations, private dining or anything else — we reply
                within one business day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-surface border border-border/50 p-8 text-center">
                <MapPin size={24} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-ivory font-display text-lg mb-2">Visit</h2>
                <p className="text-ivory-muted text-sm">
                  Yangon, Myanmar
                  <br />
                  <a
                    href="https://maps.google.com/?q=Yangon+Myanmar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold hover:text-ivory transition-colors"
                  >
                    Get directions
                  </a>
                </p>
              </div>
              <div className="bg-surface border border-border/50 p-8 text-center">
                <Clock size={24} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-ivory font-display text-lg mb-2">Hours</h2>
                <p className="text-ivory-muted text-sm">
                  Tuesday — Sunday
                  <br />
                  6:00 PM — 11:00 PM
                  <br />
                  <span className="text-ivory-dim">Closed Mondays</span>
                </p>
              </div>
              <div className="bg-surface border border-border/50 p-8 text-center">
                <Phone size={24} className="text-gold mx-auto mb-4" strokeWidth={1.5} />
                <h2 className="text-ivory font-display text-lg mb-2">Call</h2>
                <p className="text-ivory-muted text-sm">
                  <a href="tel:+959000000000" className="text-gold hover:text-ivory transition-colors">
                    +95 9 000 000 000
                  </a>
                  <br />
                  <a
                    href="mailto:hello@futurebite.com"
                    className="inline-flex items-center gap-1 mt-1 text-gold hover:text-ivory transition-colors"
                  >
                    <Mail size={12} /> hello@futurebite.com
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-surface border border-border/50 p-8">
              <h2 className="text-display text-2xl text-ivory mb-6">
                Send an enquiry
              </h2>
              <ContactForm />
            </div>
          </FadeIn>
        </div>
      </main>
      <Footer />
    </>
  );
}

function ContactForm() {
  return (
    <form
      className="space-y-5"
      action="mailto:hello@futurebite.com"
      method="post"
      encType="text/plain"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
            Name
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors"
          placeholder="Private dining enquiry"
        />
      </div>
      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-ivory-dim mb-2">
          Message
        </label>
        <textarea
          name="message"
          rows={5}
          className="w-full bg-bg border border-border-light text-ivory px-4 py-3 text-sm focus:border-gold focus:outline-none transition-colors resize-none"
          placeholder="How can we help?"
        />
      </div>
      <button type="submit" className="btn-primary text-xs py-4 px-10">
        Send enquiry
      </button>
    </form>
  );
}