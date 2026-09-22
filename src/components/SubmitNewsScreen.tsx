import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { NewsSubmission } from '../types';
import { DISTRICTS, CATEGORIES } from '../data/mockNews';

interface SubmitNewsScreenProps {
  onBack?: () => void;
  onSubmitSuccess: (newSubmission: NewsSubmission) => void;
}

export const SubmitNewsScreen: React.FC<SubmitNewsScreenProps> = ({
  onBack,
  onSubmitSuccess,
}) => {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  const [headline, setHeadline] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('ఖమ్మం');
  const [category, setCategory] = useState('స్థానిక');
  const [reporterName, setReporterName] = useState('రవి కుమార్ (సిటిజెన్ రిపోర్టర్)');
  const [reporterPhone, setReporterPhone] = useState('9848011223');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  // Live voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecorded, setVoiceRecorded] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const startVoiceRecording = () => {
    setIsRecordingVoice(true);
    setVoiceRecorded(false);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecordingVoice(false);
    setVoiceRecorded(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !details.trim()) {
      alert('దయచేసి శీర్షిక మరియు వార్త వివరాలను నమోదు చేయండి.');
      return;
    }

    const newSub: NewsSubmission = {
      id: `sub-${Date.now()}`,
      title: headline.trim(),
      details: details.trim(),
      location: location || 'ఖమ్మం',
      category: category || 'స్థానిక',
      reporterName: reporterName || 'పౌర రిపోర్టర్',
      reporterPhone: reporterPhone,
      timeAgo: 'ఇప్పుడే (Just now)',
      timestamp: Date.now(),
      status: 'pending',
      imageUrl: hasPhoto
        ? 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80'
        : undefined,
      hasVoice: voiceRecorded,
      hasVideo: hasVideo,
    };

    onSubmitSuccess(newSub);
    setIsSubmitted(true);
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

        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => {
              setIsSubmitted(false);
              setHeadline('');
              setDetails('');
              setVoiceRecorded(false);
              setHasPhoto(false);
            }}
            className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-sm transition-colors"
          >
            మరో వార్త పంపండి
          </button>
          <button
            onClick={handleBack}
            className="w-full py-2.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl font-bold text-sm shadow-md transition-all"
          >
            హోమ్‌కి వెళ్లండి
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-16">
      {/* Red Header matching Screen 4 */}
      <div className="sticky top-0 z-30 bg-[#E41E26] text-white px-4 py-3.5 flex items-center gap-3 shadow-md">
        <button
          id="submit-back-btn"
          onClick={handleBack}
          className="p-1 -ml-1 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-wide telugu-heading flex-1 text-center pr-5">
          మీ వార్త పంపండి
        </h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* శీర్షిక (Headline) */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
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
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
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

          {/* Media Attachments matching Screen 4 (ఫోటో, వీడియో, Voice) */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label className="block text-xs font-bold text-neutral-800 mb-3 telugu-heading">
              మీడియా జతచేయండి (Media Attachments)
            </label>

            <div className="grid grid-cols-3 gap-3">
              {/* Photo Box */}
              <button
                type="button"
                id="attach-photo-btn"
                onClick={() => setHasPhoto(!hasPhoto)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  hasPhoto
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
                <span className="text-[10px] text-neutral-500">
                  {hasPhoto ? '✓ జతచేయబడింది' : 'ఫోటో తీయండి'}
                </span>
              </button>

              {/* Video Box */}
              <button
                type="button"
                id="attach-video-btn"
                onClick={() => setHasVideo(!hasVideo)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  hasVideo
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
                <span className="text-[10px] text-neutral-500">
                  {hasVideo ? '✓ వీడియో సిద్ధం' : 'వీడియో తీయండి'}
                </span>
              </button>

              {/* Voice Record Box matching Screen 4 */}
              <button
                type="button"
                id="attach-voice-btn"
                onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  isRecordingVoice
                    ? 'border-[#E41E26] bg-red-100 ring-2 ring-red-400 animate-pulse'
                    : voiceRecorded
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                    : 'border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center mb-1 shadow-2xs ${
                    isRecordingVoice
                      ? 'bg-[#E41E26] text-white'
                      : voiceRecorded
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
                <span className="text-[10px] text-neutral-500">
                  {isRecordingVoice
                    ? `${recordingSeconds}s రికార్డింగ్...`
                    : voiceRecorded
                    ? '✓ వాయిస్ సేవ్'
                    : 'వాయిస్ రికార్డ్'}
                </span>
              </button>
            </div>
          </div>

          {/* ప్రాంతం (Location) Dropdown matching Screen 4 */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-2xs">
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              ప్రాంతం (Location) *
            </label>
            <div className="relative">
              <select
                id="select-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2.5 pl-9 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
              >
                {DISTRICTS.filter((d) => d !== 'అన్ని ప్రాంతాలు').map((dist) => (
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
            <label className="block text-xs font-bold text-neutral-800 mb-1.5 telugu-heading">
              వర్గం (Category) *
            </label>
            <div className="relative">
              <select
                id="select-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 focus:border-[#E41E26] focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium bg-white appearance-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
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
            className="w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-base font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all telugu-heading flex items-center justify-center gap-2"
          >
            <span>వార్తను పంపండి</span>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </button>
        </form>
      </div>
    </div>
  );
};
