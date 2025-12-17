import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Accessibility, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  X,
  Minus,
  Plus,
  Keyboard,
  Contrast
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useAccessibilityShortcuts } from '@/hooks/useAccessibilityShortcuts';
import { useHighContrast } from '@/hooks/useHighContrast';
import { toast } from 'sonner';

const AccessibilityToolbar = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    transcript,
    resetTranscript,
    speechRate,
    setSpeechRate,
    selectedVoice,
    availableVoices,
    setSelectedVoice,
  } = useAccessibility();

  const { isHighContrast, toggleHighContrast } = useHighContrast();

  // Enable keyboard shortcuts
  const { handleShowShortcuts } = useAccessibilityShortcuts({
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    resetTranscript,
  });

  const handleReadPage = () => {
    const mainContent = document.querySelector('main')?.textContent || 
                        document.querySelector('[role="main"]')?.textContent ||
                        document.body.textContent;
    
    if (mainContent) {
      speak(mainContent.slice(0, 5000)); // Limit to prevent too long speech
      toast.success(t('accessibility.readingPage'));
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        toast.success(t('accessibility.transcriptReady'));
      }
    } else {
      resetTranscript();
      startListening();
      toast.info(t('accessibility.listening'));
    }
  };

  const handleVoiceChange = (voiceName: string) => {
    const voice = availableVoices.find(v => v.name === voiceName);
    if (voice) {
      setSelectedVoice(voice);
    }
  };

  return (
    <>
      {/* Floating accessibility button - positioned top-left for easy access */}
      <motion.div
        className="fixed top-20 left-4 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
      >
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-primary shadow-lg hover:bg-primary/90"
              aria-label={t('accessibility.openToolbar')}
            >
              <Accessibility className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-96">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                {t('accessibility.title')}
              </SheetTitle>
              <SheetDescription>
                {t('accessibility.description')}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* High Contrast Mode */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  {t('accessibility.visualSettings')}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">
                      {t('accessibility.highContrast')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t('accessibility.highContrastDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={isHighContrast}
                    onCheckedChange={toggleHighContrast}
                    aria-label={t('accessibility.highContrast')}
                  />
                </div>
              </div>

              {/* Text-to-Speech Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('accessibility.textToSpeech')}
                </h3>
                
                <div className="flex gap-2">
                  <Button
                    onClick={isSpeaking ? stopSpeaking : handleReadPage}
                    variant={isSpeaking ? "destructive" : "default"}
                    className="flex-1"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="mr-2 h-4 w-4" />
                        {t('accessibility.stopReading')}
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        {t('accessibility.readPage')}
                      </>
                    )}
                  </Button>
                </div>

                {/* Speech Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('accessibility.speechRate')}
                    </span>
                    <span className="text-sm font-medium">{speechRate.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setSpeechRate(Math.max(0.5, speechRate - 0.1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[speechRate]}
                      onValueChange={([value]) => setSpeechRate(value)}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setSpeechRate(Math.min(2, speechRate + 0.1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      {t('accessibility.selectVoice')}
                    </label>
                    <Select
                      value={selectedVoice?.name}
                      onValueChange={handleVoiceChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('accessibility.chooseVoice')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Speech-to-Text Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('accessibility.speechToText')}
                </h3>
                
                <Button
                  onClick={handleToggleListening}
                  variant={isListening ? "destructive" : "secondary"}
                  className="w-full"
                >
                  {isListening ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      {t('accessibility.stopListening')}
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      {t('accessibility.startListening')}
                    </>
                  )}
                </Button>

                {/* Listening indicator */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-1"
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-2 w-2 rounded-full bg-primary"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {t('accessibility.listeningNow')}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Transcript */}
                {transcript && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t('accessibility.transcript')}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetTranscript}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                      {transcript}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(transcript);
                        toast.success(t('accessibility.copiedToClipboard'));
                      }}
                      className="w-full"
                    >
                      {t('accessibility.copyTranscript')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Keyboard Shortcuts Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  {t('accessibility.keyboardShortcuts')}
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Alt + R</span>
                    <span>{t('accessibility.readPageShortcut')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alt + V</span>
                    <span>{t('accessibility.voiceInputShortcut')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alt + S</span>
                    <span>{t('accessibility.stopAllShortcut')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Alt + H</span>
                    <span>{t('accessibility.showShortcutsShortcut')}</span>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>
    </>
  );
};

export default AccessibilityToolbar;
