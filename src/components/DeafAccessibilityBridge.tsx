import { useEffect, useRef } from 'react';
import { useDeafAccessibility } from '@/hooks/useDeafAccessibility';

/**
 * Watches Sonner toasts and triggers visual flash + haptic feedback
 * when deaf-accessibility prefs are enabled. No call-site changes needed.
 */
const DeafAccessibilityBridge = () => {
  const { visualAlerts, hapticFeedback } = useDeafAccessibility();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visualAlerts && !hapticFeedback) return;

    const trigger = () => {
      if (hapticFeedback && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(40);
      }
      if (visualAlerts) {
        const root = document.documentElement;
        root.classList.remove('visual-alert-flash');
        // Force reflow so re-adding the class restarts the animation
        void root.offsetWidth;
        root.classList.add('visual-alert-flash');
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => {
          root.classList.remove('visual-alert-flash');
        }, 700);
      }
    };

    const isToastNode = (node: Node): boolean => {
      if (!(node instanceof Element)) return false;
      if (node.hasAttribute('data-sonner-toast')) return true;
      if (node.getAttribute('data-sonner-toaster') !== null) {
        return node.childElementCount > 0;
      }
      return !!node.querySelector?.('[data-sonner-toast]');
    };

    const attach = (toaster: Element) => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length > 0) {
            trigger();
            break;
          }
        }
      });
      observer.observe(toaster, { childList: true, subtree: true });
      // Sonner may mount toaster already populated with the first toast
      if (toaster.childElementCount > 0) {
        trigger();
      }
      return observer;
    };

    let observer: MutationObserver | null = null;
    const existing = document.querySelector('[data-sonner-toaster]');
    if (existing) {
      observer = attach(existing);
    }

    // Sonner often mounts the toaster only when the first toast appears
    const bodyObserver = new MutationObserver((mutations) => {
      if (!observer) {
        const toaster = document.querySelector('[data-sonner-toaster]');
        if (toaster) {
          observer = attach(toaster);
        }
      }

      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (isToastNode(node)) {
            trigger();
            return;
          }
        }
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      bodyObserver.disconnect();
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      document.documentElement.classList.remove('visual-alert-flash');
    };
  }, [visualAlerts, hapticFeedback]);

  return null;
};

export default DeafAccessibilityBridge;
