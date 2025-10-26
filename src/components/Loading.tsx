"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingPageProps {
  isToggled?: boolean;
}

export default function LoadingPage({ isToggled  }: LoadingPageProps) {
  const containerClasses = `fixed inset-0 flex items-center justify-center transition-colors duration-200 ${
    isToggled
      ? "bg-gray-900"
      : "bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800"
  }`;

  const logoClasses = `h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 ${
    isToggled ? "text-blue-400" : "text-white"
  }`;

  const textClasses = `mt-6 text-lg font-semibold ${
    isToggled ? "text-gray-300" : "text-white"
  }`;

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ 
            scale: 1,
            opacity: 1,
          }}
        >
          <motion.svg
            className={logoClasses}
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <path
              d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
              fill="currentColor"
            />
          </motion.svg>
        </motion.div>

        {/* Pulsing Dots */}
        <div className="mt-8 flex space-x-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className={`h-3 w-3 rounded-full ${
                isToggled ? "bg-blue-400" : "bg-white"
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Loading Text */}
        <motion.p
          className={textClasses}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  );
}