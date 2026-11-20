import React from 'react';
import { AppView } from './Navbar';

interface FooterProps {
  onNavigate: (
    view: AppView,
    params?: { category?: string; subcategory?: string; collection?: string; search?: string }
  ) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-white border-t border-neutral-200 text-neutral-700">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <span className="font-display text-2xl font-bold tracking-[0.14em] text-neutral-950 uppercase block">
            MENZO
          </span>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
            Style That Defines You. Contemporary Indian menswear across tailoring, linen, ethnic craft, footwear, and accessories.
          </p>
        </div>

        <div className="space-y-2.5 text-xs">
          <p className="font-semibold uppercase tracking-wider text-neutral-950">Departments</p>
          <ul className="space-y-2">
            {['Topwear', 'Bottomwear', 'Ethnic Wear', 'Sportswear & Activewear', 'Footwear', 'Accessories'].map(
              (cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onNavigate('catalog', { category: cat })}
                    className="hover:text-neutral-950 hover:underline underline-offset-4"
                  >
                    {cat}
                  </button>
                </li>
              )
            )}
          </ul>
        </div>

        <div className="space-y-2.5 text-xs">
          <p className="font-semibold uppercase tracking-wider text-neutral-950">Customer Care</p>
          <ul className="space-y-2">
            <li><button type="button" onClick={() => onNavigate('contact')} className="hover:text-neutral-950 hover:underline">Contact Us</button></li>
            <li><button type="button" onClick={() => onNavigate('about')} className="hover:text-neutral-950 hover:underline">About MENZO</button></li>
            <li><button type="button" onClick={() => onNavigate('size-guide')} className="hover:text-neutral-950 hover:underline">Size Guide</button></li>
            <li><button type="button" onClick={() => onNavigate('faq')} className="hover:text-neutral-950 hover:underline">FAQ</button></li>
            <li><button type="button" onClick={() => onNavigate('shipping')} className="hover:text-neutral-950 hover:underline">Shipping Policy</button></li>
            <li><button type="button" onClick={() => onNavigate('returns')} className="hover:text-neutral-950 hover:underline">Return & Refund Policy</button></li>
          </ul>
        </div>

        <div className="space-y-2.5 text-xs">
          <p className="font-semibold uppercase tracking-wider text-neutral-950">Legal & Portals</p>
          <ul className="space-y-2">
            <li><button type="button" onClick={() => onNavigate('privacy')} className="hover:text-neutral-950 hover:underline">Privacy Policy</button></li>
            <li><button type="button" onClick={() => onNavigate('terms')} className="hover:text-neutral-950 hover:underline">Terms & Conditions</button></li>
            <li><button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-neutral-950 hover:underline">Customer Dashboard</button></li>
            <li><button type="button" onClick={() => onNavigate('admin')} className="hover:text-neutral-950 hover:underline font-medium">Admin Portal</button></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-200 px-4 sm:px-6 lg:px-10 py-5">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} MENZO Men's Fashion Store (India). All prices in INR (₹).</p>
          <div className="flex items-center gap-4">
            <span>Instagram</span>
            <span>·</span>
            <span>YouTube</span>
            <span>·</span>
            <span>X</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
