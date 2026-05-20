export default function GuideAnimations() {
  return (
    <style>
      {`
        @keyframes guideSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes guideStepProgress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @keyframes guideGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(157, 2, 8, 0.18); }
          50% { box-shadow: 0 0 0 8px rgba(157, 2, 8, 0.04); }
        }

        .guide-slide {
          animation: guideSlideIn 420ms ease-out both;
        }

        .guide-glow {
          animation: guideGlow 1800ms ease-in-out infinite;
        }
      `}
    </style>
  );
}
