import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const PREFER_CAPTIONS_KEY = 'prefer-captions';
const VISUAL_ALERTS_KEY = 'visual-alerts';
const HAPTIC_FEEDBACK_KEY = 'haptic-feedback';

const readBool = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(key) === 'true';
};

interface DeafAccessibilityContextValue {
  preferCaptions: boolean;
  visualAlerts: boolean;
  hapticFeedback: boolean;
  setPreferCaptions: (value: boolean) => void;
  setVisualAlerts: (value: boolean) => void;
  setHapticFeedback: (value: boolean) => void;
  togglePreferCaptions: () => void;
  toggleVisualAlerts: () => void;
  toggleHapticFeedback: () => void;
}

const DeafAccessibilityContext = createContext<DeafAccessibilityContextValue | null>(null);

export const DeafAccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [preferCaptions, setPreferCaptionsState] = useState(() => readBool(PREFER_CAPTIONS_KEY));
  const [visualAlerts, setVisualAlertsState] = useState(() => readBool(VISUAL_ALERTS_KEY));
  const [hapticFeedback, setHapticFeedbackState] = useState(() => readBool(HAPTIC_FEEDBACK_KEY));

  useEffect(() => {
    document.documentElement.classList.toggle('prefer-captions', preferCaptions);
    localStorage.setItem(PREFER_CAPTIONS_KEY, String(preferCaptions));
  }, [preferCaptions]);

  useEffect(() => {
    document.documentElement.classList.toggle('visual-alerts-on', visualAlerts);
    localStorage.setItem(VISUAL_ALERTS_KEY, String(visualAlerts));
  }, [visualAlerts]);

  useEffect(() => {
    localStorage.setItem(HAPTIC_FEEDBACK_KEY, String(hapticFeedback));
  }, [hapticFeedback]);

  const setPreferCaptions = useCallback((value: boolean) => {
    setPreferCaptionsState(value);
  }, []);

  const setVisualAlerts = useCallback((value: boolean) => {
    setVisualAlertsState(value);
  }, []);

  const setHapticFeedback = useCallback((value: boolean) => {
    setHapticFeedbackState(value);
  }, []);

  const togglePreferCaptions = useCallback(() => {
    setPreferCaptionsState((prev) => !prev);
  }, []);

  const toggleVisualAlerts = useCallback(() => {
    setVisualAlertsState((prev) => !prev);
  }, []);

  const toggleHapticFeedback = useCallback(() => {
    setHapticFeedbackState((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({
      preferCaptions,
      visualAlerts,
      hapticFeedback,
      setPreferCaptions,
      setVisualAlerts,
      setHapticFeedback,
      togglePreferCaptions,
      toggleVisualAlerts,
      toggleHapticFeedback,
    }),
    [
      preferCaptions,
      visualAlerts,
      hapticFeedback,
      setPreferCaptions,
      setVisualAlerts,
      setHapticFeedback,
      togglePreferCaptions,
      toggleVisualAlerts,
      toggleHapticFeedback,
    ],
  );

  return (
    <DeafAccessibilityContext.Provider value={value}>
      {children}
    </DeafAccessibilityContext.Provider>
  );
};

export const useDeafAccessibility = (): DeafAccessibilityContextValue => {
  const ctx = useContext(DeafAccessibilityContext);
  if (!ctx) {
    throw new Error('useDeafAccessibility must be used within DeafAccessibilityProvider');
  }
  return ctx;
};
