'use client'

import { useEffect, useState } from 'react'

export default function IslamicPattern() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Animated Islamic Geometric Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        {/* Floating Particles */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>

        {/* Geometric Patterns */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="islamic-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Star Pattern */}
              <g className="pattern-star">
                <path
                  d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z"
                  fill="currentColor"
                  opacity="0.4"
                />
              </g>
              {/* Circular Pattern */}
              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" className="pattern-circle" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3" className="pattern-circle-2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
        </svg>

        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-background/50 to-background"></div>
      </div>

      <style jsx>{`
        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: hsl(var(--primary) / 0.6);
          border-radius: 50%;
          animation: float 20s infinite ease-in-out;
        }

        .particle-1 {
          top: 20%;
          left: 20%;
          animation-delay: 0s;
          animation-duration: 25s;
        }

        .particle-2 {
          top: 60%;
          left: 80%;
          animation-delay: 5s;
          animation-duration: 30s;
        }

        .particle-3 {
          top: 40%;
          left: 40%;
          animation-delay: 10s;
          animation-duration: 35s;
        }

        .particle-4 {
          top: 80%;
          left: 60%;
          animation-delay: 15s;
          animation-duration: 28s;
        }

        .particle-5 {
          top: 30%;
          left: 70%;
          animation-delay: 8s;
          animation-duration: 32s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translate(100px, -100px) scale(1.5);
            opacity: 0.8;
          }
          90% {
            opacity: 1;
          }
        }

        .pattern-star {
          animation: rotate-pattern 60s linear infinite;
          transform-origin: 50px 50px;
        }

        .pattern-circle {
          animation: pulse-circle 4s ease-in-out infinite;
          transform-origin: 50px 50px;
        }

        .pattern-circle-2 {
          animation: pulse-circle 4s ease-in-out infinite reverse;
          transform-origin: 50px 50px;
        }

        @keyframes rotate-pattern {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-circle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        .bg-gradient-radial {
          background: radial-gradient(
            circle at center,
            transparent 0%,
            hsl(var(--background) / 0.3) 50%,
            hsl(var(--background) / 0.8) 100%
          );
        }
      `}</style>
    </>
  )
}

