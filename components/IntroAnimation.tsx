import React, { useEffect, useState } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // 1. Wait a moment (1.5s) so the user sees the logo
    const openTimer = setTimeout(() => {
      setIsOpening(true);
    }, 2000); // Increased slightly to let text animation play

    // 2. Wait for animation to finish (2.5s duration)
    // Total time = 2.0s delay + 2.5s animation = 4.5s
    const completeTimer = setTimeout(() => {
      onComplete(); // Show app
      setShouldRender(false); // Unmount
    }, 4500); 

    return () => {
      clearTimeout(openTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!shouldRender) return null;

  const title = "Горизонт";

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      <style>{`
        /* TOP CURTAIN (Black Metallic) */
        .slide-top {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: linear-gradient(to bottom, #434343, #000000); /* Metallic Black Gradient */
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 20;
            transition: transform 2.5s cubic-bezier(0.77, 0, 0.175, 1);
            transform: translateY(0);
            will-change: transform;
            box-shadow: inset 0 -10px 20px rgba(0,0,0,0.5);
        }

        /* BOTTOM CURTAIN (White) */
        .slide-bottom {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 50%;
            background: #ffffff;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            z-index: 20;
            transition: transform 2.5s cubic-bezier(0.77, 0, 0.175, 1);
            transform: translateY(0);
            box-shadow: 0 -10px 50px rgba(0,0,0,0.2);
            will-change: transform;
        }

        /* OPENING STATE */
        .opening .slide-top {
            transform: translateY(-100%);
        }
        .opening .slide-bottom {
            transform: translateY(100%);
        }

        /* CONTENT */
        .slide-top .content-wrapper {
            padding-bottom: 40px;
            transition: opacity 1s ease-out;
        }
        
        .slide-bottom .content-wrapper {
            padding-top: 40px;
            text-align: center;
            transition: opacity 1s ease-out;
        }

        .opening .content-wrapper {
            opacity: 0.8;
        }

        /* Decorative Line */
        .slide-bottom::after {
            content: "";
            position: absolute;
            width: 60px;
            height: 6px;
            top: 0; 
            left: 50%;
            transform: translateX(-50%);
            background: #333; /* Darker accent to match top */
            z-index: 25;
        }

        /* WAVE ANIMATION */
        .wave-text {
            display: inline-block;
        }
        .wave-text span {
            display: inline-block;
            animation: wave 2s ease-in-out infinite;
        }

        @keyframes wave {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-20px);
            }
        }

        /* EARTH & SATELLITE ANIMATIONS */
        @keyframes orbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.4); }
            50% { box-shadow: 0 0 60px rgba(59, 130, 246, 0.8); }
        }
      `}</style>

      <div className={`w-full h-full ${isOpening ? 'opening' : ''}`}>
        
        {/* Top Half */}
        <div className="slide-top">
             <div className="content-wrapper transform transition-transform duration-[2000ms]">
                <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                    {/* The Earth Image */}
                    <img 
                        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80" 
                        alt="Connected Earth"
                        className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover z-10 relative"
                        style={{ animation: 'pulse-glow 3s infinite ease-in-out' }}
                    />
                    
                    {/* Inner Orbit Ring */}
                    <div className="absolute w-[110%] h-[110%] border border-blue-500/30 rounded-full animate-[orbit_10s_linear_infinite]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                    </div>

                    {/* Middle Orbit Ring (Reverse) */}
                    <div className="absolute w-[140%] h-[140%] border border-cyan-500/20 rounded-full animate-[orbit_15s_linear_infinite_reverse]">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4]"></div>
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4]"></div>
                    </div>

                    {/* Outer Web Lines (Decorative) */}
                    <div className="absolute w-[170%] h-[170%] border border-dashed border-purple-500/10 rounded-full animate-[orbit_30s_linear_infinite]"></div>
                </div>
             </div>
        </div>

        {/* Bottom Half */}
        <div className="slide-bottom">
            <div className="content-wrapper transform transition-transform duration-[2000ms]">
                <h3 className="text-4xl md:text-6xl font-bold text-slate-800 mb-2 md:mb-4 tracking-tight wave-text">
                    {title.split('').map((char, index) => (
                        <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                            {char}
                        </span>
                    ))}
                </h3>
                <p className="text-slate-500 text-lg md:text-xl font-medium tracking-wide">Первый маркетплейс Абхазии</p>
            </div>
        </div>

      </div>
    </div>
  );
};