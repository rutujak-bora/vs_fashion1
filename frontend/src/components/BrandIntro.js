import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BrandIntro({ onComplete }) {
  const [step, setStep] = useState(0); // 0: entry/overlap, 1: separate/reveal, 2: exit
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Disable body scrolling during animation
    document.body.style.overflow = 'hidden';

    // Handle responsiveness
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Animation timeline
    const separateTimer = setTimeout(() => {
      setStep(1);
    }, 1600); // Separate letters and reveal central logo at 1.6s

    const exitTimer = setTimeout(() => {
      setStep(2);
    }, 3200); // Fade out the entire overlay at 3.2s

    const completeTimer = setTimeout(() => {
      onComplete();
      document.body.style.overflow = '';
    }, 3800); // Unmount and restore scroll at 3.8s

    return () => {
      clearTimeout(separateTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  // Dynamic separation distance based on viewport
  const shiftX = isMobile ? 55 : 95;

  return (
    <AnimatePresence>
      {step < 2 && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          animate={{ opacity: step === 2 ? 0 : 1 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(circle, #A4305E 0%, #8B1B4A 55%, #5E0F30 100%)',
          }}
        >
          {/* Main Visual Container */}
          <div className="relative flex items-center justify-center w-full max-w-lg h-[240px] md:h-[320px]">
            
            {/* Animated "V" */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: 15 }}
              animate={{
                opacity: step === 0 ? 0.9 : 0.25,
                scale: step === 0 ? 1 : 0.85,
                x: step === 0 ? 15 : -shiftX,
              }}
              transition={{
                duration: step === 0 ? 1.0 : 0.9,
                ease: [0.25, 1, 0.5, 1], // Cubic-bezier easeOut
              }}
              className="absolute text-7xl md:text-9xl font-bold select-none text-[#FAFAFA]"
              style={{
                fontFamily: "'Playfair Display', serif",
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
              }}
            >
              V
            </motion.span>

            {/* Central Kurti Silhouette & Circle Frame */}
            <div className="absolute z-10 flex items-center justify-center">
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 100 120"
                      className="w-24 h-24 md:w-36 md:h-36 text-[#E6C280] drop-shadow-[0_4px_16px_rgba(230,194,128,0.35)]"
                    >
                      {/* Elegant outer dashed circle */}
                      <motion.circle
                        cx="50"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="#E6C280"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        initial={{ pathLength: 0, rotate: -45 }}
                        animate={{ pathLength: 1, rotate: 0 }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.1 }}
                        opacity="0.4"
                      />
                      {/* Elegant inner solid circle */}
                      <motion.circle
                        cx="50"
                        cy="60"
                        r="45"
                        fill="none"
                        stroke="#E6C280"
                        strokeWidth="0.5"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.15 }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                      />

                      {/* Stylized Kurti Path Line Art */}
                      <motion.path
                        d="M 42 22 C 45 28, 55 28, 58 22 L 72 28 L 66 52 L 61 50 C 57 62, 58 82, 64 110 L 36 110 C 42 82, 43 62, 39 50 L 34 52 L 28 28 Z"
                        fill="none"
                        stroke="#E6C280"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
                      />

                      {/* Neck embroidery accents */}
                      <motion.path
                        d="M 50 26 L 50 56 M 46 32 L 54 32 M 47 40 L 53 40 M 48 48 L 52 48"
                        fill="none"
                        stroke="#E6C280"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.8 }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.6 }}
                      />

                      {/* Sleek hemline dots accent */}
                      <motion.circle
                        cx="50"
                        cy="105"
                        r="1.5"
                        fill="#E6C280"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.9 }}
                        transition={{ delay: 1.2 }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Animated "S" */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -15 }}
              animate={{
                opacity: step === 0 ? 0.9 : 0.25,
                scale: step === 0 ? 1 : 0.85,
                x: step === 0 ? -15 : shiftX,
              }}
              transition={{
                duration: step === 0 ? 1.0 : 0.9,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="absolute text-7xl md:text-9xl font-bold select-none text-[#FAFAFA]"
              style={{
                fontFamily: "'Playfair Display', serif",
                textShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
              }}
            >
              S
            </motion.span>
          </div>

          {/* Titles & Branding */}
          <div className="mt-8 text-center min-h-[80px]">
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                  className="px-6"
                >
                  <h1
                    className="text-3xl md:text-4xl font-bold tracking-wide text-[#FAFAFA] mb-2"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      letterSpacing: '0.05em',
                    }}
                  >
                    VS Fashion
                  </h1>
                  <p
                    className="text-xs md:text-sm uppercase tracking-[0.25em] text-[#C4969C] font-medium"
                    style={{
                      fontFamily: "'Lato', sans-serif",
                    }}
                  >
                    Premium Women's Ethnic Wear
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
