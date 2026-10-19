import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square, Play, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
}) => {
  const { t, language } = useLanguage();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState<boolean>(true);
  const [capturedTranscript, setCapturedTranscript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setHasSpeechSupport(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript.trim()) {
          setCapturedTranscript((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access was denied. Please allow microphone permission in your browser.');
        } else if (event.error === 'no-speech') {
          setStatusMessage('No speech detected. Please speak closer to the microphone.');
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
      setHasSpeechSupport(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort
        }
      }
    };
  }, [language]);

  // Start real audio recording & speech recognition
  const startRecording = async () => {
    setErrorMessage(null);
    setStatusMessage('Requesting microphone access...');
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Audio recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Real MediaRecorder for audio capture & playback
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;

      // Start SpeechRecognition if available
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // might already be started
        }
      }

      setIsRecording(true);
      setStatusMessage('Listening & recording audio... Speak clearly into your microphone.');
    } catch (err: any) {
      console.warn('Microphone permission or hardware error:', err);
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone permission was denied. Please enable microphone access to record voice grievances.');
      } else {
        setErrorMessage('Could not initialize microphone. Please check your audio input device.');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    setIsRecording(false);
    setStatusMessage('Audio recorded. Review or edit the transcribed text below.');
  };

  // Retry / Reset
  const handleReset = () => {
    stopRecording();
    setCapturedTranscript('');
    setAudioUrl(null);
    setStatusMessage('');
    setErrorMessage(null);
  };

  // Insert verified transcript into grievance form
  const handleInsertTranscript = () => {
    if (capturedTranscript.trim()) {
      onTranscript(capturedTranscript.trim());
      setStatusMessage('Voice transcription added to description.');
      setTimeout(() => {
        setStatusMessage('');
      }, 3000);
    }
  };

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      {/* Primary Voice Action Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-600 bg-teal-50 text-[#0E756E] font-bold hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-[#148F87]" />
            <span>Record Voice Grievance ({language === 'hi' ? 'हिन्दी' : 'English'})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-600 bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors animate-pulse cursor-pointer"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop Recording</span>
          </button>
        )}

        {isRecording && (
          <span className="flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Recording live audio...</span>
          </span>
        )}

        {audioUrl && !isRecording && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Re-record</span>
          </button>
        )}
      </div>

      {/* Honest Error Notification */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Status Notice */}
      {statusMessage && !errorMessage && (
        <div className="text-[11px] text-teal-800 bg-teal-50/80 px-2.5 py-1 rounded-md border border-teal-200 inline-block">
          {statusMessage}
        </div>
      )}

      {/* Playback & Editable Review Tray */}
      {(audioUrl || capturedTranscript) && !isRecording && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Voice Review & Transcription:</span>
            {!hasSpeechSupport && (
              <span className="text-amber-700 font-normal italic">
                (Speech-to-text engine not active in this browser; recorded audio preserved)
              </span>
            )}
          </div>

          {/* Actual Audio Playback */}
          {audioUrl && (
            <div className="flex items-center gap-2">
              <audio controls src={audioUrl} className="h-8 w-full max-w-sm rounded" />
            </div>
          )}

          {/* Editable Transcript Text Area */}
          <div>
            <textarea
              value={capturedTranscript}
              onChange={(e) => setCapturedTranscript(e.target.value)}
              placeholder="Captured spoken text will appear here. You can edit before applying..."
              rows={2}
              className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-[#148F87] focus:outline-hidden"
            />
          </div>

          {/* Action to insert into complaint */}
          {capturedTranscript.trim() && (
            <button
              type="button"
              onClick={handleInsertTranscript}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#148F87] hover:bg-[#0E756E] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Voice Text to Complaint Description</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
