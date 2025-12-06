import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseAccessibilityShortcutsProps {
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  isListening: boolean;
  resetTranscript: () => void;
}

export const useAccessibilityShortcuts = ({
  speak,
  stopSpeaking,
  isSpeaking,
  startListening,
  stopListening,
  isListening,
  resetTranscript,
}: UseAccessibilityShortcutsProps) => {
  const { t } = useTranslation();

  const handleReadPage = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
      toast.info(t('accessibility.stoppedReading'));
    } else {
      const mainContent = document.querySelector('main')?.textContent || 
                          document.querySelector('[role="main"]')?.textContent ||
                          document.body.textContent;
      
      if (mainContent) {
        speak(mainContent.slice(0, 5000));
        toast.success(t('accessibility.readingPage'));
      }
    }
  }, [isSpeaking, speak, stopSpeaking, t]);

  const handleToggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
      toast.info(t('accessibility.stoppedListening'));
    } else {
      resetTranscript();
      startListening();
      toast.info(t('accessibility.listening'));
    }
  }, [isListening, startListening, stopListening, resetTranscript, t]);

  const handleShowShortcuts = useCallback(() => {
    toast.info(
      <div className="space-y-1 text-sm">
        <p className="font-semibold">{t('accessibility.keyboardShortcuts')}</p>
        <p>Alt + R: {t('accessibility.readPageShortcut')}</p>
        <p>Alt + V: {t('accessibility.voiceInputShortcut')}</p>
        <p>Alt + S: {t('accessibility.stopAllShortcut')}</p>
        <p>Alt + H: {t('accessibility.showShortcutsShortcut')}</p>
      </div>,
      { duration: 5000 }
    );
  }, [t]);

  const handleStopAll = useCallback(() => {
    stopSpeaking();
    stopListening();
    toast.info(t('accessibility.stoppedAll'));
  }, [stopSpeaking, stopListening, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Alt key is pressed
      if (!e.altKey) return;
      
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault();
          handleReadPage();
          break;
        case 'v':
          e.preventDefault();
          handleToggleVoice();
          break;
        case 's':
          e.preventDefault();
          handleStopAll();
          break;
        case 'h':
          e.preventDefault();
          handleShowShortcuts();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReadPage, handleToggleVoice, handleStopAll, handleShowShortcuts]);

  return {
    handleReadPage,
    handleToggleVoice,
    handleStopAll,
    handleShowShortcuts,
  };
};
