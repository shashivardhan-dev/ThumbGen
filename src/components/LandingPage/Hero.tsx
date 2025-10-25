"use client";

import React from "react";
import Link from "next/link";
import { useToggle } from "../../contexts/toggle";
import { useUser, useClerk, SignInButton, UserButton } from "@clerk/nextjs";

export default function Hero() {
  const { isToggled } = useToggle();
  const { isSignedIn, user, isLoaded } = useUser();

  const sectionClasses = `relative py-20 lg:py-32 transition-colors duration-200 ${
    isToggled
      ? "bg-gray-900"
      : "bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"
  }`;

  const overlayClasses = `absolute inset-0 ${
    isToggled ? "bg-gray-800/30" : "bg-black/20"
  }`;

  const titleClasses = `text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em] ${
    isToggled ? "text-white" : "text-white"
  }`;

  const descriptionClasses = `mt-4 text-lg ${
    isToggled ? "text-gray-300" : "text-slate-200"
  }`;

  const buttonClasses = `mt-8 flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 text-base font-bold leading-normal tracking-[0.015em] mx-auto transition-all duration-200 ${
    isToggled
      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
      : "bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl hover:scale-105"
  }`;

  return (
    <section className={sectionClasses}>
      <div className={overlayClasses} />
      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <h1 className={titleClasses}>Create Stunning Thumbnails in Minutes</h1>
        <p className={descriptionClasses}>
          Elevate your content with professional-looking thumbnails. Our
          intuitive tool makes it easy to design eye-catching visuals for any
          platform.
        </p>

        {isSignedIn ? (
          <Link href="/create">
            <button type="button" className={buttonClasses}>
              <span className="truncate">Start Creating</span>
            </button>
          </Link>
        ) : (
          <SignInButton mode="modal" fallbackRedirectUrl="/home">
            <button
              type="button"
              className={buttonClasses}
            >
              <span className="truncate">Start Creating for Free</span>
            </button>
          </SignInButton>
        )}
      </div>
    </section>
  );
}
