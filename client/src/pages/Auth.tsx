import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";

export default function AuthPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) window.location.href = "/";
  }, [loading, user]);

  return (
    <main className="auth-shell">
      <div className="auth-orbit auth-orbit-one" />
      <div className="auth-orbit auth-orbit-two" />
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-back" href="/"><ArrowLeft size={15} /> Kembali ke Lindung Gig</a>
        <div className="auth-mark"><ShieldCheck size={25} /></div>
        <div className="auth-eyebrow"><Sparkles size={13} /> Lindung Gig • Akaun peribadi</div>
        <h1 id="auth-title">Simpan plan anda,<br /><em>ikut hidup anda.</em></h1>
        <p className="auth-lede">Log masuk untuk menyimpan kiraan EPF, SOCSO, perlindungan dan dana kecemasan secara berasingan untuk akaun anda — bukan dikongsi dengan profil lain.</p>
        <Button className="auth-login" onClick={() => startLogin()} disabled={loading}>
          {loading ? "Menyemak akaun..." : "Log masuk dengan selamat"}
          <LockKeyhole size={16} />
        </Button>
        <p className="auth-note"><LockKeyhole size={13} /> Lindung Gig menggunakan aliran pengesahan akaun Manus yang selamat. Tiada kata laluan disimpan oleh aplikasi ini.</p>
      </section>
    </main>
  );
}
