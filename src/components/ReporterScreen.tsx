import React, { useState } from 'react';
import {
  User,
  Plus,
  FileText,
  Clock,
  CheckCircle,
  HelpCircle,
  BookOpen,
  LogOut,
  Bell,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { NewsSubmission } from '../types';

interface ReporterScreenProps {
  onOpenSubmitNews: () => void;
  submissions: NewsSubmission[];
  onOpenAdmin: () => void;
}

export const ReporterScreen: React.FC<ReporterScreenProps> = ({
  onOpenSubmitNews,
  submissions,
  onOpenAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'guidelines' | 'support'>('profile');

  // Compute live reporter stats
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const publishedCount = submissions.filter((s) => s.status === 'approved').length;
  const totalNews = 12 + submissions.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Top Header matching Screen 5: Reporter App with lock badge */}
      <div className="bg-[#E41E26] text-white px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-300" />
          <h1 className="text-base font-black tracking-wide">Reporter App</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAdmin}
            className="text-xs bg-black/25 hover:bg-black/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1"
          >
            <span>అడ్మిన్ డెస్క్</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Profile Card matching Screen 5 */}
        <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-[#E41E26]/20 bg-neutral-100 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                alt="Ravi Kumar"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black text-neutral-900 leading-tight">
                  Ravi Kumar
                </h2>
                <span className="bg-red-50 text-[#E41E26] text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-red-200">
                  ప్రధాన రిపోర్టర్
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-500 mt-0.5">
                Reporter ID: <span className="font-bold text-neutral-800">RBV001</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                ప్రాంతం: ఖమ్మం & భద్రాద్రి కొత్తగూడెం
              </p>
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        {/* Big Red '+ కొత్త వార్త' Button matching Screen 5 */}
        <button
          id="reporter-new-post-btn"
          onClick={onOpenSubmitNews}
          className="w-full py-3.5 bg-[#E41E26] hover:bg-[#B71C1C] text-white rounded-xl text-base font-black shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 telugu-heading"
        >
          <Plus className="w-5 h-5" />
          <span>+ కొత్త వార్త రాయండి</span>
        </button>

        {/* Stats Row matching Screen 5 (My News: 12, Pending: 5, Published: 7) */}
        <div className="grid grid-cols-3 gap-3">
          {/* My News */}
          <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">My News</span>
            <span className="text-xl font-black text-neutral-900 mt-0.5">
              {totalNews}
            </span>
          </div>

          {/* Pending */}
          <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Pending</span>
            <span className="text-xl font-black text-amber-600 mt-0.5">
              {pendingCount}
            </span>
          </div>

          {/* Published */}
          <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 shadow-2xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-neutral-500">Published</span>
            <span className="text-xl font-black text-emerald-600 mt-0.5">
              {publishedCount + 7}
            </span>
          </div>
        </div>

        {/* Action Menu List matching Screen 5 */}
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden divide-y divide-neutral-100">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-neutral-800">
                నా ప్రొఫైల్ (Profile)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveTab('guidelines')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-neutral-800">
                రిపోర్టర్ నిబంధనలు (Guidelines)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                <HelpCircle className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-neutral-800">
                సహాయం & మద్దతు (Help & Support)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => alert('రిపోర్టర్ సెషన్ సక్రియంగా ఉంది.')}
            className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-red-50/50 transition-colors text-red-600"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold">లాగౌట్ (Logout)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        </div>

        {/* Dynamic Detail Modal / Card based on selection */}
        {activeTab === 'guidelines' && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed">
            <h3 className="font-bold text-sm text-amber-950 mb-1.5 telugu-heading flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              రిపోర్టర్ మార్గదర్శకాలు (Reporting Rules)
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>వార్తలో వాస్తవాలు మాత్రమే ఉండాలి, ఎలాంటి అసత్య ప్రచారం చేయరాదు.</li>
              <li>ప్రజల సమస్యలు, ప్రమాదాలు, ప్రభుత్వ పథకాల అమలుపై దృష్టి సారించండి.</li>
              <li>లైవ్ వీడియో లేదా ఫోటో స్పష్టంగా ఉండేలా చూడండి.</li>
              <li>స్థానిక ప్రజల వాయిస్ నోట్ జతచేస్తే ప్రాధాన్యత లభిస్తుంది.</li>
            </ul>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
            <h3 className="font-bold text-sm text-blue-950 mb-1.5 telugu-heading">
              రచ్చ బండ న్యూస్ డెస్క్ హెల్ప్‌లైన్
            </h3>
            <p>ఫోన్: <strong>+91 98480 12345</strong> (24x7 న్యూస్ డెస్క్)</p>
            <p className="mt-1">ఈమెయిల్: <strong>newsdesk@rachabanda-voice.com</strong></p>
            <p className="mt-1">ఖమ్మం ప్రధాన కార్యాలయం: కలెక్టరేట్ రోడ్, ఖమ్మం.</p>
          </div>
        )}
      </div>
    </div>
  );
};
