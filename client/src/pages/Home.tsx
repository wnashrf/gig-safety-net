import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownUp,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Calculator,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Download,
  ExternalLink,
  HeartPulse,
  Landmark,
  LockKeyhole,
  Menu,
  Pause,
  PiggyBank,
  QrCode,
  Play,
  Plus,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  Share2,
  Save,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  Umbrella,
  Volume2,
  VolumeX,
  UserRound,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type ToolKey = "epf" | "socso" | "insurance" | "emergency";
type Language = "bm" | "en";
let currentLanguage: Language = "bm";
const localized = (bm: string, en: string) => currentLanguage === "bm" ? bm : en;
type CalculatorInputValue = string | number | boolean | null;
type CalculatorInputs = Record<string, CalculatorInputValue>;
type SyncInputs = (changes: CalculatorInputs) => void;

const formatRM = (value: number, decimals = 0) =>
  `RM ${Math.round(value).toLocaleString("ms-MY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const uiCopy = {
  bm: { how: "Cara ia bantu", tools: "Kiraan", comparison: "Perbandingan", plan: "Plan saya", login: "Log masuk", savePlan: "Simpan plan", language: "Bahasa Malaysia", heroEyebrow: "Jaringan keselamatan untuk kerja fleksibel", heroTitle: "Kerja ikut cara anda.", heroTitleAccent: "Masa depan pun.", heroCta: "Mulakan dengan kiraan", video: "Tonton video 1:15", howEyebrow: "Kurang jargon. Lebih tindakan.", howTitle: "Mulakan kecil,", howAccent: "bina perlahan-lahan.", toolsEyebrow: "Alat kiraan peribadi", toolsTitle: "Angka yang masuk akal", toolsAccent: "untuk hidup sebenar.", shareTitle: "Hantar pada kawan", shareAccent: "satu shift.", shareBody: "Video pendek, bahasa santai, mesej yang mudah diteruskan dalam group rider dan courier.", planTitle: "Plan anda,", planAccent: "di satu tempat.", footer: "Platform panduan kewangan untuk pekerja gig Malaysia." },
  en: { how: "How it helps", tools: "Calculators", comparison: "Compare", plan: "My plan", login: "Log in", savePlan: "Save plan", language: "English", heroEyebrow: "A safety net for flexible work", heroTitle: "Work your way.", heroTitleAccent: "Your future, too.", heroCta: "Start with a calculation", video: "Watch video 1:15", howEyebrow: "Less jargon. More action.", howTitle: "Start small,", howAccent: "build steadily.", toolsEyebrow: "Personal calculators", toolsTitle: "Numbers that make sense", toolsAccent: "for real life.", shareTitle: "Send it to", shareAccent: "your shift mates.", shareBody: "A short, friendly explainer made to share with rider and courier communities.", planTitle: "Your plan,", planAccent: "in one place.", footer: "A financial guidance platform for Malaysia's gig workers." },
} as const;

const futureValueMonthly = (payment: number, annualRate: number, years: number) => {
  const months = Math.max(0, years * 12);
  const monthlyRate = annualRate / 12;
  if (!months) return 0;
  if (!monthlyRate) return payment * months;
  return payment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
};

const socsoTiers = [
  { label: "RM 1,050", premium: 157.2, daily: 35, death: "RM 1,050 / bulan" },
  { label: "RM 1,550", premium: 232.8, daily: 51.67, death: "RM 1,550 / bulan" },
  { label: "RM 2,250", premium: 337.2, daily: 75, death: "RM 2,250 / bulan" },
  { label: "RM 2,950", premium: 441.6, daily: 98.33, death: "RM 2,950 / bulan" },
  { label: "RM 3,850", premium: 592.8, daily: 128.33, death: "RM 3,850 / bulan" },
];

const insuranceProducts = [
  {
    id: "etiqa",
    name: "Etiqa Takaful PA",
    short: "Kemalangan diri",
    tone: "coral",
    icon: Umbrella,
    description: "Pilihan rujukan untuk perlindungan kemalangan peribadi dan rider.",
    coverage: "Kemalangan diri",
    premium: "Semak quote terkini",
    hospital: "Semak PDS",
    claim: "Rubrik perlu disahkan",
    tag: "Rujukan",
    premiumValue: 35,
    coverageScore: 2,
  },
  {
    id: "aia",
    name: "AIA Takaful",
    short: "Perlindungan medikal",
    tone: "mint",
    icon: HeartPulse,
    description: "Pilihan rujukan untuk melengkapkan perlindungan kerja asas.",
    coverage: "Medikal & hospital",
    premium: "Semak quote terkini",
    hospital: "Semak PDS",
    claim: "Rubrik perlu disahkan",
    tag: "Medikal dahulu",
    premiumValue: 48,
    coverageScore: 3,
  },
  {
    id: "tune",
    name: "Tune Protect Rider",
    short: "Perlindungan rider",
    tone: "blue",
    icon: Zap,
    description: "Pilihan rujukan yang dekat dengan keperluan penghantar dan rider.",
    coverage: "Kemalangan & rider",
    premium: "Semak quote terkini",
    hospital: "Semak PDS",
    claim: "Rubrik perlu disahkan",
    tag: "Rujukan",
    premiumValue: 25,
    coverageScore: 2,
  },
];

function Logo() {
  return (
    <button className="brand" onClick={() => scrollToId("top")} aria-label="Lindung Gig, kembali ke atas">
      <span className="brand-mark"><ShieldCheck size={17} strokeWidth={2.5} /></span>
      <span className="brand-copy"><strong>LINDUNG</strong><em>GIG</em></span>
    </button>
  );
}

function SectionEyebrow({ children, icon: Icon = Sparkles }: { children: React.ReactNode; icon?: typeof Sparkles }) {
  return <div className="eyebrow"><Icon size={14} /> <span>{children}</span></div>;
}

function MiniIcon({ icon: Icon, className = "" }: { icon: typeof Sparkles; className?: string }) {
  return <span className={`mini-icon ${className}`}><Icon size={16} strokeWidth={2.2} /></span>;
}

function AppHeader({ onMenu, user, isAuthenticated, onLogin, onLogout, language, onLanguageChange }: { onMenu: () => void; user: { name?: string | null; email?: string | null } | null; isAuthenticated: boolean; onLogin: () => void; onLogout: () => void; language: Language; onLanguageChange: () => void }) {
  const copy = uiCopy[language];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Navigasi utama">
          <button onClick={() => scrollToId("how-it-works")}>{copy.how}</button>
          <button onClick={() => scrollToId("tools")}>{copy.tools}</button>
          <button onClick={() => scrollToId("comparison")}>{copy.comparison}</button>
          <button onClick={() => scrollToId("plan")}>{copy.plan}</button>
        </nav>
        <div className="header-actions">
          <button className="lang-btn" onClick={onLanguageChange} aria-label={`Switch language to ${language === "bm" ? "English" : "Bahasa Malaysia"}`}>{language === "bm" ? "BM" : "EN"} <ChevronDown size={13} /></button>
          <button className="header-save" onClick={() => isAuthenticated ? scrollToId("plan") : onLogin()}><Bookmark size={16} /> <span>{isAuthenticated ? copy.savePlan : copy.login}</span></button>{isAuthenticated && <button className="user-chip" onClick={onLogout} title="Log keluar">{user?.name || user?.email || (language === "bm" ? "Akaun anda" : "Your account")}<span>{language === "bm" ? "Log keluar" : "Log out"}</span></button>}
          <button className="mobile-menu" onClick={onMenu} aria-label="Buka menu"><Menu size={21} /></button>
        </div>
      </div>
    </header>
  );
}

function HeroIllustration({ displayName }: { displayName: string }) {
  return (
    <div className="hero-visual" aria-label={`Pratonton pelan keselamatan ${displayName}`}>
      <div className="visual-orbit orbit-one" />
      <div className="visual-orbit orbit-two" />
      <div className="visual-label label-top"><span className="status-dot" /> {localized("Pelan peribadi", "Personal plan")} {displayName}</div>
      <div className="phone-card">
        <div className="phone-topline"><span>{localized("KESELAMATAN ANDA", "YOUR SAFETY NET")}</span><ShieldCheck size={16} /></div>
        <div className="phone-balance">RM 2,000 <small>{localized("/ bulan", "/ month")}</small></div>
        <div className="phone-meta"><span>{localized("Profil peribadi • Selamat", "Personal profile • Secure")}</span><span className="green-text">{localized("Aktif", "Active")}</span></div>
        <div className="ring-wrap"><div className="safety-ring"><div><strong>3</strong><span>{localized("lapisan", "layers")}</span></div></div></div>
        <div className="phone-lines">
          <div><span><i className="line-dot mint" /> EPF i-Saraan Plus</span><b>RM 209</b></div>
          <div><span><i className="line-dot coral" /> SKSPS / Lindung Kendiri</span><b>RM 13/bln</b></div>
          <div><span><i className="line-dot blue" /> Dana kecemasan</span><b>RM 240</b></div>
        </div>
        <div className="phone-foot"><span>{localized("Setakat hari ini", "As of today")}</span><span className="tiny-pill"><Check size={11} /> 2/4 {localized("siap", "complete")}</span></div>
      </div>
      <div className="floating-card float-match"><span className="float-icon mint"><TrendingUp size={15} /></span><div><small>{localized("Kerajaan tambah", "Government adds")}</small><strong>RM 600 / tahun</strong></div></div>
      <div className="floating-card float-safe"><span className="float-icon coral"><LockKeyhole size={15} /></span><div><small>{localized("Data anda", "Your data")}</small><strong>{localized("Selamat & peribadi", "Secure & private")}</strong></div></div>
    </div>
  );
}

function Hero({ onVideo, displayName, language }: { onVideo: () => void; displayName: string; language: Language }) {
  const copy = uiCopy[language];
  return (
    <section id="top" className="hero-section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <SectionEyebrow icon={ShieldCheck}>{copy.heroEyebrow}</SectionEyebrow>
          <h1>{copy.heroTitle}<br /><span>{copy.heroTitleAccent}</span></h1>
          <p className="hero-lede">{localized("Satu tempat untuk faham, kira dan mula bina perlindungan kewangan — khas untuk rider, penghantar, freelancer dan yang bekerja sendiri.", "One place to understand, calculate, and build financial protection — made for riders, couriers, freelancers, and self-employed workers.")}</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => scrollToId("tools")}>{copy.heroCta} <ArrowUpRight size={17} /></button>
            <button className="button button-quiet" onClick={onVideo}><span className="play-icon"><Play size={13} fill="currentColor" /></span> {copy.video}</button>
          </div>
          <div className="hero-trust"><span><LockKeyhole size={14} /> {localized("Tiada data dijual", "No data is sold")}</span><span><Clock3 size={14} /> {localized("Siap dalam ~10 minit", "Ready in about 10 minutes")}</span></div>
        </div>
        <HeroIllustration displayName={displayName} />
      </div>
      <div className="hero-bottom-note"><span>{localized("Direka untuk rakyat Malaysia", "Designed for Malaysians")}</span><span className="note-rule" /><span>{localized("BM dahulu • mudah difahami • boleh terus buat", "BM first • easy to understand • ready to use")}</span></div>
    </section>
  );
}

function HowItWorks({ language }: { language: Language }) {
  const copy = uiCopy[language];
  const items = language === "bm" ? [
    { no: "01", icon: Calculator, title: "Kira apa yang sesuai", text: "Masukkan pendapatan dan komitmen sebenar. Kami tukar angka yang berserabut menjadi sasaran yang jelas." },
    { no: "02", icon: ClipboardCheck, title: "Faham pilihan anda", text: "Bezakan EPF untuk masa depan, SOCSO untuk kemalangan kerja dan perlindungan medikal tambahan." },
    { no: "03", icon: Bookmark, title: "Simpan satu plan", text: "Gabungkan keputusan anda dalam satu pelan peribadi yang boleh disemak dan dikemas kini bila-bila masa." },
  ] : [
    { no: "01", icon: Calculator, title: "Calculate what fits", text: "Enter your real income and commitments. We turn messy numbers into clear targets." },
    { no: "02", icon: ClipboardCheck, title: "Understand your options", text: "See the difference between EPF for the future, SOCSO for work accidents, and extra medical protection." },
    { no: "03", icon: Bookmark, title: "Save one plan", text: "Bring your decisions together in a personal plan you can review and update anytime." },
  ];
  return (
    <section id="how-it-works" className="section how-section">
      <div className="container">
        <div className="section-head split-head"><div><SectionEyebrow icon={Sparkles}>{copy.howEyebrow}</SectionEyebrow><h2>{copy.howTitle}<br /><em>{copy.howAccent}</em></h2></div><p>{language === "bm" ? "Tak perlu faham semua hari ini. Pilih satu langkah yang paling dekat dengan hidup anda sekarang." : "You do not need to understand everything today. Choose the next step that fits your life right now."}</p></div>
        <div className="steps-grid">{items.map((item) => <div className="step-card" key={item.no}><div className="step-top"><span className="step-no">{item.no}</span><MiniIcon icon={item.icon} /></div><h3>{item.title}</h3><p>{item.text}</p><ChevronRight className="step-arrow" size={18} /></div>)}</div>
      </div>
    </section>
  );
}

function DashboardSnapshot({ onOpenPlan, profile, calculatorInputs, completedPlanItems, isAuthenticated, language }: { onOpenPlan: () => void; profile: { name: string; workerType: string }; calculatorInputs: CalculatorInputs; completedPlanItems: number; isAuthenticated: boolean; language: Language }) {
  const income = typeof calculatorInputs.epfIncome === "number" && calculatorInputs.epfIncome > 0 ? calculatorInputs.epfIncome : null;
  const contribution = typeof calculatorInputs.epfContribution === "number" && calculatorInputs.epfContribution > 0 ? calculatorInputs.epfContribution : null;
  const hasData = Boolean(income || contribution || completedPlanItems || profile.workerType);
  const displayName = profile.name || localized("anda", "you");
  return (
    <section className="snapshot-section">
      <div className="container snapshot-grid">
        <div className="snapshot-intro"><SectionEyebrow icon={BarChart3}>{language === "bm" ? "Satu pandangan yang tenang" : "A calmer view"}</SectionEyebrow><h2>{language === "bm" ? "Ini bukan tentang" : "This is not about"}<br /><span>{language === "bm" ? "jadi kaya cepat." : "getting rich quick."}</span></h2><p>{language === "bm" ? "Ini tentang tahu apa yang boleh anda kawal — walaupun pendapatan berubah-ubah setiap bulan." : "It is about knowing what you can control, even when your income changes from month to month."}</p><button className="text-link" onClick={onOpenPlan}>{isAuthenticated ? `Lihat plan ${displayName}` : "Log masuk untuk lihat plan"} <ArrowUpRight size={16} /></button></div>
        <div className="snapshot-card">
          <div className="snapshot-card-head"><div><span className="muted-label">{isAuthenticated ? localized("PLAN AKAUN ANDA", "YOUR ACCOUNT PLAN") : localized("PLAN PERIBADI", "PERSONAL PLAN")}</span><h3>{isAuthenticated ? `${displayName}, ${localized("profil anda", "your profile")}` : localized("Log masuk untuk mula", "Log in to get started")}</h3></div><span className={`saved-tag ${hasData ? "" : "empty"}`}>{hasData ? <><Check size={13} /> {localized("Disimpan", "Saved")}</> : localized("Belum ada data", "No data yet")}</span></div>
          {hasData ? <><div className="snapshot-main"><div className="snapshot-ring"><div><span>RM</span><strong>{income ? income.toLocaleString("ms-MY") : "—"}</strong><small>{income ? "pendapatan" : "belum dikira"}</small></div></div><div className="snapshot-details"><div><span className="detail-label"><i className="dot dot-mint" /> Masa depan</span><strong>{contribution ? formatRM(contribution) : "Belum disimpan"} {contribution && <small>{localized("/ bulan", "/ month")}</small>}</strong><em>{contribution ? "EPF i-Saraan / Plus" : "Kira EPF untuk tambah"}</em></div><div><span className="detail-label"><i className="dot dot-coral" /> Perlindungan</span><strong>{completedPlanItems > 0 ? "Disemak" : "Belum disimpan"}</strong><em>SOCSO / Takaful mengikut pilihan anda</em></div><div><span className="detail-label"><i className="dot dot-blue" /> Simpanan tenang</span><strong>{typeof calculatorInputs.emergencyProgress === "number" ? formatRM(calculatorInputs.emergencyProgress) : "Belum disimpan"}</strong><em>Dana kecemasan anda</em></div></div></div><div className="snapshot-progress"><div className="progress-header"><span>{localized("Perjalanan plan", "Plan progress")}</span><b>{completedPlanItems} daripada 4 langkah</b></div><div className="progress-track"><span style={{ width: `${(completedPlanItems / 4) * 100}%` }} /></div></div></> : <div className="snapshot-empty"><UserRound size={22} /><b>{localized("Ruang ini masih kosong", "This space is empty")}</b><p>{localized("Data profil dan kiraan akan muncul di sini selepas anda log masuk dan menyimpan pilihan anda.", "Your profile and calculation data will appear here after you log in and save your choices.")}</p></div>}
        </div>
      </div>
    </section>
  );
}

function ToolTabs({ active, setActive, language }: { active: ToolKey; setActive: (key: ToolKey) => void; language: Language }) {
  const tabs: { key: ToolKey; label: string; icon: typeof Landmark }[] = [
    { key: "epf", label: "EPF", icon: Landmark },
    { key: "socso", label: "SOCSO", icon: ShieldCheck },
    { key: "insurance", label: language === "bm" ? "Insurans" : "Insurance", icon: HeartPulse },
    { key: "emergency", label: language === "bm" ? "Dana kecemasan" : "Emergency fund", icon: PiggyBank },
  ];
  return <div className="tool-tabs" role="tablist">{tabs.map(({ key, label, icon: Icon }) => <button role="tab" aria-selected={active === key} className={active === key ? "active" : ""} key={key} onClick={() => setActive(key)}><Icon size={16} /> <span>{label}</span></button>)}</div>;
}

function EpfCalculator({ onSave, initialInputs, onSync }: { onSave: (label: string) => void; initialInputs: CalculatorInputs; onSync: SyncInputs }) {
  const [income, setIncome] = useState(Number(initialInputs.epfIncome ?? 2000));
  const [age, setAge] = useState(Number(initialInputs.epfAge ?? 28));
  const [isPlus, setIsPlus] = useState(Boolean(initialInputs.epfIsPlus ?? true));
  const [contribution, setContribution] = useState(Number(initialInputs.epfContribution ?? 209));
  const years = Math.max(0, 60 - age);
  const recommended = Math.max(60, Math.min(209, Math.round((income * 0.1) / 10) * 10));
  const annualMatch = isPlus ? 600 : 500;
  const lifetimeCap = isPlus ? 6000 : 5000;
  const matchYears = Math.min(years, 10);
  const ownPrincipal = contribution * 12 * years;
  const annualMatchPaid = Math.min(lifetimeCap, annualMatch * matchYears);
  const ownFuture = futureValueMonthly(contribution, 0.045, years);
  const govFuture = Array.from({ length: matchYears }, (_, index) => annualMatch * Math.pow(1.045, Math.max(0, years - index - 1))).reduce((a, b) => a + b, 0);
  const dividends = Math.max(0, ownFuture + govFuture - ownPrincipal - annualMatchPaid);
  const total = ownFuture + govFuture;

  useEffect(() => {
    setContribution((current) => current === 209 || current === 0 ? recommended : current);
  }, [recommended]);

  return (
    <div className="calculator-shell calculator-hover-card epf-hover-card">
      <span className="hover-hint"><Sparkles size={12} /> {localized("Kiraan responsif", "Responsive calculation")}</span>
      <div className="calculator-intro"><div><SectionEyebrow icon={Landmark}>{localized("EPF • Simpanan masa depan", "EPF • Future savings")}</SectionEyebrow><h2>{localized("Berapa patut saya", "How much should I")}<br /><em>{localized("mula simpan?", "start saving?")}</em></h2><p>{localized("Kami cadangkan angka yang cukup realistik untuk pendapatan anda — bukan angka ideal yang susah nak ikut.", "We suggest a realistic amount for your income — not an ideal number that is hard to follow.")}</p></div><div className="source-chip"><BadgeCheck size={15} /> {localized("Rujukan EPF 2026", "EPF 2026 reference")}</div></div>
      <div className="eligibility-box"><div className="eligibility-copy"><span className="success-mark"><Check size={17} /></span><div><b>{localized("Anda mungkin layak untuk i-Saraan Plus", "You may be eligible for i-Saraan Plus")}</b><p>{localized("Untuk pemandu e-hailing & p-hailing yang bekerja sendiri, sehingga RM600 matching setahun.", "For self-employed e-hailing and p-hailing drivers, with up to RM600 matching per year.")}</p></div></div><button className="toggle" onClick={() => { const next = !isPlus; setIsPlus(next); onSync({ epfIsPlus: next }); }} aria-pressed={isPlus}><span className={isPlus ? "on" : ""} /><small>{isPlus ? "Plus" : localized("Asas", "Basic")}</small></button></div>
      <div className="input-grid three">
        <label className="field"><span>{localized("Pendapatan purata bulanan", "Average monthly income")}</span><div className="input-wrap"><span>RM</span><input type="number" min={500} step={100} value={income} onChange={(e) => { const value = Number(e.target.value) || 0; setIncome(value); onSync({ epfIncome: value }); }} /><span className="input-suffix">{localized("/ bulan", "/ month")}</span></div></label>
        <label className="field"><span>{localized("Umur sekarang", "Current age")}</span><div className="input-wrap"><input type="number" min={18} max={60} value={age} onChange={(e) => { const value = Math.min(60, Math.max(18, Number(e.target.value) || 18)); setAge(value); onSync({ epfAge: value }); }} /><span className="input-suffix">{localized("tahun", "years")}</span></div></label>
        <div className="field"><span>{localized("Cadangan untuk mula", "Suggested starting amount")}</span><div className="recommend-box"><strong>{formatRM(recommended)}</strong><small>{localized("/ bulan", "/ month")}</small></div></div>
      </div>
      <div className="slider-field"><div className="slider-header"><span>{localized("Laraskan jumlah caruman anda", "Adjust your contribution")}</span><strong>{formatRM(contribution)} <small>{localized("/ bulan", "/ month")}</small></strong></div><input className="range" type="range" min="60" max="800" step="10" value={contribution} onChange={(e) => { const value = Number(e.target.value); setContribution(value); onSync({ epfContribution: value }); }} /><div className="range-labels"><span>RM 60</span><span>RM 800</span></div></div>
      <div className="epf-result"><div className="result-title"><div><span className="muted-label">{localized("ANGGARAN PADA UMUR 60", "ESTIMATE AT AGE 60")}</span><h3>{formatRM(total)}</h3></div><span className="illustrative"><CircleHelp size={14} /> {localized("Ilustrasi, bukan jaminan", "Illustration, not a guarantee")}</span></div><div className="result-breakdown"><div className="result-part part-mint"><span><i /> {localized("Anda masukkan", "Your contribution")}</span><strong>{formatRM(ownPrincipal)}</strong><small>{formatRM(contribution)} × 12 × {years} tahun</small></div><div className="result-part part-coral"><span><i /> {localized("Kerajaan tambah", "Government adds")}</span><strong>{formatRM(annualMatchPaid)}</strong><small>{isPlus ? "i-Saraan Plus" : "i-Saraan"} • max 10 tahun</small></div><div className="result-part part-blue"><span><i /> {localized("Dividen mungkin tambah", "Potential dividends")}</span><strong>{formatRM(dividends)}</strong><small>Andaian 4.5% setahun</small></div></div><div className="result-foot"><span><Clock3 size={14} /> {localized("Tinggal", "Remaining")} <b>{years} tahun</b> {localized("ke umur persaraan", "until retirement age")}</span><button className="button button-dark" onClick={() => onSave(`EPF ${formatRM(contribution)}/bulan`)}>{localized("Simpan kiraan", "Save calculation")} <Bookmark size={15} /></button></div></div>
      <div className="checklist"><div className="checklist-title"><ClipboardCheck size={17} /><b>{localized("Sebelum daftar, sediakan ini", "Before registering, prepare these")}</b></div><span><Check size={13} /> MyKad</span><span><Check size={13} /> Nombor EPF (jika ada)</span><span><Check size={13} /> Akaun bank</span><button className="external-link" onClick={() => openExternal("https://www.kwsp.gov.my/member/voluntary-contribution/i-saraan")}>Daftar di EPF <ExternalLink size={14} /></button></div>
    </div>
  );
}

function SocsoCalculator({ onSave, initialInputs, onSync }: { onSave: (label: string) => void; initialInputs: CalculatorInputs; onSync: SyncInputs }) {
  const [income, setIncome] = useState(Number(initialInputs.socsoIncome ?? 2000));
  const closest = socsoTiers.reduce((prev, curr) => Math.abs(Number(curr.label.replace(/[^0-9]/g, "")) - income) < Math.abs(Number(prev.label.replace(/[^0-9]/g, "")) - income) ? curr : prev);
  const [selected, setSelected] = useState(String(initialInputs.socsoTier ?? closest.label));
  const tier = socsoTiers.find((item) => item.label === selected) ?? socsoTiers[0];
  useEffect(() => setSelected(closest.label), [closest.label]);
  return (
    <div className="calculator-shell calculator-hover-card socso-hover-card">
      <span className="hover-hint"><Sparkles size={12} /> Tier boleh ubah</span>
      <div className="calculator-intro"><div><SectionEyebrow icon={ShieldCheck}>SOCSO • Lindung Kendiri</SectionEyebrow><h2>Kalau berlaku apa-apa<br /><em>masa bekerja?</em></h2><p>SKSPS bantu lindungi anda daripada kemalangan kerja, penyakit pekerjaan, hilang upaya dan kematian.</p></div><div className="source-chip coral-chip"><BadgeCheck size={15} /> Rujukan PERKESO</div></div>
      <div className="socso-callout"><div className="callout-icon"><ShieldCheck size={20} /></div><div><b>Ini bukan simpanan EPF.</b><p>EPF bina duit untuk hari tua. Lindung Kendiri bantu bila anda cedera atau tak boleh bekerja.</p></div></div>
      <div className="input-grid two"><label className="field"><span>{localized("Pendapatan bulanan untuk rujukan", "Monthly income for reference")}</span><div className="input-wrap"><span>RM</span><input type="number" min={1050} step={100} value={income} onChange={(e) => { const value = Number(e.target.value) || 0; setIncome(value); onSync({ socsoIncome: value }); }} /></div></label><label className="field"><span>{localized("Pilih tier pendapatan dilindungi", "Choose protected income tier")}</span><select className="select-field" value={selected} onChange={(e) => { const value = e.target.value; setSelected(value); onSync({ socsoTier: value }); }}>{socsoTiers.map((item) => <option key={item.label} value={item.label}>{item.label} / bulan</option>)}</select></label></div>
      <div className="tier-table"><div className="tier-table-head"><span>Tier PERKESO</span><span>{localized("Premium tahunan", "Annual premium")}</span><span>{localized("Premium bulanan", "Monthly premium")}</span></div>{socsoTiers.map((item) => <button key={item.label} className={`tier-row ${item.label === selected ? "selected" : ""}`} onClick={() => { setSelected(item.label); onSync({ socsoTier: item.label }); }}><span><i className="radio-dot" /> {item.label} <small>{localized("pendapatan diinsuranskan", "insured income")}</small></span><b>{formatRM(item.premium, 2)}</b><span>{formatRM(item.premium / 12, 2)} <ChevronRight size={15} /></span></button>)}</div>
      <div className="benefits-grid"><div className="benefit-card"><HeartPulse size={18} /><span>{localized("Rawatan perubatan", "Medical treatment")}</span><b>{localized("Disediakan", "Provided")}</b><small>Untuk kecederaan pekerjaan</small></div><div className="benefit-card"><Wallet size={18} /><span>{localized("Hilang upaya sementara", "Temporary disability")}</span><b>{formatRM(tier.daily)} / hari</b><small>Indikatif ikut tier dipilih</small></div><div className="benefit-card"><UserRound size={18} /><span>{localized("Faedah tanggungan", "Dependent benefits")}</span><b>{tier.death}</b><small>Semak syarat rasmi</small></div></div>
      <div className="result-foot socso-foot"><span><CircleHelp size={14} /> Premium & faedah adalah <b>indikatif</b>. Semak jadual rasmi semasa.</span><button className="button button-dark" onClick={() => onSave(`SKSPS ${formatRM(tier.premium, 2)}/tahun`)}>Simpan tier <Bookmark size={15} /></button></div>
      <div className="checklist"><div className="checklist-title"><ClipboardCheck size={17} /><b>{localized("Sebelum daftar, sediakan ini", "Before registering, prepare these")}</b></div><span><Check size={13} /> MyKad</span><span><Check size={13} /> Maklumat pekerjaan</span><button className="external-link" onClick={() => openExternal("https://www.perkeso.gov.my/pekerjaan-sendiri.html")}>Daftar di PERKESO <ExternalLink size={14} /></button></div>
    </div>
  );
}

function InsuranceComparison({ selected, setSelected, onSave }: { selected: string; setSelected: (id: string) => void; onSave: (label: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("coverage");
  const filteredProducts = insuranceProducts
    .filter((product) => filter === "all" || (filter === "medical" ? product.id === "aia" : product.id !== "aia"))
    .slice()
    .sort((a, b) => sort === "premium" ? a.premiumValue - b.premiumValue : b.coverageScore - a.coverageScore);
  return (
    <div id="comparison" className="calculator-shell insurance-shell">
      <div className="calculator-intro"><div><SectionEyebrow icon={HeartPulse}>Insurans / Takaful • Banding dengan tenang</SectionEyebrow><h2>Pilih perlindungan yang<br /><em>melengkapkan anda.</em></h2><p>Jika SKSPS sudah lindungi kemalangan kerja, lihat pilihan medikal yang boleh isi ruang kosong — bukan bayar dua kali.</p></div><div className="source-chip mint-chip"><LockKeyhole size={15} /> Bukan ejen insurans</div></div>
      <div className="recommend-banner"><span className="recommend-star"><Sparkles size={16} /></span><div><b>Logik untuk anda</b><p>Mulakan dengan perlindungan medikal dahulu kerana SKSPS sudah fokus kepada kemalangan semasa bekerja.</p></div><span className="recommend-pill">Padanan terbaik</span></div>
      <div className="comparison-controls"><div className="filter-group"><SlidersHorizontal size={14} /><span>Penapis:</span><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>{localized("Semua", "All")}</button><button className={filter === "medical" ? "active" : ""} onClick={() => setFilter("medical")}>{localized("Fokus medikal", "Medical focus")}</button><button className={filter === "accident" ? "active" : ""} onClick={() => setFilter("accident")}>{localized("Kemalangan / rider", "Accident / rider")}</button></div><label className="sort-control"><ArrowDownUp size={14} /><span>Susun</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="coverage">{localized("Coverage paling luas", "Broadest coverage")}</option><option value="premium">{localized("Premium terendah", "Lowest premium")}</option></select></label></div><div className="comparison-table-wrap"><div className="comparison-labels"><span>Produk rujukan</span><span>Premium</span><span>Fokus perlindungan</span><span>Hospital</span><span>Status</span><span /></div>{filteredProducts.map((product) => { const Icon = product.icon; const isSelected = selected === product.id; return <button key={product.id} className={`comparison-row ${isSelected ? "selected" : ""}`} onClick={() => setSelected(product.id)}><span className="product-cell"><span className={`product-icon ${product.tone}`}><Icon size={17} /></span><span><b>{product.name}</b><small>{product.short}</small></span></span><span className="table-value"><strong>RM {product.premiumValue}*</strong><small className="table-subnote">anggaran bulanan</small></span><span className="table-value">{product.coverage}</span><span className="table-value">{product.hospital}</span><span className="table-value"><span className={`status-pill ${isSelected ? "chosen" : "pending"}`}>{isSelected ? <><Check size={12} /> Dipilih</> : product.tag}</span></span><span className="row-chevron"><ChevronRight size={17} /></span></button> })}</div>
      <div className="rubric-note"><CircleHelp size={15} /><p><b>Kenapa ada “semak”?</b> Harga contoh di atas hanyalah anggaran prototaip; jumlah perlindungan dan proses tuntutan berubah mengikut produk. Kami hanya tunjukkan maklumat yang perlu disahkan daripada quote / PDS semasa sebelum anda membuat keputusan.</p></div>
      <div className="insurance-actions"><button className="button button-dark" onClick={() => onSave(`Insurans: ${insuranceProducts.find((p) => p.id === selected)?.name}`)}>Simpan pilihan <Bookmark size={15} /></button><button className="text-link" onClick={() => openExternal("https://www.mycoverage.my/")}>Semak dengan penyedia <ExternalLink size={15} /></button><span className="small-disclaimer"><LockKeyhole size={13} /> Kami bukan ejen / penasihat kewangan.</span></div>
    </div>
  );
}

function EmergencyBuilder({ onSave, initialInputs, onSync }: { onSave: (label: string) => void; initialInputs: CalculatorInputs; onSync: SyncInputs }) {
  const [expenses, setExpenses] = useState(Number(initialInputs.emergencyExpenses ?? 1500));
  const [income, setIncome] = useState(Number(initialInputs.emergencyIncome ?? 2000));
  const [horizon, setHorizon] = useState(Number(initialInputs.emergencyHorizon ?? 6));
  const [regular, setRegular] = useState(Boolean(initialInputs.emergencyRegular ?? false));
  const [progress, setProgress] = useState(Number(initialInputs.emergencyProgress ?? 0));
  const safeExpenses = Number.isFinite(expenses) && expenses > 0 ? expenses : 0;
  const safeIncome = Number.isFinite(income) && income > 0 ? income : 0;
  const target = safeExpenses * horizon;
  const saveRate = regular ? 0.15 : 0.12;
  const monthlySave = Math.max(50, Math.round((safeIncome * saveRate) / 10) * 10);
  const remaining = Math.max(0, target - progress);
  const monthsRemaining = remaining === 0 ? 0 : Math.ceil(remaining / monthlySave);
  const progressPct = target > 0 ? Math.min(100, Math.max(0, (progress / target) * 100)) : 0;
  useEffect(() => {
    setProgress((current) => Math.min(Math.max(0, current), target));
  }, [target]);
  const vehicles = [
    { icon: Landmark, name: "Tabung Haji", tag: "Mudah akses", tone: "mint", pro: "Boleh keluarkan bila perlu", con: "Pulangan bukan fokus utama" },
    { icon: BarChart3, name: "ASB", tag: "Jika layak", tone: "blue", pro: "Sesuai untuk simpanan berkembang", con: "Semak masa pengeluaran" },
    { icon: Banknote, name: "Akaun simpanan BSN", tag: "Paling cair", tone: "coral", pro: "Akses ATM / perbankan", con: "Pulangan biasanya lebih rendah" },
  ];
  return (
    <div className="calculator-shell emergency-shell">
      <div className="calculator-intro"><div><SectionEyebrow icon={PiggyBank}>{localized("Dana kecemasan • Simpan untuk tenang", "Emergency fund • Save for peace of mind")}</SectionEyebrow><h2>{localized("Kalau bulan depan", "What if next month")}<br /><em>{localized("tak seperti biasa?", "is not usual?")}</em></h2><p>{localized("Bina kusyen kecil untuk minyak, sewa, makan dan komitmen asas — walaupun bulan pendapatan perlahan. Sasaran mudah: mula dengan 3 bulan perbelanjaan asas, kemudian tambah sedikit demi sedikit bila pendapatan lebih baik.", "Build a small cushion for fuel, rent, food, and essentials — even during a slow month. A simple target is three months of basic expenses, then add more when you can.")}</p></div><div className="source-chip blue-chip"><Wallet size={15} /> {localized("Manual dahulu", "Manual first")}</div></div><div className="emergency-guide"><div className="guide-heading"><span className="guide-kicker">{localized("PANDUAN LANGKAH DEMI LANGKAH", "STEP-BY-STEP GUIDE")}</span><b>{localized("Mulakan dengan jumlah yang boleh kekal.", "Start with an amount you can maintain.")}</b><small>{localized("Tak perlu tunggu ada lebihan besar — yang penting konsisten dan mudah dicapai bila perlu.", "You do not need a large surplus — consistency and easy access matter most.")}</small></div><div className="guide-steps"><div><span>01</span><p><b>{localized("Kira sasaran", "Set your target")}</b><small>Darab belanja asas bulanan dengan 3, 6 atau 12 bulan.</small></p></div><div><span>02</span><p><b>{localized("Pilih amaun bulanan", "Choose a monthly amount")}</b><small>Gunakan cadangan di bawah atau mula dengan RM50–RM100 dahulu.</small></p></div><div><span>03</span><p><b>{localized("Simpan di tempat cair", "Keep it accessible")}</b><small>Pilih akaun simpanan yang selamat dan mudah dikeluarkan tanpa risiko tinggi.</small></p></div></div></div>
      <div className="input-grid three"><label className="field"><span>Perbelanjaan asas bulanan</span><div className="input-wrap"><span>RM</span><input type="number" min={500} step={100} value={expenses} onChange={(e) => { const value = Math.max(0, Number(e.target.value) || 0); setExpenses(value); onSync({ emergencyExpenses: value }); }} /></div></label><label className="field"><span>Pendapatan bulanan</span><div className="input-wrap"><span>RM</span><input type="number" min={500} step={100} value={income} onChange={(e) => { const value = Math.max(0, Number(e.target.value) || 0); setIncome(value); onSync({ emergencyIncome: value }); }} /></div></label><div className="field"><span>{localized("Pendapatan anda biasanya...", "Your income is usually...")}</span><div className="segmented"><button type="button" className={regular ? "active" : ""} onClick={() => { setRegular(true); onSync({ emergencyRegular: true }); }}>{localized("Tetap", "Steady")}</button><button type="button" className={!regular ? "active" : ""} onClick={() => { setRegular(false); onSync({ emergencyRegular: false }); }}>{localized("Berubah", "Variable")}</button></div></div></div>
      <div className="horizon-block"><span>Berapa lama nak dilindungi?</span><div className="horizon-buttons">{[3, 6, 12].map((value) => <button key={value} className={horizon === value ? "active" : ""} onClick={() => { setHorizon(value); onSync({ emergencyHorizon: value }); }}>{value} bulan{value === 6 && <b>Disaran</b>}</button>)}</div></div>
      <div className="emergency-result" aria-live="polite"><div className="target-number"><span className="muted-label">SASARAN ANDA</span><strong>{formatRM(target)}</strong><small>{horizon} bulan × {formatRM(safeExpenses)} belanja asas</small></div><div className="save-number"><span className="muted-label">CADANGAN SIMPAN</span><strong>{formatRM(monthlySave)}<small> / bulan</small></strong><span className="save-rate"><TrendingUp size={14} /> {Math.round(saveRate * 100)}% pendapatan</span></div><div className="time-number"><span className="muted-label">BAKI KE SASARAN</span><strong>{monthsRemaining === 0 ? "Siap" : `${monthsRemaining}`} <small>{monthsRemaining === 0 ? "" : "bulan lagi"}</small></strong><span>{monthsRemaining === 0 ? "Sasaran telah dicapai" : `${formatRM(remaining)} lagi jika konsisten`}</span></div></div>
      <div className="fund-tracker"><div className="tracker-head"><div><span className="muted-label">CHECK-IN SIMPANAN</span><h3>{formatRM(progress)} <small>daripada {formatRM(target)}</small></h3></div><span className="tracker-percent">{Math.round(progressPct)}%</span></div><div className="progress-track large"><span style={{ width: `${progressPct}%` }} /></div><div className="tracker-input"><label>{localized("Sudah berapa terkumpul?", "How much have you saved?")}</label><div className="input-wrap"><span>RM</span><input type="number" min={0} max={target} step={50} value={progress} onChange={(e) => { const value = Math.min(target, Math.max(0, Number(e.target.value) || 0)); setProgress(value); onSync({ emergencyProgress: value }); }} /></div><button className="button button-dark" onClick={() => { onSave(`Dana kecemasan ${formatRM(progress)} daripada ${formatRM(target)}`); toast.success("Check-in disimpan pada peranti ini."); }}>Simpan check-in <Check size={15} /></button></div></div>
      <div className="vehicles-block"><div className="vehicles-title"><div><span className="muted-label">TEMPAT YANG MUDAH DICAPAI</span><h3>Letak dana kecemasan di sini</h3></div><span className="tiny-note"><LockKeyhole size={13} /> Bukan pelaburan jangka panjang</span></div><div className="vehicles-grid">{vehicles.map(({ icon: Icon, name, tag, tone, pro, con }) => <div className="vehicle-card" key={name}><div className={`vehicle-icon ${tone}`}><Icon size={17} /></div><div className="vehicle-name"><b>{name}</b><span>{tag}</span></div><p><strong>+ </strong>{pro}<br /><strong>− </strong>{con}</p></div>)}</div></div>
    </div>
  );
}

function VideoModal({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const durationSeconds = 75;
  const voiceRef = useRef<HTMLAudioElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  const startAudio = () => {
    const voice = voiceRef.current;
    const music = musicRef.current;
    if (voice) { voice.volume = muted ? 0 : 1; void voice.play().catch(() => undefined); }
    if (music) { music.volume = muted ? 0 : 0.18; void music.play().catch(() => undefined); }
  };

  useEffect(() => {
    if (playing) startAudio();
    else { voiceRef.current?.pause(); musicRef.current?.pause(); }
    return () => { voiceRef.current?.pause(); musicRef.current?.pause(); };
  }, [playing]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!playing) return;
      setProgress((current) => {
        if (current >= durationSeconds) { setPlaying(false); return durationSeconds; }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (voiceRef.current) voiceRef.current.volume = muted ? 0 : 1;
    if (musicRef.current) musicRef.current.volume = muted ? 0 : 0.18;
  }, [muted]);

  const elapsed = `${Math.floor(progress / 60).toString().padStart(2, "0")}:${(progress % 60).toString().padStart(2, "0")}`;
  const togglePlayback = () => {
    if (progress >= durationSeconds) setProgress(0);
    if (!playing) startAudio();
    setPlaying((current) => !current);
  };

  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Video pengenalan Lindung Gig">
    <div className="video-modal">
      <audio ref={voiceRef} src="/manus-storage/lindung-gig-native-bm-voice_bbb8ac76.wav" preload="auto" aria-label="AI avatar voiceover Bahasa Malaysia" />
      <audio ref={musicRef} src="/manus-storage/lindung-gig-music_7d06c4d3.wav" preload="auto" loop aria-label="Muzik latar instrumental" />
      <button className="modal-close" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
      <div className={`video-frame ${playing ? "is-playing" : "is-paused"}`}>
        <div className="video-grain" />
        <div className="avatar-head"><span className="avatar-hair" /><span className="avatar-face"><i /><i /><b /></span></div>
        <div className="video-caption"><span>{playing ? "AI AVATAR • BM SEMULA JADI • SEDANG DIMAINKAN" : progress >= durationSeconds ? "VIDEO SELESAI" : "AI AVATAR • DIJEDA"}</span><h3>“Kalau bulan ni tak menentu,<br />macam mana masa depan nak terjaga?”</h3><p>Bahasa Malaysia yang lebih dekat dengan cara komuniti rider, courier dan freelancer berbual — mudah dikongsi di WhatsApp.</p></div>
        <button className="video-play" onClick={togglePlayback} aria-label={playing ? "Jeda video" : "Mainkan video"}>{playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}</button>
        <button className="video-volume" onClick={() => setMuted((current) => !current)} aria-label={muted ? "Hidupkan audio" : "Senyapkan audio"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
        <div className="video-progress-wrap"><div className="video-progress-track"><span style={{ width: `${(progress / durationSeconds) * 100}%` }} /></div><span>{elapsed} / 01:15</span></div>
        {progress >= durationSeconds && <button className="video-replay" onClick={() => { setProgress(0); setPlaying(true); }}><RotateCcw size={13} /> Main semula</button>}
      </div>
      <div className="video-modal-foot"><div><b>{playing ? "AI avatar + muzik sedang berjalan" : "Tekan play untuk sambung"}</b><span>BM yang lebih semula jadi • topik EPF, SOCSO dan dana kecemasan • siap untuk dikongsi di WhatsApp.</span></div><button className="button whatsapp-button" onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent("Kalau pendapatan bulan ni tak menentu, jom susun pelan kewangan dengan Lindung Gig: ")}${encodeURIComponent(window.location.href)}`, "_blank"); toast.success("WhatsApp dibuka untuk dikongsi."); }}><Share2 size={16} /> Kongsi di WhatsApp</button></div>
    </div>
  </div>;
}
function AccountSettings({ profile, onSave, onExport, onDelete, saving, deleting }: { profile: { name: string; email: string; workerType: string }; onSave: (profile: { name: string; workerType: string }) => void; onExport: () => void; onDelete: () => void; saving: boolean; deleting: boolean }) {
  const [name, setName] = useState(profile.name);
  const [workerType, setWorkerType] = useState(profile.workerType);
  useEffect(() => { setName(profile.name); setWorkerType(profile.workerType); }, [profile.name, profile.workerType]);
  return <div className="account-settings"><div className="settings-head"><div><span className="muted-label">{localized("AKAUN & PRIVASI", "ACCOUNT & PRIVACY")}</span><h3>{localized("Profil peribadi anda", "Your personal profile")}</h3><p>{profile.email}</p></div><span className="account-lock"><LockKeyhole size={15} /> Akaun anda sahaja</span></div><div className="settings-grid"><label className="field"><span>{localized("Nama paparan", "Display name")}</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama anda" /></label><label className="field"><span>{localized("Jenis kerja", "Worker type")}</span><select value={workerType} onChange={(e) => setWorkerType(e.target.value)}><option value="">{localized("Pilih jenis kerja", "Choose worker type")}</option><option value="Rider / penghantar">Rider / penghantar</option><option value="Pemandu e-hailing">Pemandu e-hailing</option><option value="Freelancer">Freelancer</option><option value="P-hailing / courier">P-hailing / courier</option><option value="Lain-lain">Lain-lain</option></select></label></div><div className="settings-actions"><button className="button button-dark" disabled={saving || !name.trim() || !workerType} onClick={() => onSave({ name: name.trim(), workerType })}><Save size={15} /> {saving ? "Menyimpan..." : "Simpan profil"}</button><button className="privacy-action" onClick={onExport}><Download size={15} /> Muat turun data</button><button className="privacy-danger" disabled={deleting} onClick={onDelete}><Trash2 size={15} /> {deleting ? "Memadam..." : "Padam akaun"}</button></div><small className="settings-note">Muat turun data menghasilkan fail JSON. Pemadaman akaun memadam profil, kiraan tersimpan dan plan anda secara kekal.</small></div>;
}

function AccountProfileSummary({ profile, savedCount, completedPlanItems, hasCalculatorData }: { profile: { name: string; email: string; workerType: string }; savedCount: number; completedPlanItems: number; hasCalculatorData: boolean }) {
  return <div className="account-profile-summary"><div className="summary-avatar"><UserRound size={20} /></div><div className="summary-identity"><span className="muted-label">{localized("PROFIL AKAUN", "ACCOUNT PROFILE")}</span><h3>{profile.name || "Nama belum diisi"}</h3><p>{profile.email || "Emel akaun tidak tersedia"}</p></div><div className="summary-facts"><div><span>{localized("Jenis kerja", "Worker type")}</span><b>{profile.workerType || "Belum dipilih"}</b></div><div><span>{localized("Data kiraan", "Calculation data")}</span><b>{hasCalculatorData ? "Ada simpanan" : "Belum disimpan"}</b></div><div><span>Plan</span><b>{completedPlanItems}/4 langkah</b></div></div></div>;
}

function PlanSection({ savedItems, onReset, planItems, completedPlanItems, isAuthenticated, onLogin, displayName }: { savedItems: string[]; onReset: () => void; planItems: { label: string; key: string; done: boolean }[]; completedPlanItems: number; isAuthenticated: boolean; onLogin: () => void; displayName: string }) {
  const [qrOpen, setQrOpen] = useState(false);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/#plan` : "https://lindunggig.my/#plan";
  return (
    <section id="plan" className="section plan-section">
      <div className="container">
        <div className="plan-header">
          <div><SectionEyebrow icon={Bookmark}>My Safety Net Plan</SectionEyebrow><h2>{localized("Plan anda,", "Your plan,")} <em>{localized("di satu tempat.", "in one place.")}</em></h2><p>{isAuthenticated ? ` ${localized("Simpan keputusan penting anda,", "Save your key decisions,")} ${displayName}, ${localized("pada akaun peribadi anda.", "to your personal account.")}` : localized("Log masuk untuk menyimpan kiraan dan menyegerakkan plan merentas peranti.", "Log in to save calculations and sync your plan across devices.")}</p></div>
          <div className="privacy-note"><LockKeyhole size={15} /><span>{isAuthenticated ? localized("Plan disimpan secara peribadi", "Plan saved privately") : "Belum disimpan"}<br /><b>{isAuthenticated ? localized("Akaun anda sahaja", "Your account only") : localized("Log masuk untuk simpan", "Log in to save")}</b></span></div>
        </div>
        <div className="plan-grid">
          <div className="plan-status-card">{!isAuthenticated && <div className="auth-plan-banner"><LockKeyhole size={15} /><span><b>{localized("Plan ini hanya untuk akaun anda.", "This plan belongs to your account only.")}</b><small>{localized("Log masuk supaya kiraan anda tidak bercampur dengan pengguna lain.", "Log in so your calculations stay separate from other users.")}</small></span><button onClick={onLogin}>Log masuk</button></div>}
            <div className="plan-status-top"><span className="status-orb"><ShieldCheck size={20} /></span><div><span className="muted-label">{localized("STATUS PLAN", "PLAN STATUS")}</span><h3>{completedPlanItems ? localized("Anda sedang membina", "You are building it") : localized("Belum mula lagi", "Not started yet")}</h3></div><span className="plan-score">{completedPlanItems}/4</span></div>
            <div className="plan-checks">{planItems.map((item, i) => <div key={item.label} className={item.done ? "done" : ""}><span>{item.done ? <Check size={13} /> : i + 1}</span><b>{item.label}</b><small>{item.done ? localized("Disimpan", "Saved") : localized("Belum disimpan", "Not saved")}</small></div>)}</div>
            <div className="plan-actions"><button className="button button-primary" onClick={() => isAuthenticated ? scrollToId("tools") : onLogin()}>{isAuthenticated ? localized("Sambung kiraan", "Continue calculating") : localized("Log masuk untuk simpan", "Log in to save")} <ArrowUpRight size={16} /></button>{savedItems.length > 0 && <button className="reset-button" onClick={onReset}><RotateCcw size={14} /> Reset</button>}</div>
          </div>
          <div className="saved-list">
            <div className="saved-list-head"><h3>{localized("Catatan anda", "Your notes")}</h3><span>{savedItems.length ? localized("Paling terkini", "Most recent") : localized("Akan muncul di sini", "They will appear here")}</span></div>
            {savedItems.length ? savedItems.map((item, index) => <div className="saved-item" key={`${item}-${index}`}><span className="saved-bullet"><Check size={13} /></span><span>{item}</span><small>{localized("Baru disimpan", "Recently saved")}</small></div>) : <div className="empty-plan"><Bookmark size={22} /><b>{localized("Plan yang terasa macam anda", "A plan that feels like yours")}</b><p>{localized("Kira satu modul di atas, kemudian tekan “Simpan kiraan”.", "Complete a calculator above, then select “Save calculation”.")}</p></div>}
            <div className="share-plan"><Share2 size={16} /><span>{localized("Kongsi ringkasan plan dengan keluarga?", "Share your plan summary with family?")}</span><button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent("Saya sedang bina safety net kewangan saya dengan Lindung Gig. Jom cuba: ")}${encodeURIComponent(shareUrl)}`, "_blank"); toast.success("WhatsApp dibuka untuk dikongsi."); }}>WhatsApp <ArrowUpRight size={14} /></button><button className="qr-share-button" onClick={() => setQrOpen(true)}><QrCode size={14} /> QR code</button></div>
          </div>
        </div>
      </div>
      {qrOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="QR code plan"><div className="qr-modal"><button className="modal-close" onClick={() => setQrOpen(false)} aria-label="Tutup"><X size={18} /></button><div className="qr-icon"><QrCode size={20} /></div><h3>Kongsi plan anda</h3><p>Imbas dengan telefon lain untuk buka ringkasan plan ini.</p><img className="qr-image" src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`} alt="QR code untuk membuka Lindung Gig" /><span className="qr-url">{shareUrl}</span><button className="button button-dark" onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success("Pautan disalin."); }}>Salin pautan <Share2 size={15} /></button></div></div>}
    </section>
  );
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const accountQuery = trpc.account.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const planQuery = trpc.safetyPlan.get.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const savePlanMutation = trpc.safetyPlan.save.useMutation({ onSuccess: () => planQuery.refetch() });
  const profileMutation = trpc.account.profile.useMutation({ onSuccess: () => accountQuery.refetch() });
  const calculatorMutation = trpc.account.calculatorInputs.useMutation();
  const deleteMutation = trpc.account.delete.useMutation({ onSuccess: () => { void logout(); window.location.href = "/auth"; } });
  const [activeTool, setActiveTool] = useState<ToolKey>("epf");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState("aia");
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem("lindung-gig-language") === "en" ? "en" : "bm");
  const [calculatorInputs, setCalculatorInputs] = useState<CalculatorInputs>({});
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const syncTimer = useRef<number | null>(null);
  const profile = { name: String(accountQuery.data?.profile?.name || user?.name || user?.email?.split("@")[0] || ""), email: String(accountQuery.data?.profile?.email || user?.email || ""), workerType: String(accountQuery.data?.profile?.workerType || "") };
  const displayName = profile.name || localized("anda", "you");
  const copy = uiCopy[language];
  currentLanguage = language;
  const toggleLanguage = () => setLanguage((current) => { const next = current === "bm" ? "en" : "bm"; localStorage.setItem("lindung-gig-language", next); return next; });

  useEffect(() => {
    if (isAuthenticated && planQuery.data) setSavedItems(planQuery.data.items);
    if (isAuthenticated && accountQuery.data) {
      setCalculatorInputs(accountQuery.data.calculatorInputs as CalculatorInputs);
      if (accountQuery.data.profile?.workerType) setCalculatorInputs((current) => ({ ...current, workerType: accountQuery.data?.profile?.workerType || null }));
    }
    if (!isAuthenticated) { setSavedItems([]); setCalculatorInputs({}); }
  }, [isAuthenticated, planQuery.data, accountQuery.data]);
  useEffect(() => {
    localStorage.removeItem("lindung-gig-plan");
  }, []);
  useEffect(() => {
    if (!isAuthenticated || !accountQuery.data || new URLSearchParams(window.location.search).get("onboarding") !== "1") return;
    window.setTimeout(() => scrollToId("account-settings"), 250);
  }, [isAuthenticated, accountQuery.data]);
  const syncCalculatorInputs = (changes: CalculatorInputs) => {
    const next = { ...calculatorInputs, ...changes };
    setCalculatorInputs(next);
    if (!isAuthenticated) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => calculatorMutation.mutate(next), 500);
  };
  useEffect(() => () => { if (syncTimer.current) window.clearTimeout(syncTimer.current); }, []);
  const exportData = () => {
    if (!accountQuery.data) return;
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...accountQuery.data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "lindung-gig-data.json"; anchor.click(); URL.revokeObjectURL(url); toast.success("Data anda dimuat turun.");
  };
  const requestDeleteAccount = () => {
    if (window.confirm("Padam akaun dan semua data plan/kiraan anda secara kekal? Tindakan ini tidak boleh diundur.")) deleteMutation.mutate();
  };
  const categoryFor = (label: string) => {
    const value = label.toLowerCase();
    if (value.startsWith("epf")) return "epf";
    if (value.startsWith("socso") || value.startsWith("sksps") || value.includes("lindung kendiri")) return "socso";
    if (value.startsWith("insurans")) return "insurance";
    if (value.startsWith("dana kecemasan")) return "emergency";
    return label;
  };
  const planItems = [
    { label: "EPF i-Saraan / Plus", key: "epf" },
    { label: localized("SOCSO Lindung Kendiri", "SOCSO Self-Employed Protection"), key: "socso" },
    { label: localized("Pilihan perlindungan", "Protection choice"), key: "insurance" },
    { label: localized("Dana kecemasan", "Emergency fund"), key: "emergency" },
  ].map((item) => ({ ...item, done: savedItems.some((saved) => categoryFor(saved) === item.key) }));
  const completedPlanItems = planItems.filter((item) => item.done).length;
  const savedCount = useMemo(() => Math.min(4, savedItems.length), [savedItems]);
  const saveItem = (label: string) => {
    if (!isAuthenticated) { toast.info(localized("Log masuk untuk menyimpan plan anda.", "Log in to save your plan.")); onLogin(); return; }
    const key = categoryFor(label);
    const nextItems = [...savedItems.filter((item) => categoryFor(item) !== key), label];
    setSavedItems(nextItems);
    savePlanMutation.mutate({ items: nextItems });
    toast.success(localized("Disimpan dalam akaun anda.", "Saved to your account."));
  };
  const resetPlan = () => {
    if (!isAuthenticated) return;
    setSavedItems([]);
    savePlanMutation.mutate({ items: [] });
    toast.success("Plan direset dalam akaun anda.");
  };
  const changeTool = (key: ToolKey) => { setActiveTool(key); scrollToId("tools"); setMobileOpen(false); };

  const onLogin = () => { if (typeof window !== "undefined") window.location.href = "/auth"; };
  if (authLoading || (isAuthenticated && accountQuery.isLoading)) return <div className="auth-loading">{localized("Menyediakan ruang peribadi anda...", "Preparing your private space...")}</div>;

  return <div className="app-shell">
    <AppHeader onMenu={() => setMobileOpen(!mobileOpen)} user={user} isAuthenticated={isAuthenticated} onLogin={onLogin} onLogout={() => { void logout(); }} language={language} onLanguageChange={toggleLanguage} />
    {mobileOpen && <div className="mobile-nav"><button onClick={() => { scrollToId("how-it-works"); setMobileOpen(false); }}>{copy.how}</button><button onClick={() => changeTool("epf")}>{copy.tools}</button><button onClick={() => { scrollToId("comparison"); setMobileOpen(false); }}>{copy.comparison}</button><button onClick={() => { scrollToId("plan"); setMobileOpen(false); }}>{copy.plan}</button></div>}
    <main>
      <Hero onVideo={() => setVideoOpen(true)} displayName={displayName} language={language} />
      <div className="signal-strip"><div><span className="signal-number">1.8m</span><span>{localized("pekerja gig di Malaysia", "gig workers in Malaysia")}</span></div><i /><div><span className="signal-number">3</span><span>{localized("lapisan perlindungan", "layers of protection")}</span></div><i /><div><span className="signal-number">10 min</span><span>{localized("untuk mula dengan jelas", "to get started clearly")}</span></div></div>
      <HowItWorks language={language} />
      <DashboardSnapshot onOpenPlan={() => scrollToId("plan")} profile={profile} calculatorInputs={calculatorInputs} completedPlanItems={completedPlanItems} isAuthenticated={isAuthenticated} language={language} />
      <section id="tools" className="section tools-section"><div className="container"><div className="section-head tools-head"><div><SectionEyebrow icon={Calculator}>{copy.toolsEyebrow}</SectionEyebrow><h2>{copy.toolsTitle}<br /><em>{copy.toolsAccent}</em></h2></div><p>{language === "bm" ? "Semua kiraan dibuat terus dalam pelayar. Tiada pendaftaran diperlukan untuk mula." : "All calculations run in your browser. No registration is needed to get started."}</p></div><ToolTabs active={activeTool} setActive={setActiveTool} language={language} />{activeTool === "epf" && <EpfCalculator onSave={saveItem} initialInputs={calculatorInputs} onSync={syncCalculatorInputs} />}{activeTool === "socso" && <SocsoCalculator onSave={saveItem} initialInputs={calculatorInputs} onSync={syncCalculatorInputs} />}{activeTool === "insurance" && <InsuranceComparison selected={selectedInsurance} setSelected={(value) => { setSelectedInsurance(value); syncCalculatorInputs({ insuranceSelected: value }); }} onSave={saveItem} />}{activeTool === "emergency" && <EmergencyBuilder onSave={saveItem} initialInputs={calculatorInputs} onSync={syncCalculatorInputs} />}</div></section>
      <section className="share-section"><div className="container share-grid"><div className="share-copy"><SectionEyebrow icon={Share2}>{language === "bm" ? "Cerita ini boleh sampai jauh" : "Pass it along"}</SectionEyebrow><h2>{copy.shareTitle}<br /><em>{copy.shareAccent}</em></h2><p>{copy.shareBody}</p><button className="button button-dark" onClick={() => setVideoOpen(true)}><Play size={15} fill="currentColor" /> {language === "bm" ? "Tonton & kongsi" : "Watch & share"}</button></div><div className="share-video-teaser" onClick={() => setVideoOpen(true)} role="button" tabIndex={0}><div className="teaser-avatar"><span className="teaser-hair" /><span className="teaser-face"><i /><i /><b /></span></div><div className="teaser-copy"><span>VIDEO 01:15 • AI AVATAR BM</span><b>“Kalau bulan ni tak menentu,<br />macam mana masa depan nak terjaga?”</b></div><span className="teaser-play"><Play size={19} fill="currentColor" /></span><span className="teaser-corner">WHATSAPP READY</span></div></div></section>
      <PlanSection savedItems={savedItems.slice(0, savedCount)} planItems={planItems} completedPlanItems={completedPlanItems} isAuthenticated={isAuthenticated} onLogin={onLogin} displayName={displayName} onReset={resetPlan} />{isAuthenticated && <section id="account-settings" className="section account-section"><div className="container"><AccountProfileSummary profile={profile} savedCount={savedItems.length} completedPlanItems={completedPlanItems} hasCalculatorData={Object.keys(calculatorInputs).some((key) => key !== "workerType")} /><AccountSettings profile={profile} onSave={(value) => profileMutation.mutate(value)} onExport={exportData} onDelete={requestDeleteAccount} saving={profileMutation.isPending} deleting={deleteMutation.isPending} /></div></section>}
    </main>
    <footer className="site-footer"><div className="container footer-top"><Logo /><div className="footer-meta"><span>{copy.footer}</span><span className="footer-disclaimer"><CircleHelp size={13} /> {language === "bm" ? "Ini bukan nasihat kewangan, tawaran insurans atau portal rasmi kerajaan." : "This is not financial advice, an insurance offer, or an official government portal."}</span></div><button className="back-top" onClick={() => scrollToId("top")} aria-label={language === "bm" ? "Kembali ke atas" : "Back to top"}><ArrowUpRight size={18} /></button></div><div className="container footer-bottom"><span>© 2026 Lindung Gig • PRD Prototype v1.0</span><span>{language === "bm" ? "EPF & PERKESO: semak maklumat rasmi sebelum bertindak." : "EPF & PERKESO: check official information before taking action."}</span></div></footer>
    {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}
  </div>;
}
