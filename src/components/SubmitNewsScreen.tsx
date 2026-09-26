import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Video,
  Mic,
  MapPin,
  ChevronDown,
  CheckCircle2,
  Square,
  Sparkles,
  Loader2,
  AlertCircle,
  LogIn,
  Trash2,
  Play,
  Pause,
  Upload,
} from 'lucide-react';
import { NewsSubmission, CategoryInfo } from '../types';
import { DISTRICTS as FALLBACK_DISTRICTS, CATEGORIES as FALLBACK_CATEGORIES } from '../data/mockNews';
import { LocationInfo } from '../services/newsService';
import { createSubmission } from '../services/submissionService';
import {
  uploadSubmissionMedia,
  validateMediaFile,
  cleanupSubmissionMedia,
} from '../services/storageService';
import { useAuth } from '../hooks/useAuth';

interface SubmitNewsScreenProps {
  onBack?: () => void;
  onSubmitSuccess?: (newSubmission: NewsSubmission) => void;
  districts?: string[];
  categories?: CategoryInfo[];
  locations?: LocationInfo[];
  resubmitFrom?: NewsSubmission | null;
}

export const SubmitNewsScreen: React.FC<SubmitNewsScreenProps> = ({
  onBack,
  onSubmitSuccess,
  districts = FALLBACK_DISTRICTS,
  categories = FALLBACK_CATEGORIES,
  locations = [],
  resubmitFrom,
}) => {
  const navigate = useNavigate();
  const locationObj = useLocation();
  const locationState = locationObj.state as { resubmitFrom?: NewsSubmission } | undefined;
  const effectiveResubmit = resubmitFrom || locationState?.resubmitFrom || null;

  const { user, profile, openAuthModal } = useAuth();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  const [headline, setHeadline] = useState(effectiveResubmit?.title || '');
  const [details, setDetails] = useState(effectiveResubmit?.details || '');
  const [location, setLocation] = useState(
    effectiveResubmit?.locationText || effectiveResubmit?.location || 'ఖమ్మం'
  );
  const [category, setCategory] = useState(
    effectiveResubmit?.categoryText || effectiveResubmit?.category || 'స్థానిక'
  );
  const [reporterName, setReporterName] = useState(
    profile?.full_name || (user?.email ? user.email.split('@')[0] : 'పౌర రిపోర్టర్')
  );
  const [reporterPhone, setReporterPhone] = useState(profile?.phone || '');

  // Synchronize prefill state if resubmitFrom prop or route state updates
  useEffect(() => {
    if (effectiveResubmit) {
      setHeadline(effectiveResubmit.title || '');
      setDetails(effectiveResubmit.details || '');
      if (effectiveResubmit.locationText || effectiveResubmit.location) {
        setLocation(effectiveResubmit.locationText || effectiveResubmit.location);
      }
      if (effectiveResubmit.categoryText || effectiveResubmit.category) {
        setCategory(effectiveResubmit.categoryText || effectiveResubmit.category);
      }
    }
  }, [effectiveResubmit]);

  // Real Media File States
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  // Live voice recording state (MediaRecorder)
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdSubmission, setCreatedSubmission] = useState<NewsSubmission | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [photoPreview, audioPreviewUrl]);

  // Photo Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file, 'image');
    if (!validation.valid) {
      setSubmitError(validation.error || 'సరైన చిత్రం ఎంచుకోండి.');
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  // Video Selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file, 'video');
    if (!validation.valid) {
      setSubmitError(validation.error || 'సరైన వీడియో ఎంచుకోండి.');
      return;
    }

    setVideoFile(file);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  // Voice Recording with MediaRecorder
  const startVoiceRecording = async () => {
    setSubmitError(null);
    audioChunksRef.current = [];
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setAudioBlob(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback: trigger file input if getUserMedia not supported
        audioInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(100);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access unavailable or denied:', err);
      // Provide polite fallback to audio file picker
      setSubmitError('మైక్రోఫోన్ అనుమతి లభించలేదు. దయచేసి ఆడియో ఫైల్‌ను నేరుగా జతచేయండి.');
      audioInputRef.current?.click();
    }
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateMediaFile(file, 'audio');
    if (!validation.valid) {
      setSubmitError(validation.error || 'సరైన ఆడియో ఎంచుకోండి.');
      return;
    }

    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveAudio = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioBlob(null);
    setAudioPreviewUrl(null);
    setIsPlayingAudioPreview(false);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const togglePlayAudioPreview = () => {
    if (!audioPlayerRef.current || !audioPreviewUrl) return;
    if (isPlayingAudioPreview) {
      audioPlayerRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudioPreview(true);
    }
  };

  // Submit News Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!headline.trim() || !details.trim()) {
      setSubmitError('దయచేసి శీర్షిక మరియు వార్త వివరాలను నమోదు చేయండి.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatusText('వార్త సిద్ధం చేస్తోంది...');

    // Resolve Supabase UUIDs
    const matchedCategory = categories.find((c) => c.name === category || c.id === category);
    const categoryId = matchedCategory?.uuid || null;

    const matchedLocation = locations.find((l) => l.name === location || l.slug === location);
    const locationId = matchedLocation?.id || null;

    let uploadedImageUrl: string | null = null;
    let uploadedAudioUrl: string | null = null;
    let uploadedVideoUrl: string | null = null;

    try {

      // 1. Upload Photo to Supabase Storage if selected
      if (photoFile) {
        console.log('[SubmitNewsScreen] photoFile detected, starting upload:', {
          name: photoFile.name,
          size: photoFile.size,
          type: photoFile.type,
        });
        setSubmitStatusText('ఫోటోను అప్‌లోడ్ చేస్తోంది... / Uploading photo...');
        const { url: imgUrl, error: imgErr } = await uploadSubmissionMedia(photoFile, 'image');
        console.log('[SubmitNewsScreen] uploadSubmissionMedia returned:', { imgUrl, imgErr });
        if (imgErr) {
          throw new Error(`ఫోటో అప్‌లోడ్ విఫలమైంది: ${imgErr.message}`);
        }
        uploadedImageUrl = imgUrl;
      }

      // 2. Upload Voice / Audio to Supabase Storage if recorded or selected
      if (audioBlob) {
        setSubmitStatusText('వాయిస్ రికార్డింగ్‌ను అప్‌లోడ్ చేస్తోంది... / Uploading audio...');
        const { url: audUrl, error: audErr } = await uploadSubmissionMedia(
          audioBlob,
          'audio',
          audioBlob instanceof File ? audioBlob.name : 'voice-note.webm'
        );
        if (audErr) {
          throw new Error(`ఆడియో అప్‌లోడ్ విఫలమైంది: ${audErr.message}`);
        }
        uploadedAudioUrl = audUrl;
      }

      // 3. Upload Video to Supabase Storage if selected
      if (videoFile) {
        setSubmitStatusText('వీడియోను అప్‌లోడ్ చేస్తోంది... / Uploading video...');
        const { url: vidUrl, error: vidErr } = await uploadSubmissionMedia(videoFile, 'video');
        if (vidErr) {
          throw new Error(`వీడియో అప్‌లోడ్ విఫలమైంది: ${vidErr.message}`);
        }
        uploadedVideoUrl = vidUrl;
      }

      setSubmitStatusText('వార్తను సమర్పిస్తోంది... / Submitting news...');

      // 4. Create database submission in public.submissions
      const { data, error } = await createSubmission(
        {
          title: headline.trim(),
          details: details.trim(),
          locationId,
          locationText: location || 'తెలంగాణ',
          categoryId,
          categoryText: category || 'స్థానిక',
          reporterName: reporterName.trim() || 'పౌర రిపోర్టర్',
          reporterPhone: reporterPhone.trim() || null,
          imageUrl: uploadedImageUrl,
          audioUrl: uploadedAudioUrl,
          videoUrl: uploadedVideoUrl,
        },
        user?.id || null
      );

      if (error || !data) {
        throw new Error(error?.message || 'వార్తను సమర్పించడంలో లోపం ఏర్పడింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
      }

      setCreatedSubmission(data);
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
      setIsSubmitted(true);
    } catch (err: any) {
      // Failed media upload cleanup:
      // If one or more uploads succeeded but database submission failed,
      // clean only the files uploaded during this attempted submission.
      const hasUploadedMedia = uploadedImageUrl || uploadedAudioUrl || uploadedVideoUrl;
      if (hasUploadedMedia) {
        try {
          await cleanupSubmissionMedia({
            imageUrl: uploadedImageUrl,
            audioUrl: uploadedAudioUrl,
            videoUrl: uploadedVideoUrl,
          });
        } catch (cleanupErr) {
          // Cleanup error must never hide the original submission error
          console.warn('[SubmitNewsScreen] Non-fatal cleanup warning for failed submission media:', cleanupErr);
        }
      }

      setSubmitError(err.message || 'ఊహించని లోపం జరిగింది. దయచేసి నెట్‌వర్క్ కనెక్షన్ తనిఖీ చేయండి.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatusText('');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-neutral-900 telugu-heading">
          మీ వార్త విజయవంతంగా అందింది!
        </h2>
        <p className="text-sm text-neutral-600 mt-2 max-w-sm leading-relaxed">
          రచ్చ బండ న్యూస్ డెస్క్ మీ వార్తను పరిశీలించి త్వరలోనే ఆమోదిస్తుంది. మీరు ప్రజల సమస్యను వెలుగులోకి తెచ్చినందుకు ధన్యవాదాలు.
        </p>

        {createdSubmission && (
          <div className="bg-neutral-50 rounded-xl p-3 my-4 border border-neutral-200 text-left w-full max-w-xs text-xs space-y-1">
            <div className="text-neutral-500 font-medium">వార్త ID: <span className="font-mono text-neutral-800 text-[10px]">{createdSubmission.id.slice(0, 13)}...</span></div>
            <div className="text-neutral-500 font-medium">స్థితి: <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">పరిశీలనలో ఉంది (Pending)</span></div>
          </div>
        )}

        {!user && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 my-2 text-xs text-amber-900 text-left max-w-xs">
            <p className="font-bold flex items-center gap-1 mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>గమనిక (Note):</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              మీరు అతిథిగా వార్తను పంపారు. మీరు పంపిన వార్తల స్థితిని నేరుగా ట్రాక్ చేయడానికి లాగిన్ అవ్వండి.
            </p>
            <button
              onClick={openAuthModal}
              aria-label="లాగిన్ అవ్వండి (Login to track submissions)"
              className="mt-2 text-xs font-bold text-[#E41E26] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <LogIn className="w-3 h-3" />
              <span>లాగిన్ అవ్వండి (Login)</span>
            </button>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setHeadline('');
              setDetails('');
              handleRemovePhoto();
              handleRemoveVideo();
              handleRemoveAudio();
              setSubmitError(null);
            }}
            aria-label="మరో వార్త పంపండి (Submit another news story)"
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-sm transition-colors focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            మరో వార్త పంపండి
          </button>
          <button
            onClick={handleBack}
            aria-label="హోమ్‌కి వెళ్లండి (Go to Home)"
            className="w-full py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl font-bold text-sm shadow-md transition-all focus-visible:ring-2 focus-visible:ring-red-400"
          >
            హోమ్‌కి వెళ్లండి
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-12">
      {/* Red Header matching Screen 4 */}
      <div className="sticky top-0 z-30 bg-[#E41E26] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center gap-3">
          <button
            id="submit-back-btn"
            onClick={handleBack}
            aria-label="వెనుకకు వెళ్లండి (Go back)"
            className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black tracking-wide telugu-heading flex-1 text-center pr-5">
            మీ వార్త పంపండి
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {submitError && (
          <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{submitError}</span>
          </div>
        )}

        {effectiveResubmit && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>మళ్లీ సమర్పణ (Resubmission)</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              తిరస్కరించబడిన వార్త వివరాలు ముందుగా నింపబడ్డాయి. అవసరమైన మార్పులు చేసి, తాజా ఫోటో/ఆడియో/వీడియోను జతచేసి కొత్తగా సమర్పించండి.
            </p>
            {effectiveResubmit.rejectionReason && (
              <div className="mt-1 pt-1.5 border-t border-amber-200/80 text-[11px]">
                <span className="font-bold text-red-700">మునుపటి తిరస్కరణ కారణం:</span>{' '}
                <span className="text-neutral-700">{effectiveResubmit.rejectionReason}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* శీర్షిక (Headline) */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label htmlFor="input-headline" className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              శీర్షిక (Headline) *
            </label>
            <input
              type="text"
              id="input-headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="శీర్షిక రాయండి..."
              required
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium transition-all"
            />
          </div>

          {/* వార్త వివరాలు (Description) */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label htmlFor="input-details" className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              వార్త వివరాలు *
            </label>
            <textarea
              id="input-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="వివరాలు రాయండి..."
              rows={4}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium transition-all resize-none"
            />
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            aria-label="ఫోటో ఫైల్ అప్‌లోడ్ (Photo file upload)"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            aria-label="వీడియో ఫైల్ అప్‌లోడ్ (Video file upload)"
            className="hidden"
            onChange={handleVideoSelect}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            aria-label="ఆడియో ఫైల్ అప్‌లోడ్ (Audio file upload)"
            className="hidden"
            onChange={handleAudioFileSelect}
          />

          {/* Media Attachments matching Screen 4 (ఫోటో, వీడియో, Voice) */}
          <div role="group" aria-labelledby="media-attachments-label" className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <span id="media-attachments-label" className="block text-xs font-bold text-neutral-800 mb-3 telugu-heading">
              మీడియా జతచేయండి (Media Attachments)
            </span>

            <div className="grid grid-cols-3 gap-3">
              {/* Photo Box */}
              <button
                type="button"
                id="attach-photo-btn"
                aria-label="ఫోటో జతచేయండి (Attach photo)"
                onClick={() => photoInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  photoFile
                    ? 'border-[#1565C0] bg-blue-50 ring-2 ring-blue-400'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center mb-1 shadow-2xs">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 telugu-heading">
                  ఫోటో
                </span>
                <span className="text-[10px] text-neutral-600 font-medium">
                  {photoFile ? '✓ ఎంపికైంది' : 'ఫోటో ఎంచుకోండి'}
                </span>
              </button>

              {/* Video Box */}
              <button
                type="button"
                id="attach-video-btn"
                aria-label="వీడియో జతచేయండి (Attach video)"
                onClick={() => videoInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  videoFile
                    ? 'border-[#8E24AA] bg-purple-50 ring-2 ring-purple-400'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-purple-100 text-[#8E24AA] flex items-center justify-center mb-1 shadow-2xs">
                  <Video className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-neutral-800 telugu-heading">
                  వీడియో
                </span>
                <span className="text-[10px] text-neutral-600 font-medium">
                  {videoFile ? '✓ ఎంపికైంది' : 'వీడియో తీయండి'}
                </span>
              </button>

              {/* Voice Record Box matching Screen 4 */}
              <button
                type="button"
                id="attach-voice-btn"
                aria-label={isRecordingVoice ? 'వాయిస్ రికార్డింగ్ ఆపండి (Stop Voice Recording)' : 'వాయిస్ రికార్డ్ చేయండి (Record Voice)'}
                onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isRecordingVoice
                    ? 'border-[#E41E26] bg-red-100 ring-2 ring-red-400 animate-pulse'
                    : audioBlob
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-1 shadow-2xs ${
                    isRecordingVoice
                      ? 'bg-[#E41E26] text-white'
                      : audioBlob
                      ? 'bg-emerald-600 text-white'
                      : 'bg-red-50 text-[#E41E26]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <Square className="w-4 h-4 fill-white" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-bold text-neutral-800 telugu-heading">
                  Voice
                </span>
                <span className="text-[10px] text-neutral-600 font-medium">
                  {isRecordingVoice
                    ? `${recordingSeconds}s రికార్డింగ్...`
                    : audioBlob
                    ? '✓ వాయిస్ సిద్ధం'
                    : 'వాయిస్ రికార్డ్'}
                </span>
              </button>
            </div>

            {/* Media Previews Container */}
            {(photoPreview || videoFile || audioPreviewUrl) && (
              <div className="mt-4 pt-3 border-t border-neutral-100 space-y-3">
                {/* Photo Preview Card */}
                {photoPreview && (
                  <div className="flex items-center justify-between p-2.5 bg-blue-50/60 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={photoPreview}
                        alt="ఎంపికైన చిత్ర ప్రివ్యూ (Selected photo preview)"
                        className="w-14 h-12 rounded-lg object-cover border border-blue-200 shadow-2xs flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-neutral-900 block truncate">
                          {photoFile?.name || 'చిత్రం జతచేయబడింది'}
                        </span>
                        <span className="text-[10px] text-blue-700 block">
                          {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB • ఫోటో` : 'ఫోటో సిద్ధం'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        aria-label="ఫోటో మార్చండి (Change photo)"
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2 py-1 rounded-md border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        మార్చండి
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        aria-label="ఫోటో తొలగించండి (Remove photo)"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="ఫోటో తొలగించండి"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Video Preview Card */}
                {videoFile && (
                  <div className="flex items-center justify-between p-2.5 bg-purple-50/60 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-10 rounded-lg bg-purple-100 text-[#8E24AA] flex items-center justify-center flex-shrink-0 shadow-2xs font-bold text-xs">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-neutral-900 block truncate">
                          {videoFile.name}
                        </span>
                        <span className="text-[10px] text-purple-700 block">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB • వీడియో
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      aria-label="వీడియో తొలగించండి (Remove video)"
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                      title="వీడియో తొలగించండి"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Audio Preview & Test Player */}
                {audioPreviewUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={togglePlayAudioPreview}
                        aria-label={isPlayingAudioPreview ? 'పాజ్ చేయండి (Pause audio preview)' : 'వినండి (Play audio preview)'}
                        className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs flex-shrink-0 active:scale-95 transition-transform"
                        title={isPlayingAudioPreview ? 'పాజ్ చేయండి' : 'వినండి'}
                      >
                        {isPlayingAudioPreview ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-950 block">
                          వాయిస్ రికార్డింగ్ (Voice Note)
                        </span>
                        <span className="text-[10px] text-emerald-700 block font-mono">
                          {audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : ''} • ప్లే చేసి వినండి
                        </span>
                        <audio
                          ref={audioPlayerRef}
                          src={audioPreviewUrl}
                          onEnded={() => setIsPlayingAudioPreview(false)}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        aria-label="వాయిస్ మళ్ళీ రికార్డ్ చేయండి (Re-record voice note)"
                        className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 bg-white px-2 py-1 rounded-md border border-emerald-200 hover:bg-emerald-50 transition-colors"
                      >
                        మళ్ళీ రికార్డ్
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAudio}
                        aria-label="వాయిస్ తొలగించండి (Remove voice note)"
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="వాయిస్ తొలగించండి"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ప్రాంతం (Location) Dropdown matching Screen 4 */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label htmlFor="select-location" className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              ప్రాంతం (Location) *
            </label>
            <div className="relative">
              <select
                id="select-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 pl-9 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
              >
                {districts.filter((d) => d !== 'అన్ని ప్రాంతాలు').map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
              <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* వర్గం (Category) Dropdown matching Screen 4 */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label htmlFor="select-category" className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              వర్గం (Category) *
            </label>
            <div className="relative">
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.englishName})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Red Submit Button matching Screen 4 'వార్తను పంపండి' */}
          <button
            type="submit"
            id="submit-news-btn"
            aria-label="వార్తను సమర్పించండి (Submit news)"
            disabled={isSubmitting}
            className={`w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-base font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all telugu-heading flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{submitStatusText || 'వార్త పంపుతోంది...'}</span>
              </>
            ) : (
              <>
                <span>వార్తను పంపండి</span>
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
