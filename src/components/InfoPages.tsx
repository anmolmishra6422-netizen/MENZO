import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HERO_IMAGE } from '../data/catalogSeed';
import { useStore } from '../context/StoreContext';
import { AppView } from './Navbar';

export function InfoPage({ view }: { view: AppView }) {
  const { submitContactMessage, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitContactMessage(name, email, subject, message);
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err?.message || 'Unable to send message', 'error');
    }
  };

  if (view === 'contact') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Customer Concierge</p>
          <h1 className="font-display text-4xl font-semibold text-neutral-950">Contact Us</h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Questions about sizing, Indian shipping timelines, bulk wedding styling, or order updates? Reach our Mumbai support desk.
          </p>
          <div className="pt-4 border-t border-neutral-200 text-xs space-y-2 text-neutral-700">
            <p><strong>Email:</strong> concierge@menzo.in</p>
            <p><strong>Hours:</strong> Mon – Sat, 10:00 AM – 7:00 PM IST</p>
            <p><strong>Studio:</strong> Lower Parel, Mumbai 400013, Maharashtra</p>
          </div>
        </div>

        <div className="md:col-span-7">
          {sent ? (
            <div className="border border-neutral-200 p-8 bg-neutral-50 space-y-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <h2 className="font-display text-2xl font-semibold">Message Received</h2>
              <p className="text-sm text-neutral-600">
                Our customer care team has logged your inquiry and will reply within 24 business hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContact} className="border border-neutral-200 p-6 sm:p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="px-3.5 py-2.5 border border-neutral-300 text-sm"
                />
              </div>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject (e.g. Sizing question or Order inquiry)"
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
              />
              <textarea
                rows={4}
                required
                minLength={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we assist you?"
                className="w-full px-3.5 py-2.5 border border-neutral-300 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (view === 'about') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-10">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Our House</p>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold text-neutral-950 mb-4">
            MENZO — Style That Defines You
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed">
            Built for Indian men aged 16 to 45, MENZO brings together disciplined tailoring, breathable tropical-weight
            natural fabrics, heritage festive wear, and everyday essentials under one monochrome storefront.
          </p>
        </div>
        <img
          src={HERO_IMAGE}
          alt="MENZO Menswear Studio"
          referrerPolicy="no-referrer"
          className="w-full aspect-[16/9] object-cover"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-neutral-200 pt-8 text-sm">
          <div>
            <h2 className="font-semibold text-neutral-950 mb-2">Precision Proportions</h2>
            <p className="text-neutral-600">Blocks calibrated for Indian shoulders, chest drop, and summer breathability.</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-950 mb-2">Transparent INR Pricing</h2>
            <p className="text-neutral-600">All prices are inclusive of GST with zero hidden checkout markups.</p>
          </div>
          <div>
            <h2 className="font-semibold text-neutral-950 mb-2">Demonstration Catalogue Notice</h2>
            <p className="text-neutral-600">Sample products and sample reviews shown in this MVP are demonstration inventory.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'size-guide') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Fit Architecture</p>
          <h1 className="font-display text-4xl font-semibold text-neutral-950">MENZO Size Guide</h1>
        </div>
        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full text-sm text-left tabular-nums">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-xs uppercase text-neutral-500">
              <tr>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Chest (in)</th>
                <th className="py-3 px-4">Shoulder (in)</th>
                <th className="py-3 px-4">Waist (in)</th>
                <th className="py-3 px-4">UK Footwear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr><td className="py-3 px-4 font-semibold">S (38)</td><td className="px-4">38</td><td className="px-4">17.0</td><td className="px-4">30</td><td className="px-4">UK 7 (EU 41)</td></tr>
              <tr><td className="py-3 px-4 font-semibold">M (40)</td><td className="px-4">40</td><td className="px-4">17.8</td><td className="px-4">32</td><td className="px-4">UK 8 (EU 42)</td></tr>
              <tr><td className="py-3 px-4 font-semibold">L (42)</td><td className="px-4">42</td><td className="px-4">18.5</td><td className="px-4">34</td><td className="px-4">UK 9 (EU 43)</td></tr>
              <tr><td className="py-3 px-4 font-semibold">XL (44)</td><td className="px-4">44</td><td className="px-4">19.2</td><td className="px-4">36</td><td className="px-4">UK 10 (EU 44)</td></tr>
              <tr><td className="py-3 px-4 font-semibold">XXL (46)</td><td className="px-4">46</td><td className="px-4">20.0</td><td className="px-4">38</td><td className="px-4">UK 11 (EU 45)</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const POLICY_CONTENT: Record<string, { title: string; subtitle: string; sections: { h: string; p: string }[] }> = {
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'Data Governance & Customer Isolation',
      sections: [
        {
          h: 'Customer Data Ownership',
          p: 'Your MENZO profile, saved delivery addresses, wishlist, shopping bag, and order history are stored securely in Cloud Firestore under your authenticated UID and are inaccessible to other customers.',
        },
        {
          h: 'Authentication & Security',
          p: 'MENZO relies on Firebase Authentication (Google Sign-In and verified Email/Password credentials). We never store raw payment card numbers or bank passwords.',
        },
      ],
    },
    terms: {
      title: 'Terms & Conditions',
      subtitle: 'Storefront Terms of Use',
      sections: [
        {
          h: 'Demonstration Storefront Notice',
          p: 'Orders placed in MVP Test Checkout Mode do not process real financial transactions. Pricing is displayed in Indian Rupees (₹) inclusive of applicable taxes.',
        },
        {
          h: 'Order Cancellation',
          p: 'Customers may cancel orders directly from their Customer Dashboard while the order status is Order Placed or Confirmed.',
        },
      ],
    },
    shipping: {
      title: 'Shipping Policy',
      subtitle: 'Pan-India Dispatch & Delivery',
      sections: [
        {
          h: 'Delivery Charges',
          p: 'Orders of ₹1,999 or above qualify for complimentary pan-India shipping. A flat ₹149 shipping fee applies below ₹1,999.',
        },
        {
          h: 'Dispatch Timelines',
          p: 'Orders are packed within 24–48 business hours and delivered in 3–5 business days across metro cities and 5–7 business days across rest of India.',
        },
      ],
    },
    returns: {
      title: 'Return & Refund Policy',
      subtitle: '14-Day Hassle-Free Exchanges',
      sections: [
        {
          h: 'Eligibility',
          p: 'Unworn, unwashed garments with original tags attached may be returned or exchanged within 14 days of delivery from your Customer Dashboard.',
        },
        {
          h: 'Non-Returnable Categories',
          p: 'For hygiene reasons, innerwear (briefs, trunks, vests) cannot be returned once opened.',
        },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Quick Answers',
      sections: [
        {
          h: 'How do I track my MENZO order?',
          p: 'Sign in and open your Customer Dashboard under My Orders & Tracking to see real-time status updates from Order Placed through Delivered.',
        },
        {
          h: 'How do discount coupons work?',
          p: 'Enter active codes such as MENZO10, STYLE500, or FESTIVE15 in your Shopping Bag before proceeding to checkout.',
        },
        {
          h: 'Is live online payment charged right now?',
          p: 'No. Unless live payment gateway keys are configured, checkout operates transparently in Test Checkout Mode (MVP) or Cash on Delivery.',
        },
      ],
    },
  };

  const doc = POLICY_CONTENT[view] || POLICY_CONTENT.faq;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">{doc.subtitle}</p>
        <h1 className="font-display text-4xl font-semibold text-neutral-950">{doc.title}</h1>
      </div>
      <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
        {doc.sections.map((s) => (
          <div key={s.h} className="py-6 space-y-2">
            <h2 className="text-base font-semibold text-neutral-950">{s.h}</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
