import React, { useState } from 'react';
import { Logo } from './Logo';
import { NewsSubmission, NewsItem } from '../types';
import {
  LayoutDashboard,
  Newspaper,
  Clock,
  CheckCircle,
  Users,
  Megaphone,
  Layers,
  Bell,
  Settings,
  LogOut,
  Check,
  X,
  Smartphone,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

interface AdminDashboardProps {
  submissions: NewsSubmission[];
  onApproveSubmission: (subId: string) => void;
  onRejectSubmission: (subId: string) => void;
  onSwitchToMobile: () => void;
  publishedCount: number;
  totalNewsCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  onApproveSubmission,
  onRejectSubmission,
  onSwitchToMobile,
  publishedCount,
  totalNewsCount,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'published' | 'reporters' | 'citizen'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.reporterName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === 'all' ? true : sub.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col md:flex-row text-neutral-900 font-sans">
      {/* Left Dark Sidebar matching Screen 6 */}
      <aside className="w-full md:w-64 bg-[#111111] text-white flex-shrink-0 flex flex-col justify-between p-4 border-r border-neutral-800">
        <div>
          {/* Logo */}
          <div className="pb-5 border-b border-neutral-800">
            <Logo variant="admin" />
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'published'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              <span>వార్తలు (All News)</span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pending'
                  ? 'bg-[#E41E26] text-white shadow-md'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </div>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/30">
                {pendingSubmissions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Published ({publishedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('reporters')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Reporters (32)</span>
            </button>

            <button
              onClick={() => setActiveTab('citizen')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all"
            >
              <Megaphone className="w-4 h-4" />
              <span>ప్రజల వార్తలు</span>
            </button>

            <div className="pt-4 mt-4 border-t border-neutral-800/80">
              <span className="text-[10px] font-bold text-neutral-500 px-3 uppercase tracking-wider block mb-1">
                సెట్టింగ్స్
              </span>
              <button
                onClick={() => alert('నోటిఫికేషన్ మేనేజర్ సిద్ధంగా ఉంది.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              >
                <Bell className="w-4 h-4" />
                <span>Push Notification</span>
              </button>
              <button
                onClick={() => alert('యాడ్స్ మేనేజర్ సిద్ధంగా ఉంది.')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              >
                <Layers className="w-4 h-4" />
                <span>Ads Management</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Switch back to mobile app preview & Logout */}
        <div className="pt-4 border-t border-neutral-800 space-y-2">
          <button
            onClick={onSwitchToMobile}
            className="w-full flex items-center justify-center gap-2 bg-[#E41E26] hover:bg-[#B71C1C] text-white py-2.5 px-3 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Smartphone className="w-4 h-4" />
            <span>మొబైల్ యాప్ చూడండి</span>
          </button>

          <button
            onClick={onSwitchToMobile}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>లాగౌట్</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area matching Screen 6 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar matching Screen 6 */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-neutral-900 leading-tight telugu-heading">
              Dashboard
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              రచ్చ బండ న్యూస్ మేనేజ్‌మెంట్ సెంటర్
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
              📅 31 మే 2025, శనివారం
            </span>

            {/* Admin Profile matching Screen 6 */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
              <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                RA
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-neutral-900 leading-none">
                  Ravindrudu
                </span>
                <span className="text-[10px] font-bold text-red-600 uppercase mt-0.5">
                  Super Admin
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* 5 Stats Cards matching Screen 6:
              - ఈరోజు వార్తలు: 125
              - Pending: 18
              - Published: 107
              - Reporters: 32
              - ప్రజల వార్తలు: 46
          */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* 1. ఈరోజు వార్తలు */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center flex-shrink-0">
                <Newspaper className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  ఈరోజు వార్తలు
                </span>
                <span className="text-2xl font-black text-neutral-900 mt-0.5 block">
                  {totalNewsCount}
                </span>
              </div>
            </div>

            {/* 2. Pending */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9800] flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  Pending
                </span>
                <span className="text-2xl font-black text-amber-600 mt-0.5 block">
                  {pendingSubmissions.length}
                </span>
              </div>
            </div>

            {/* 3. Published */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#43A047] flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  Published
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
                  {publishedCount}
                </span>
              </div>
            </div>

            {/* 4. Reporters */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#8E24AA] flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  Reporters
                </span>
                <span className="text-2xl font-black text-purple-700 mt-0.5 block">
                  32
                </span>
              </div>
            </div>

            {/* 5. ప్రజల వార్తలు */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#E41E26] flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-neutral-500 block">
                  ప్రజల వార్తలు
                </span>
                <span className="text-2xl font-black text-[#E41E26] mt-0.5 block">
                  46
                </span>
              </div>
            </div>
          </div>

          {/* Recent Pending News Section matching Screen 6 */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-neutral-900 telugu-heading">
                  Recent Pending News (పరిశీలించాల్సిన వార్తలు)
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  పౌరులు మరియు రిపోర్టర్ల నుండి వచ్చిన తాజా వార్తల ఆమోదం
                </p>
              </div>

              {/* Search & Filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="శీర్షిక లేదా ప్రాంతం వెతకండి..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                  />
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-neutral-50 text-neutral-700 outline-none"
                >
                  <option value="all">అన్నీ (All)</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Table matching Screen 6 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-bold">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">శీర్షిక (Headline & Thumbnail)</th>
                    <th className="py-3 px-4">ప్రాంతం (Location)</th>
                    <th className="py-3 px-4">రిపోర్టర్ (Reporter)</th>
                    <th className="py-3 px-4">సమయం (Time)</th>
                    <th className="py-3 px-4 text-center">చర్యలు (Actions)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-400">
                        వార్తలు ఏవీ కనుగొనబడలేదు.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub, index) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-neutral-50/60 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3 px-4 font-mono font-bold text-neutral-400">
                          {index + 1}
                        </td>

                        {/* Title with thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {sub.imageUrl ? (
                              <img
                                src={sub.imageUrl}
                                alt={sub.title}
                                className="w-12 h-10 object-cover rounded-lg flex-shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-10 rounded-lg bg-red-100 text-[#E41E26] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                RB
                              </div>
                            )}
                            <div className="max-w-xs">
                              <h4 className="font-bold text-neutral-900 line-clamp-1 telugu-heading text-xs">
                                {sub.title}
                              </h4>
                              <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                                {sub.details}
                              </p>
                              {sub.hasVoice && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 px-1.5 rounded mt-0.5">
                                  🎙️ Voice Note
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4 font-semibold text-neutral-700">
                          {sub.location}
                        </td>

                        {/* Reporter */}
                        <td className="py-3 px-4 text-neutral-700 font-medium">
                          {sub.reporterName}
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                          {sub.timeAgo}
                        </td>

                        {/* Actions (Approve / Reject buttons matching Screen 6) */}
                        <td className="py-3 px-4 text-center">
                          {sub.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onApproveSubmission(sub.id)}
                                className="px-3 py-1 bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onRejectSubmission(sub.id)}
                                className="px-3 py-1 bg-white border border-red-400 text-red-600 hover:bg-red-600 hover:text-white rounded-md text-[11px] font-bold transition-all shadow-2xs active:scale-95"
                              >
                                Reject
                              </button>
                            </div>
                          ) : sub.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              <X className="w-3 h-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
