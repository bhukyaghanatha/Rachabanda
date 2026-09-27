/**
 * @file GuidelinesScreen.tsx
 * @description Dedicated Reporter Guidelines page with clear back-to-dashboard navigation.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Camera, ShieldCheck, FileCheck2, Scale } from 'lucide-react';
import { useAppLanguage } from '../i18n';

export const GuidelinesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAppLanguage();

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
          Rachabanda Guidelines
        </span>
      </div>

      {/* Screen Header Banner */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 rounded-3xl shadow-lg border border-neutral-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black telugu-heading text-white">
              {t('guidelines.title')}
            </h1>
            <p className="text-xs text-neutral-300">
              {t('guidelines.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Guidelines Cards Grid */}
      <div className="space-y-4">
        {/* 1. What reporters can submit */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-[#E41E26]">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold text-neutral-900 telugu-heading">
              ఏ విధమైన వార్తలు సమర్పించవచ్చు? / What You Can Submit
            </h2>
          </div>
          <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-5 leading-relaxed">
            <li>గ్రామీణ, మండల, పట్టణ స్థాయి స్థానిక ప్రజా సమస్యలు (తాగునీరు, రోడ్లు, విద్యుత్, పారిశుధ్యం).</li>
            <li>స్థానిక సాంస్కృతిక, క్రీడా, వ్యవసాయ మరియు విద్యా సంబంధిత విశేషాలు.</li>
            <li>ప్రభుత్వ సంక్షేమ పథకాల క్షేత్రస్థాయి అమలు మరియు ప్రజల స్పందన.</li>
            <li>స్థానిక ప్రజలకు ఉపయోగపడే ముఖ్య సమాచారం మరియు ప్రకటనలు.</li>
          </ul>
        </div>

        {/* 2. Accuracy & Verification */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-blue-600">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold text-neutral-900 telugu-heading">
              వాస్తవాల ధృవీకరణ / Accuracy & Fact-Checking
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            ప్రతి వార్తను స్వయంగా ధృవీకరించుకున్న తర్వాత మాత్రమే సమర్పించండి. రూమర్లు, నిరాధారమైన ఆరోపణలు లేదా ధృవీకరించని సోషల్ మీడియా పోస్టులను వార్తలుగా పంపరాదు. వార్తలో ప్రస్తావించిన తేదీ, సమయం మరియు స్థలం కచ్చితంగా ఉండాలి.
          </p>
        </div>

        {/* 3. Photo & Video Standards */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-purple-600">
            <Camera className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold text-neutral-900 telugu-heading">
              ఫోటో మరియు వీడియో నిబంధనలు / Media Requirements
            </h2>
          </div>
          <ul className="text-xs text-neutral-600 space-y-2 list-disc pl-5 leading-relaxed">
            <li>ఫోటోలు స్వయంగా తీసినవై లేదా ప్రచురణ అనుమతి ఉన్నవై ఉండాలి.</li>
            <li>స్పష్టమైన వెలుతురులో తీసిన సమాంతర (Landscape) చిత్రాలకు ప్రాధాన్యత ఇవ్వబడుతుంది.</li>
            <li>తీవ్రమైన హింస, రక్తపాతం లేదా ఇతరుల గోప్యతకు భంగం కలిగించే ఫోటోలు మరియు వీడియోలు నిషేధం.</li>
          </ul>
        </div>

        {/* 4. Prohibited Content */}
        <div className="bg-white rounded-2xl p-5 border border-red-200 bg-red-50/20 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold text-red-900 telugu-heading">
              ఖచ్చితంగా నిషేధించబడిన అంశాలు / Prohibited Content
            </h2>
          </div>
          <ul className="text-xs text-red-800 space-y-2 list-disc pl-5 leading-relaxed">
            <li>మతపరమైన, కులపరమైన లేదా వర్గాల మధ్య విద్వేషాన్ని రెచ్చగొట్టే వార్తలు.</li>
            <li>వ్యక్తుల వ్యక్తిగత జీవితంపై దాడి చేసేవి, పరువునష్టం కలిగించే అసత్య వార్తలు.</li>
            <li>రాజకీయ దురుద్దేశంతో కూడిన తప్పుడు ప్రచారం లేదా పెయిడ్ ప్రమోషన్లు.</li>
            <li>కాపీరైట్ ఉల్లంఘన లేదా ఇతర మీడియా సంస్థల నుండి కాపీ చేసిన కంటెంట్.</li>
          </ul>
        </div>

        {/* 5. Editorial Process */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 text-emerald-600">
            <FileCheck2 className="w-5 h-5 flex-shrink-0" />
            <h2 className="text-sm font-bold text-neutral-900 telugu-heading">
              ఎడిటోరియల్ సమీక్ష విధానం / Editorial Review
            </h2>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed">
            మీరు సమర్పించిన ప్రతి కథనం రచ్చబండ ఎడిటోరియల్ డెస్క్ పరిశీలనలోకి వెళుతుంది. నిబంధనలకు అనుగుణంగా ఉన్న వార్తలు 60-పదాల వే 2 న్యూస్ ఫార్మాట్‌లో ఆమోదించబడి ప్రచురించబడతాయి. ఒకవేళ ఏవైనా మార్పులు అవసరమైతే సమీక్షకుల ఫీడ్‌బ్యాక్‌తో తిరస్కరించబడతాయి, వాటిని సవరించి మళ్ళీ సమర్పించవచ్చు.
          </p>
        </div>
      </div>
    </div>
  );
};
