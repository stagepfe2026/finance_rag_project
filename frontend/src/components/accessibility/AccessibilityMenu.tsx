import { Contrast, Eye, PersonStanding, Volume2, ZoomIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type AccessibilityMenuProps = {
  highContrastClassName: string;
  highContrastStorageKey: string;
  isDarkMode?: boolean;
};

const ZOOM_LEVELS = [1, 1.1, 1.25] as const;

function getReadableElementText(element: HTMLElement) {
  const labelledBy = element.getAttribute("aria-labelledby");
  const labelledByText = labelledBy
    ?.split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent?.trim())
    .filter(Boolean)
    .join(" ");

  const readableText =
    element.getAttribute("aria-label") ||
    labelledByText ||
    element.getAttribute("placeholder") ||
    element.textContent ||
    "";
  const normalizedText = readableText.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return "";
  }

  if (element instanceof HTMLButtonElement) {
    return `${normalizedText}, bouton`;
  }

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return `${normalizedText}, champ de saisie`;
  }

  if (element instanceof HTMLSelectElement) {
    return `${normalizedText}, liste de selection`;
  }

  return normalizedText;
}

export default function AccessibilityMenu({
  highContrastClassName,
  highContrastStorageKey,
  isDarkMode = false,
}: AccessibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const zoomStorageKey = `${highContrastStorageKey}-zoom`;
  const eyeComfortStorageKey = `${highContrastStorageKey}-eye-comfort`;
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(highContrastStorageKey) === "true";
  });
  const [zoomLevelIndex, setZoomLevelIndex] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const storedZoom = Number(window.localStorage.getItem(zoomStorageKey));
    const storedIndex = ZOOM_LEVELS.findIndex((level) => level === storedZoom);
    return storedIndex >= 0 ? storedIndex : 0;
  });
  const [isEyeComfortEnabled, setIsEyeComfortEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(eyeComfortStorageKey) === "true";
  });
  const voiceDisableAnnouncementRef = useRef(false);
  const zoomLevel = ZOOM_LEVELS[zoomLevelIndex];

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = "fr";
    document.body.classList.toggle(highContrastClassName, isHighContrast);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(highContrastStorageKey, String(isHighContrast));
    }

    return () => {
      document.body.classList.remove(highContrastClassName);
    };
  }, [highContrastClassName, highContrastStorageKey, isHighContrast]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.style.setProperty("zoom", String(zoomLevel));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(zoomStorageKey, String(zoomLevel));
    }

    return () => {
      document.body.style.removeProperty("zoom");
    };
  }, [zoomLevel, zoomStorageKey]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("accessibility-eye-comfort", isEyeComfortEnabled);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(eyeComfortStorageKey, String(isEyeComfortEnabled));
    }

    return () => {
      document.body.classList.remove("accessibility-eye-comfort");
    };
  }, [eyeComfortStorageKey, isEyeComfortEnabled]);

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  function handleToggleVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsVoiceHelpOpen(true);
      return;
    }

    setIsVoiceEnabled((current) => {
      const nextValue = !current;
      if (!nextValue) {
        voiceDisableAnnouncementRef.current = true;
      }
      speak(nextValue ? "Mode voix active." : "Mode voix desactive.");
      return nextValue;
    });
    setIsVoiceHelpOpen(true);
  }

  function handleCycleZoom() {
    setZoomLevelIndex((current) => (current + 1) % ZOOM_LEVELS.length);
  }

  useEffect(() => {
    if (!isVoiceEnabled) {
      if (voiceDisableAnnouncementRef.current) {
        voiceDisableAnnouncementRef.current = false;
        return;
      }

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    function handleFocus(event: FocusEvent) {
      const element = event.target;
      if (!(element instanceof HTMLElement)) {
        return;
      }

      const text = getReadableElementText(element);
      if (text) {
        speak(text);
      }
    }

    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      window.speechSynthesis.cancel();
    };
  }, [isVoiceEnabled]);

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <div
        className={[
          "absolute bottom-0 left-0 transition duration-200 ease-out",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        >
        {[
          {
            label: "Zoom",
            ariaLabel: `Changer le zoom, niveau actuel ${Math.round(zoomLevel * 100)} pour cent`,
            icon: ZoomIn,
            openPosition: "-translate-y-[150px]",
            delay: 0,
            active: zoomLevel > 1,
            onClick: handleCycleZoom,
          },
          {
            label: "Contraste",
            ariaLabel: isHighContrast ? "Desactiver le contraste eleve" : "Activer le contraste eleve",
            icon: Contrast,
            openPosition: "-translate-y-[104px]",
            delay: 80,
            active: isHighContrast,
            onClick: () => setIsHighContrast((current) => !current),
          },
          {
            label: "Confort",
            ariaLabel: isEyeComfortEnabled ? "Desactiver le confort des yeux" : "Activer le confort des yeux",
            icon: Eye,
            openPosition: "translate-x-[54px] -translate-y-[58px]",
            delay: 120,
            active: isEyeComfortEnabled,
            onClick: () => setIsEyeComfortEnabled((current) => !current),
          },
          {
            label: "Voix",
            ariaLabel: isVoiceEnabled ? "Desactiver la lecture vocale locale" : "Activer la lecture vocale locale",
            icon: Volume2,
            openPosition: "-translate-y-[58px]",
            delay: 160,
            active: isVoiceEnabled,
            onClick: handleToggleVoice,
          },
        ].map(({ label, ariaLabel, icon: Icon, openPosition, delay, active, onClick }) => (
          <button
            key={label}
            type="button"
            aria-label={ariaLabel}
            aria-pressed={active}
            onClick={onClick}
            style={{ transitionDelay: isOpen ? `${delay}ms` : "0ms" }}
            className={[
              "group absolute bottom-0 left-0 inline-flex h-10 w-10 origin-center items-center justify-center overflow-hidden rounded-full border text-xs font-semibold shadow-md transition-[width,transform,opacity,background-color,border-color,color] ease-out hover:z-10 hover:w-[108px] focus-visible:z-10 focus-visible:w-[108px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
              isOpen ? "duration-500" : "duration-0",
              isOpen ? `${openPosition} scale-100 opacity-100` : "translate-x-1 translate-y-[-2px] scale-75 opacity-0",
              isDarkMode
                ? "border-[#334155] bg-[#1e293b] text-[#f8fafc] shadow-black/20 hover:bg-[#263449] focus-visible:outline-[#f8fafc]"
                : "border-slate-200 bg-red-50 text-[#273043] shadow-slate-900/10 hover:border-[#9d0208]/30 hover:text-[#9d0208] focus-visible:outline-[#9d0208]",
              active ? "!border-[#9d0208] !bg-[#9d0208] !text-white" : "",
            ].join(" ")}
          >
            <Icon size={16} className="shrink-0" aria-hidden="true" />
            <span className="ml-0 max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-20 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-20 group-focus-visible:opacity-100">
              {label === "Zoom" ? `${label} ${Math.round(zoomLevel * 100)}%` : label}
            </span>
          </button>
        ))}
      </div>

      {isVoiceHelpOpen ? (
        <div
          role="note"
          className={[
            "absolute bottom-14 left-[112px] w-64 rounded-lg border p-3 text-xs leading-5 shadow-xl",
            isDarkMode
              ? "border-[#334155] bg-[#111827] text-[#f8fafc] shadow-black/25"
              : "border-slate-200 bg-white text-[#273043] shadow-slate-900/10",
          ].join(" ")}
        >
          <p className="font-semibold">Lecture vocale locale</p>
          <p className="mt-1 text-inherit">
            Ce mode lit les boutons, champs et elements selectionnes avec la voix du navigateur.
          </p>
          <p className="mt-1 text-inherit">Aucune connexion externe n'est utilisee.</p>
          <p className="mt-1 font-semibold text-inherit">
            Etat: {isVoiceEnabled ? "voix locale activee" : "voix locale desactivee"}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        aria-label={isOpen ? "Fermer les options d'accessibilite" : "Ouvrir les options d'accessibilite"}
        aria-expanded={isOpen}
        title="Accessibilite"
        onClick={() => {
          setIsOpen((current) => !current);
          if (isOpen) {
            setIsVoiceHelpOpen(false);
            setIsVoiceEnabled(false);
          }
        }}
        className={[
          "inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-lg transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          isDarkMode
            ? "border-[#334155] bg-[#1e293b] text-[#f8fafc] shadow-black/20 hover:bg-[#263449] focus-visible:outline-[#f8fafc]"
            : "border-slate-200 bg-white text-[#273043] shadow-slate-900/10 hover:border-[#9d0208]/30 hover:text-[#9d0208] focus-visible:outline-[#9d0208]",
        ].join(" ")}
      >
        <PersonStanding size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
