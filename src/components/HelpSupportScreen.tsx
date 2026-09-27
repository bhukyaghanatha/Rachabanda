/**
 * @file HelpSupportScreen.tsx
 * @description Dedicated Help & Support page with FAQ accordions and in-app assistance.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, MessageSquare, Info } from 'lucide-react';
import { useAppLanguage } from '../i18n';

interface FAQItem {
  questionTe: string;
  questionEn: string;
  answerTe: string;
  answerEn: string;
}

const FAQS: FAQItem[] = [
  {
    questionTe: 'రచ్చబండలో వార్తను ఎలా సమర్పించాలి?',
    questionEn: 'How do I submit news in Rachabanda?',
    answerTe: 'యాప్ హోమ్ లేదా డ్యాష్‌బోర్డ్‌లో "+ కొత్త వార్త" బటన్‌పై క్లిక్ చేయండి. శీర్షిక, వివరాలు, సరైన ప్రాంతం, వర్గం మరియు ఒక స్పష్టమైన ఫోటో లేదా వాయిస్ రికార్డింగ్‌ను జతచేసి సమర్పించండి.',
    answerEn: 'Click the "+ New Story" button on the Home or Dashboard. Fill in the title, details, district/location, category, and attach a photo or audio narration, then click Submit.',
  },
  {
    questionTe: 'నేను పంపిన వార్త ఎప్పుడు ప్రచురించబడుతుంది?',
    questionEn: 'When will my submitted news be published?',
    answerTe: 'మా ఎడిటోరియల్ డెస్క్ వార్తను ధృవీకరించి నాణ్యతా ప్రమాణాల ప్రకారం సమీక్షిస్తుంది. సాధారణంగా సమర్పించిన కొద్ది గంటల్లోనే ఆమోదించబడి లైవ్ ఫీడ్‌లో ప్రచురించబడుతుంది.',
    answerEn: 'Our editorial desk verifies the facts and checks the content quality. Most submissions are reviewed within a few hours and published directly to the live feed upon approval.',
  },
  {
    questionTe: 'వార్త తిరస్కరించబడితే ఏమి చేయాలి?',
    questionEn: 'What should I do if my submission is rejected?',
    answerTe: 'నా వార్తలు విభాగంలోకి వెళ్లి తిరస్కరణకు గల కారణాన్ని గమనించవచ్చు. ఎడిటోరియల్ సూచనల ఆధారంగా వివరాలను సవరించి "మళ్ళీ సమర్పించండి" బటన్ ద్వారా వెంటనే రీ-సబ్మిట్ చేయవచ్చు.',
    answerEn: 'Navigate to "My Submissions" to see the reviewer feedback. You can easily click "Resubmit Story", fix any missing information or issues, and submit it again.',
  },
  {
    questionTe: 'యాప్ భాషను మరియు వార్తల భాషను ఎలా మార్చుకోవాలి?',
    questionEn: 'How do I change app language and news language?',
    answerTe: 'ప్రొఫైల్ స్క్రీన్‌లోని "యాప్ భాష" విభాగంలో తెలుగు, ఇంగ్లీష్ లేదా హిందీని ఎంచుకోవచ్చు. అలాగే హోమ్ పేజీలోని వార్తల భాష ఫిల్టర్ ద్వారా మీకు కావలసిన భాషా వార్తలను చూడవచ్చు. రెండూ స్వతంత్రంగా పనిచేస్తాయి.',
    answerEn: 'Go to Profile Details to switch the App UI language between Telugu, English, or Hindi. You can also filter news by language directly on the Home screen. App language and news language operate independently.',
  },
  {
    questionTe: 'ఖాతా వివరాలను ఎలా మార్చుకోవాలి లేదా ఖాతాను తొలగించవచ్చా?',
    questionEn: 'How can I update my profile or delete my account?',
    answerTe: 'ప్రొఫైల్ స్క్రీన్‌లో "ప్రొఫైల్ ఎడిట్ చేయండి" ద్వారా పేరు, ఫోన్ నంబర్, జిల్లా మరియు మండలం వివరాలు మార్చుకోవచ్చు. అలాగే దిగువన ఉన్న "ఖాతా తొలగించండి" ఎంపిక ద్వారా మీ ఖాతాను శాశ్వతంగా తొలగించవచ్చు.',
    answerEn: 'Click "Edit Profile" on the Profile screen to update your name, district, mandal, or bio. If you wish to close your account, use the "Delete Account" button at the bottom for secure, permanent removal.',
  },
];

export const HelpSupportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-12 animate-in fade-in">
      {/* Top Navigation Bar with Back to Dashboard */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <button
          onClick={() => navigate('/dashboard')}
          aria-label={t('dashboard.backToDashboard')}
          className="flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 px-3 py-2 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('dashboard.backToDashboard')}</span>
        </button>

        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Rachabanda Support
        </span>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg border border-neutral-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black telugu-heading text-white">
              {t('help.title')}
            </h1>
            <p className="text-xs text-neutral-300">
              {t('help.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-neutral-900 telugu-heading flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-[#E41E26]" />
          <span>{t('help.faq')}</span>
        </h2>

        <div className="space-y-2.5">
          {FAQS.map((faq, index) => {
            const isOpen = expandedIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-neutral-200/80 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-neutral-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <div className="pr-3">
                    <span className="text-xs font-bold text-neutral-900 telugu-heading block leading-snug">
                      {faq.questionTe}
                    </span>
                    <span className="text-[11px] text-neutral-500 font-medium block mt-0.5">
                      {faq.questionEn}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 flex-shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-neutral-600 border-t border-neutral-100 bg-neutral-50/40 space-y-1.5 animate-in fade-in leading-relaxed">
                    <p className="telugu-body">{faq.answerTe}</p>
                    <p className="text-neutral-500 text-[11px]">{faq.answerEn}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* In-App Editorial Support Notice */}
      <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-neutral-900 telugu-heading">
            {t('help.contactSupport')}
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {t('help.inAppSupportNotice')}
          </p>
          <div className="pt-1">
            <span className="inline-block bg-neutral-100 text-neutral-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
              Rachabanda Editorial Desk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
