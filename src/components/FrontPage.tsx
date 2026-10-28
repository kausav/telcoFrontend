import React, { useState, useEffect } from 'react';
import {
  TableProperties,
  FileText,
  Image as ImageIcon,
  Film,
  Play,
  Pause,
  ArrowRight
} from 'lucide-react';
import { BrandHeader } from './BrandHeader';

import brainMriImg from '../assets/images/brain_mri_scan_1791354239789.jpg';
import facePortrait1 from '../assets/images/synthetic_face_portrait_1791354252438.jpg';
import facePortrait2 from '../assets/images/synthetic_face_two_1791354271161.jpg';
import videoFramesImg from '../assets/images/video_motion_frames_1791354285350.jpg';

interface FrontPageProps {
  onLaunchStudio: () => void;
  /** Opens the ER model proof of concept. The link is hidden when this is not given. */
  onOpenEr?: () => void;
  showToast: (msg: string) => void;
}

export const FrontPage: React.FC<FrontPageProps> = ({ onLaunchStudio, onOpenEr }) => {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(65);

  // Simulated video playback scrubber animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingVideo) {
      interval = setInterval(() => {
        setVideoProgress(prev => (prev >= 98 ? 15 : prev + 1.2));
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isPlayingVideo]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col justify-between p-2 sm:p-4 md:p-6 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans"
      style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)' }}
    >
      {/* Background ambient light circles */}
      <div className="bg-ambient-glow -top-20 -left-20" />
      <div className="bg-ambient-glow top-1/2 right-0" />

      {/* Main Layout Card Container - Full Fit Landscape Width */}
      <div className="relative z-10 w-full bg-white/85 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(99,102,241,0.08),0_4px_12px_-2px_rgba(0,0,0,0.03)] my-auto flex flex-col justify-between">
        
        {/* 1. Top Logo Header - ModelOS | Tech Mahindra | Source */}
        <header className="flex items-center justify-between gap-4 mb-6">
          {/* Left: ModelOS logo | Tech Mahindra logo | Source */}
          <BrandHeader onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
        </header>

        {/* 2. Main Hero Headline & Subtitle (Kept in ONE line) */}
        <section className="mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-2 sm:mb-3">
            Smarter Synthetic Data. <br className="hidden sm:inline" />
            <span className="gradient-text">Zero Privacy Risk.</span>
          </h1>
          {/* Subtitle strictly on a single line */}
          <p className="text-slate-500 text-sm sm:text-base font-normal leading-relaxed whitespace-nowrap overflow-x-auto pb-1">
            Generate high-fidelity, privacy-compliant tabular, image, text, and time-series data for AI model training.
          </p>
        </section>

        {/* 3. The 4-Card Modality Landscape Grid - Exact Match to Attached Screenshot */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-5 mb-6 items-stretch">
          
          {/* ================= CARD 1: STRUCTURED DATA ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              {/* Header Icon & Title */}
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5">
                <TableProperties className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Structured Data</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 mb-3">Telecommunication, BFSI, T&S...</p>

              {/* Sub-bar Divider */}
              <div className="border-t border-slate-100 pt-3 mb-3">
                {/* Metric Sub-bar: Differential Privacy */}
                <div className="flex items-center text-xs font-mono mb-3">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>Differential Privacy <span className="text-emerald-700 font-semibold">&lt;0.10</span></span>
                  </div>
                </div>

                {/* Sub-table Container */}
                <div className="border border-slate-200/80 rounded-xl p-2.5 bg-slate-50/40">
                  {/* Table Headers Pill Bar */}
                  <div className="grid grid-cols-4 text-[10px] font-mono font-bold text-slate-500 tracking-wider px-2 py-1.5 bg-slate-100/80 rounded-lg mb-2 text-center">
                    <span className="text-left">PATIENT_ID</span>
                    <span>DIAGNOSIS</span>
                    <span>RISK_SCORE</span>
                    <span>CONFIDENCE</span>
                  </div>

                  {/* Rows */}
                  <div className="space-y-1.5 font-mono text-xs">
                    {/* Row 1 */}
                    <div className="grid grid-cols-4 items-center px-1.5 py-1 rounded hover:bg-slate-50 transition-colors text-center">
                      <span className="text-left font-semibold text-indigo-600 text-[11px]">#SYN-9081</span>
                      <span className="text-slate-800 text-[11px] font-sans font-medium">Cardiology</span>
                      <span className="text-emerald-700 text-[11px] font-semibold">0.12 (Low)</span>
                      <span className="inline-flex justify-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded">0.99</span>
                      </span>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-4 items-center px-1.5 py-1 rounded hover:bg-slate-50 transition-colors text-center">
                      <span className="text-left font-semibold text-indigo-600 text-[11px]">#SYN-9982</span>
                      <span className="text-slate-800 text-[11px] font-sans font-medium">Oncology</span>
                      <span className="text-amber-700 text-[11px] font-semibold">8.78 (High)</span>
                      <span className="inline-flex justify-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded">0.96</span>
                      </span>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-4 items-center px-1.5 py-1 rounded hover:bg-slate-50 transition-colors text-center">
                      <span className="text-left font-semibold text-indigo-600 text-[11px]">#SYN-9983</span>
                      <span className="text-slate-800 text-[11px] font-sans font-medium">Neurology</span>
                      <span className="text-emerald-700 text-[11px] font-semibold">8.94 (Low)</span>
                      <span className="inline-flex justify-center">
                        <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded">0.98</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Footer */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500 text-xs">Status</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs border border-emerald-200/60 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Available Now
              </span>
            </div>
          </div>

          {/* ================= CARD 2: UNSTRUCTURED DATA ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              {/* Header Icon & Title */}
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3.5">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Unstructured Data</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 mb-3">Web Content & Documents</p>

              <div className="border-t border-slate-100 pt-3.5 mb-3">
                {/* Document Sub-Headline */}
                <h3 className="text-xs font-bold text-slate-900 leading-snug mb-2.5">
                  Synthetic medical report or news article as: health er shaecarm anconmans/minuter invalves and medical report
                </h3>

                {/* Paragraph 1 with Inline Image Box */}
                <div className="flex gap-2.5 items-start mb-2.5">
                  <p className="text-[11px] leading-[1.45] text-slate-600 font-normal">
                    Fsynthetic medical report as sealuto structures condvencent news articoe'sasars show in the concepts of meao revisew cemidactive saedical atienting in a seewa; natice and letnien and healthmanencentsicariots resi eo.tioo socces convesirinwqatly, some sociair articette insesade medical advertures.
                  </p>
                  <div className="shrink-0 w-16 h-12 rounded-lg bg-slate-200/80 border border-slate-300/70 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>

                {/* Paragraph 2 */}
                <p className="text-[11px] leading-[1.45] text-slate-600 font-normal">
                  The synthetic medical report variecto srtviles swv altereetive earilor: repars surevolimanive report seqaerses oisiols such as moelioras medicai oorewetnnte comieaminations orislels survedicsi rasakmation; nunzeur wkti-more aetecsiar efroicn dfazloe; se search lesoix ilur tnebtors and asiore. Viriouss rewe mesnients, mais orweocorpts reality mnident, or scntetehic medical report.
                </p>
              </div>
            </div>

            {/* Bottom Status Footer - Coming Soon */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400 text-xs">Status</span>
              <span className="font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs">Coming Soon</span>
            </div>
          </div>

          {/* ================= CARD 3: IMAGE ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              {/* Header Icon (Mini 2x2 avatars) & Title */}
              <div className="w-10 h-10 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center justify-center p-1.5 mb-3.5">
                <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                  <img src={facePortrait1} alt="Avatar 1" className="w-full h-full object-cover rounded-sm" />
                  <img src={facePortrait2} alt="Avatar 2" className="w-full h-full object-cover rounded-sm" />
                  <img src={facePortrait2} alt="Avatar 3" className="w-full h-full object-cover rounded-sm" />
                  <img src={facePortrait1} alt="Avatar 4" className="w-full h-full object-cover rounded-sm" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Image</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 mb-3">Computer Vision Samples</p>

              <div className="border-t border-slate-100 pt-3.5 mb-3">
                {/* 3-Column x 2-Row Visual Image Matrix: 4 MRI Scans + 2 Facial Portraits */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Row 1, Col 1: MRI Scan 1 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs relative">
                    <img
                      src={brainMriImg}
                      alt="Brain MRI Scan Slice 1"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Row 1, Col 2: MRI Scan 2 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs relative">
                    <img
                      src={brainMriImg}
                      alt="Brain MRI Scan Slice 2"
                      className="w-full h-full object-cover scale-105 contrast-125"
                    />
                  </div>

                  {/* Row 1, Col 3: Face Portrait 1 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
                    <img
                      src={facePortrait1}
                      alt="Synthetic Human Face Sample 1"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Row 2, Col 1: MRI Scan 3 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs relative">
                    <img
                      src={brainMriImg}
                      alt="Brain MRI Scan Slice 3"
                      className="w-full h-full object-cover rotate-180 scale-105"
                    />
                  </div>

                  {/* Row 2, Col 2: MRI Scan 4 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-black border border-slate-200 shadow-xs relative">
                    <img
                      src={brainMriImg}
                      alt="Brain MRI Scan Slice 4"
                      className="w-full h-full object-cover brightness-110"
                    />
                  </div>

                  {/* Row 2, Col 3: Face Portrait 2 */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
                    <img
                      src={facePortrait2}
                      alt="Synthetic Human Face Sample 2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Footer - Coming Soon */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400 text-xs">Status</span>
              <span className="font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs">Coming Soon</span>
            </div>
          </div>

          {/* ================= CARD 4: VIDEO ================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              {/* Header Icon & Title */}
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3.5">
                <Film className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Video</h2>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 mb-3">Motion & Activity Samples</p>

              <div className="border-t border-slate-100 pt-3.5 mb-3">
                {/* Video Player Scrubber Showcase Box */}
                <div className="border border-slate-200/90 rounded-2xl p-3 bg-slate-50/50 flex flex-col justify-center min-h-[170px]">
                  
                  {/* Top Bar: Play Button + Filmstrip frames */}
                  <div className="flex items-center gap-2.5 mb-3">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-all shadow-xs cursor-pointer shrink-0"
                      title={isPlayingVideo ? "Pause preview" : "Play preview"}
                    >
                      {isPlayingVideo ? (
                        <Pause className="w-4 h-4 fill-slate-700 text-slate-700" />
                      ) : (
                        <Play className="w-4 h-4 fill-slate-700 text-slate-700 ml-0.5" />
                      )}
                    </button>

                    {/* Filmstrip Frame Sequence */}
                    <div className="relative flex-1 h-14 rounded-lg overflow-hidden border border-slate-300/70 bg-black flex items-center">
                      <img
                        src={videoFramesImg}
                        alt="Activity motion frames sequence"
                        className="w-full h-full object-cover"
                      />
                      {/* Filmstrip frame division lines overlay */}
                      <div className="absolute inset-0 grid grid-cols-4 pointer-events-none divide-white/20" />
                    </div>
                  </div>

                  {/* Scrubber Timeline Area */}
                  <div className="relative pt-2 pb-1 px-1">
                    {/* Scrubber Tracks */}
                    <div className="space-y-1.5">
                      {/* Top Primary Scrubber Line (Blue) */}
                      <div className="h-1.5 w-full bg-slate-200/90 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-75"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>

                      {/* Bottom Secondary Band (Purple) */}
                      <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500/80 rounded-full transition-all duration-75"
                          style={{ width: `${Math.max(10, videoProgress - 15)}%`, marginLeft: '12%' }}
                        />
                      </div>
                    </div>

                    {/* Vertical Scrub Indicator Line & Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-900 pointer-events-none transition-all duration-75 flex flex-col justify-between items-center"
                      style={{ left: `${videoProgress}%` }}
                    >
                      <div className="w-2 h-1 bg-slate-900 rounded-full -mt-0.5" />
                      <div className="w-2 h-1 bg-slate-900 rounded-full -mb-0.5" />
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom Status Footer - Coming Soon */}
            <div className="border-t border-slate-100 pt-3.5 mt-4 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400 text-xs">Status</span>
              <span className="font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md text-xs">Coming Soon</span>
            </div>
          </div>

        </section>

        {/* 4. Bottom Feature Pill Footer */}
        <footer className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-end gap-4 text-xs font-medium text-slate-500">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {onOpenEr && (
            <button
              onClick={onOpenEr}
              className="bg-white hover:bg-slate-50 text-indigo-700 font-semibold px-5 py-2.5 rounded-xl border border-indigo-200 transition-all cursor-pointer text-xs w-full sm:w-auto justify-center"
            >
              ER model (proof of concept)
            </button>
          )}
          <button
            onClick={onLaunchStudio}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer text-xs w-full sm:w-auto justify-center hover:scale-[1.02]"
          >
            <span>Launch Pipeline Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          </div>
        </footer>

      </div>
    </div>
  );
};