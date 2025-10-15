"use client"
import React from 'react'
import { useToggle } from '../contexts/toggle';

export default function Footer() {
  const { isToggled } = useToggle();

  const footerClasses = `border-t transition-colors duration-200 ${
    isToggled ? 'bg-gray-900 border-gray-700' : 'bg-slate-100 border-slate-200'
  }`;

  const linkClasses = `text-sm transition-colors ${
    isToggled ? 'text-gray-400 hover:text-gray-100' : 'text-slate-600 hover:text-slate-900'
  }`;

  const textClasses = `text-sm ${
    isToggled ? 'text-gray-400' : 'text-slate-600'
  }`;

  const links = [
    { href: '#terms', text: 'Terms of Service' },
    { href: '#privacy', text: 'Privacy Policy' },
    { href: '#contact', text: 'Contact Us' }
  ];

  return (
    <footer className={footerClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex gap-6">
            {links.map(({ href, text }) => (
              <a key={href} className={linkClasses} href={href}>
                {text}
              </a>
            ))}
          </div>
          <p className={textClasses}>
            © 2024 ThumbGen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}