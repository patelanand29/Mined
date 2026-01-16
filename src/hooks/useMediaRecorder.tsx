import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseMediaRecorderOptions {
  type: 'audio' | 'video';
  maxDurationSeconds?: number;
}

interface UseMediaRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaUrl: string | null;
  mediaBlob: Blob | null;
  stream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  uploadMedia: (userId: string, capsuleId: string) => Promise<string | null>;
}

export function useMediaRecorder({
  type,
  maxDurationSeconds = type === 'audio' ? 300 : 120, // 5 min for audio, 2 min for video
}: UseMediaRecorderOptions): UseMediaRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const constraints = type === 'audio' 
        ? { audio: true }
        : { video: true, audio: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = type === 'audio' 
        ? 'audio/webm;codecs=opus'
        : 'video/webm;codecs=vp8,opus';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setMediaBlob(blob);
        setMediaUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDurationSeconds) {
            stopRecording();
            toast.info(`Recording limit of ${maxDurationSeconds / 60} minutes reached`);
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error(`Failed to access ${type === 'audio' ? 'microphone' : 'camera'}`);
    }
  }, [type, maxDurationSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
    setMediaBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
  }, [mediaUrl]);

  const uploadMedia = useCallback(async (userId: string, capsuleId: string): Promise<string | null> => {
    if (!mediaBlob) {
      console.error('No media to upload');
      return null;
    }

    try {
      const fileExt = type === 'audio' ? 'webm' : 'webm';
      const fileName = `${userId}/${capsuleId}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('capsule-media')
        .upload(fileName, mediaBlob, {
          contentType: type === 'audio' ? 'audio/webm' : 'video/webm',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get signed URL for playback (valid for 1 year)
      const { data: signedUrlData } = await supabase.storage
        .from('capsule-media')
        .createSignedUrl(fileName, 31536000); // 1 year

      return signedUrlData?.signedUrl || null;
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload recording');
      return null;
    }
  }, [mediaBlob, type]);

  return {
    isRecording,
    isPaused,
    recordingTime,
    mediaUrl,
    mediaBlob,
    stream: streamRef.current,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    uploadMedia,
  };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
