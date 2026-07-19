"use client";

import { useState, useEffect } from "react";

// ── Question bank: keyed by keyword found in module title ──────────────────
// Each entry has 3 questions. correctIndex = 0 always (we shuffle on render).
type Question = { q: string; opts: string[]; correctIndex: number; explanation: string };

const QUESTION_BANK: Record<string, Question[]> = {
  phishing: [
    {
      q: "You receive an email from 'support@paypa1.com' asking you to verify your account. What do you do?",
      opts: ["Click the link to verify — it looks official", "Report it to IT Security and delete the email", "Forward it to colleagues to warn them"],
      correctIndex: 1,
      explanation: "The domain is 'paypa1.com' (number 1, not letter l) — a classic typosquatting attack. Always report and delete."
    },
    {
      q: "An email urges you to 'act within 2 hours or your account is suspended'. This urgency is a sign of:",
      opts: ["A legitimate priority request", "Social engineering — urgency is used to bypass critical thinking", "A server maintenance notice"],
      correctIndex: 1,
      explanation: "Urgency and fear are the primary weapons in phishing. Attackers want to stop you from thinking critically."
    },
    {
      q: "Which of these email headers is a red flag?",
      opts: ["From: it@yourcompany.com", "From: it-support@yourcompanyy.com (double 'y')", "From: noreply@yourcompany.com"],
      correctIndex: 1,
      explanation: "Misspelled domains (yourcompanyy.com) are a hallmark of phishing. Always inspect the sender domain carefully."
    },
  ],
  password: [
    {
      q: "Which of these is the strongest password?",
      opts: ["Password123!", "Tr0ub4dor&3", "P@ssw0rd"],
      correctIndex: 1,
      explanation: "'Tr0ub4dor&3' uses length, mixed characters and is less predictable. Length beats complexity — aim for 14+ chars."
    },
    {
      q: "A colleague asks for your password to fix an urgent issue while you are away. You should:",
      opts: ["Give it — you trust them", "Refuse — no legitimate IT request ever requires your password", "Write it on a sticky note for them"],
      correctIndex: 1,
      explanation: "Legitimate IT staff never need your password. This is a classic social engineering vector called 'pretexting'."
    },
    {
      q: "You use the same password for your work email and personal social media. This is dangerous because:",
      opts: ["It's only a problem if someone sees you type it", "A breach on any one service exposes all your accounts (credential stuffing)", "Social media passwords are stored more securely"],
      correctIndex: 1,
      explanation: "Credential stuffing attacks take leaked passwords and automatically try them on other services. Always use unique passwords."
    },
  ],
  social: [
    {
      q: "A stranger calls claiming to be from IT and asks you to read out a code sent to your phone. You should:",
      opts: ["Read the code — they sound professional", "Hang up immediately and call IT directly on the official number", "Give only the first 3 digits"],
      correctIndex: 1,
      explanation: "This is a vishing (voice phishing) attack. Attackers impersonate IT to steal OTP codes. Always verify via official channels."
    },
    {
      q: "Someone tailgates you through a secure door claiming they left their badge at their desk. You should:",
      opts: ["Let them in — it would be rude to stop them", "Politely refuse and direct them to reception to verify identity", "Let them in if they look like an employee"],
      correctIndex: 1,
      explanation: "Physical tailgating is a real security threat. Appearance doesn't equal authorization. Always verify identity formally."
    },
    {
      q: "You find a USB drive labelled 'Salary_2026.xlsx' in the car park. What do you do?",
      opts: ["Plug it into your PC to check if it belongs to a colleague", "Hand it to IT Security without connecting it anywhere", "Leave it — it's not your problem"],
      correctIndex: 1,
      explanation: "Baiting attacks use curiosity. A USB found in a public area could contain malware that auto-executes on connection."
    },
  ],
  malware: [
    {
      q: "You notice your PC is running unusually slow and your antivirus was disabled. You should:",
      opts: ["Restart the PC and wait to see if it improves", "Immediately disconnect from the network and report to IT Security", "Re-enable the antivirus and scan"],
      correctIndex: 1,
      explanation: "Malware often disables antivirus as a first step. Disconnecting from the network prevents it spreading or exfiltrating data."
    },
    {
      q: "A website popup claims your PC is infected and asks you to call a number to fix it. This is:",
      opts: ["A genuine Windows alert — call the number immediately", "A scareware/tech-support scam — close the browser and report it", "A legitimate antivirus warning"],
      correctIndex: 1,
      explanation: "Scareware mimics system alerts to trick users into calling fraudulent 'support' numbers. Legitimate OS alerts never ask you to call a phone number."
    },
    {
      q: "Which type of file attachment is MOST likely to carry malware?",
      opts: ["A .jpg image from a known colleague", "A .exe file from an unknown sender", "A .pdf report from your manager"],
      correctIndex: 1,
      explanation: "Executable (.exe) files from unknown sources are the highest risk. Even PDFs can carry macros — never open unexpected attachments."
    },
  ],
  data: [
    {
      q: "You need to send a confidential report to an external partner. The safest method is:",
      opts: ["Email it as a regular attachment", "Use the company's approved encrypted file-sharing platform", "Upload it to personal Google Drive and share the link"],
      correctIndex: 1,
      explanation: "Unsanctioned cloud services (Shadow IT) expose company data. Always use approved, encrypted channels for sensitive information."
    },
    {
      q: "Under GDPR, if you accidentally send customer data to the wrong recipient, you must:",
      opts: ["Hope they delete it and say nothing", "Report it to your Data Protection Officer within 72 hours", "Send an apology email to the customer"],
      correctIndex: 1,
      explanation: "GDPR Article 33 mandates that personal data breaches be reported to the supervisory authority within 72 hours of discovery."
    },
    {
      q: "Leaving your unlocked workstation unattended in a shared office is a risk because:",
      opts: ["The screen might get dirty", "Anyone can access your files, email, and systems without your credentials", "It wastes electricity"],
      correctIndex: 1,
      explanation: "An unlocked screen is an open door. Always lock your screen (Win+L / Cmd+Ctrl+Q) when stepping away — even briefly."
    },
  ],
  default: [
    {
      q: "You receive an unexpected request for sensitive information from an internal email address. You should:",
      opts: ["Comply — it came from an internal address so it must be safe", "Verify the request through a separate channel (call the person directly)", "Reply asking for more details before complying"],
      correctIndex: 1,
      explanation: "Email accounts can be compromised. Always verify unusual requests via a second channel, especially for financial or access-related requests."
    },
    {
      q: "Which is a safe behaviour when working from a coffee shop on a public Wi-Fi?",
      opts: ["Browse as normal — most sites use HTTPS", "Connect via the company VPN before accessing any work systems", "Use your phone as a hotspot only for sensitive tasks, public Wi-Fi for others"],
      correctIndex: 1,
      explanation: "Public Wi-Fi can be intercepted. A VPN encrypts all traffic and is the only safe approach for accessing company resources remotely."
    },
    {
      q: "The principle of 'Least Privilege' means:",
      opts: ["Employees should have access to all systems to be productive", "Users should only have access to the systems and data they need to do their job", "Administrators should limit their own use of high-privilege accounts"],
      correctIndex: 1,
      explanation: "Least privilege limits the damage from a compromised account. If an attacker takes over an account with limited rights, the blast radius is contained."
    },
  ]
};

function getQuestionsForModule(title: string): Question[] {
  const t = (title || "").toLowerCase();
  if (t.includes("phish") || t.includes("email")) return QUESTION_BANK.phishing;
  if (t.includes("password") || t.includes("credential")) return QUESTION_BANK.password;
  if (t.includes("social") || t.includes("engineer") || t.includes("manipulation")) return QUESTION_BANK.social;
  if (t.includes("malware") || t.includes("virus") || t.includes("ransomware")) return QUESTION_BANK.malware;
  if (t.includes("data") || t.includes("gdpr") || t.includes("privacy")) return QUESTION_BANK.data;
  return QUESTION_BANK.default;
}

const PHISHING_SCENARIOS = [
  {
    id: "ph1",
    from: "it-support@companyy.com",
    subject: "⚠️ URGENT: Your account will be suspended in 24 hours",
    body: "Dear Employee, our security systems have detected unauthorized access to your account. Click the link below IMMEDIATELY to verify your identity or your account will be permanently suspended.\n\n→ http://company-verify.suspicious-domain.xyz/login\n\nIT Security Team",
    answer: true,
    explanation: "Red flags: misspelled domain (companyy.com), urgency pressure, suspicious external link, generic greeting."
  },
  {
    id: "ph2",
    from: "hr@yourcompany.com",
    subject: "Q3 Performance Review — Action Required",
    body: "Hi Team,\n\nPlease complete your Q3 self-assessment by Friday. Log in to the HR portal using your existing company credentials at hr.yourcompany.com/review.\n\nThank you,\nHuman Resources",
    answer: false,
    explanation: "This is a legitimate HR email — correct domain, no suspicious links, no urgency manipulation."
  },
  {
    id: "ph3",
    from: "ceo.johnson@gmail.com",
    subject: "Confidential Wire Transfer Request",
    body: "I need you to process an urgent wire transfer of $24,500 to our new vendor. This is time-sensitive. Please don't mention this to anyone else — I'll explain later. Send confirmation when done.\n\n- Robert Johnson, CEO",
    answer: true,
    explanation: "Classic CEO fraud — uses personal Gmail (not company email), extreme secrecy, urgent financial request, pressure not to verify."
  },
  {
    id: "ph4",
    from: "noreply@github.com",
    subject: "GitHub: New sign-in from Chrome on Windows",
    body: "Hi user,\n\nA new sign-in to your GitHub account was detected:\n\nLocation: New York, USA\nDevice: Chrome on Windows\nTime: June 28, 2026 at 9:14 PM\n\nIf this was you, no action needed. If not, secure your account at github.com/settings/security\n\n— The GitHub Team",
    answer: false,
    explanation: "Legitimate GitHub security notification — real domain, no link manipulation, standard format."
  }
];

const YOUTUBE_LINKS = [
  { id: "WufW-JF6Ub8", title: "Social Engineering | Cybersecurity Awareness", duration: "11 min" },
  { id: "EXNNeKA89YE", title: "How Hackers Manipulate Human Psychology", duration: "8 min" },
  { id: "4cTGuTs1do0", title: "Authority, Urgency, Trust & Psychological Attacks", duration: "14 min" },
  { id: "ATiIze_IuJI", title: "AP Cybersecurity: Social Engineering", duration: "10 min" },
  { id: "ljyO3d0vu1Q", title: "Social Engineering in Cybersecurity", duration: "5 min" },
  { id: "sl4XYnlPeOg", title: "What is Social Engineering?", duration: "6 min" },
];

export default function TrainingPage() {
  const [training, setTraining] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [empData, setEmpData] = useState<any>(null);

  // Quiz modal
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);

  // Phishing simulator
  const [phishingIndex, setPhishingIndex] = useState(0);
  const [phishingAnswer, setPhishingAnswer] = useState<boolean | null>(null);
  const [phishingScore, setPhishingScore] = useState(0);
  const [phishingDone, setPhishingDone] = useState(false);

  // Video player
  const [activeVideo, setActiveVideo] = useState<number | null>(null);

  // Streak (simulated)
  const [streak] = useState(3);

  useEffect(() => {
    Promise.all([fetch("/api/employee/training"), fetch("/api/employee/me")])
      .then(([tr, mr]) => Promise.all([tr.json(), mr.json()]))
      .then(([tData, mData]) => { setTraining(tData); setEmpData(mData); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    const correct = quizAnswers.filter(a => a === 1).length; // correct = index 1 "Report to IT"
    const score = Math.round((correct / 3) * activeQuiz.passMark * 1.2);
    try {
      await fetch("/api/employee/training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId: activeQuiz.id, score })
      });
      setQuizResult({ passed: score >= activeQuiz.passMark, score });
    } catch (e) { console.error(e); }
  };

  const handlePhishingAnswer = (isSuspicious: boolean) => {
    const current = PHISHING_SCENARIOS[phishingIndex];
    setPhishingAnswer(isSuspicious);
    if (isSuspicious === current.answer) setPhishingScore(s => s + 1);
  };

  const nextPhishing = () => {
    if (phishingIndex + 1 >= PHISHING_SCENARIOS.length) {
      setPhishingDone(true);
    } else {
      setPhishingIndex(i => i + 1);
      setPhishingAnswer(null);
    }
  };

  const resetPhishing = () => {
    setPhishingIndex(0); setPhishingAnswer(null);
    setPhishingScore(0); setPhishingDone(false);
  };

  const completedModules = training?.progress?.length || 0;
  const totalModules = training?.modules?.length || 0;
  const progressPct = totalModules ? Math.round((completedModules / totalModules) * 100) : 0;

  // ─── SAFETY: Clamp display score to 0-100 ───
  const riskScore = Math.min(100, Math.max(0, Math.round(empData?.employee?.riskScore ?? 50)));

  const recommendedModules = training?.modules?.filter((m: any) => {
    const done = training?.progress?.find((p: any) => p.moduleId === m.id);
    return !done;
  }) || [];

  if (isLoading) return <div style={{ display: "flex", justifyContent: "center", padding: 80 }}><div className="spinner" /></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .training-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07); border-radius: 18px; padding: 24px; transition: border-color 0.2s, background 0.2s; }
        .training-card:hover { border-color: rgba(212,180,113,0.18); background: rgba(212,180,113,0.03); }
        .training-card.done { border-color: rgba(141,208,194,0.2); background: rgba(141,208,194,0.04); }
        .progress-bar-bg { background: rgba(255,255,255,0.07); border-radius: 8px; height: 8px; overflow: hidden; }
        .progress-bar-fill { height: 8px; border-radius: 8px; background: linear-gradient(90deg, var(--accent-2), var(--accent)); transition: width 1s ease; }
        .diff-tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .phishing-email { background: #ffffff0d; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; line-height: 1.7; }
        .streak-fire { font-size: 1.8rem; animation: bounce 1s infinite alternate; }
        @keyframes bounce { from { transform: scale(1); } to { transform: scale(1.15); } }
        .video-thumb { aspect-ratio: 16/9; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color 0.2s; }
        .video-thumb:hover { border-color: rgba(212,180,113,0.3); }
        .video-thumb iframe { width: 100%; height: 100%; border: none; }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(12px); z-index: 200; display: flex; align-items: center; justify-content: center; }
        .modal-box { background: linear-gradient(145deg, rgba(12,22,34,0.98), rgba(8,16,25,0.98)); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 36px; width: 100%; max-width: 580px; max-height: 90vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,0.5); animation: slideUp 0.25s cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideUp { from { opacity:0; transform: translateY(16px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }
      `}} />

      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Security Training</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: "1.8rem" }}>Training Hub</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.2)", borderRadius: 14, padding: "10px 18px" }}>
            <span className="streak-fire">🔥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{streak} Day Streak</div>
              <div className="muted" style={{ fontSize: "0.75rem" }}>Keep it up!</div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="training-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Overall Progress</div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: progressPct === 100 ? "var(--success)" : "var(--accent)" }}>
            {completedModules}/{totalModules} modules complete
          </div>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span className="muted" style={{ fontSize: "0.78rem" }}>0%</span>
          <span style={{ fontSize: "0.78rem", color: progressPct === 100 ? "var(--success)" : "var(--accent)", fontWeight: 600 }}>{progressPct}%</span>
          <span className="muted" style={{ fontSize: "0.78rem" }}>100%</span>
        </div>
      </div>

      {/* AI Personalized Recommendations */}
      {recommendedModules.length > 0 && (
        <div style={{ background: "rgba(141,208,194,0.06)", border: "1px solid rgba(141,208,194,0.15)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: "1.2rem" }}>🤖</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>AI-Personalized Path</div>
              <div className="muted" style={{ fontSize: "0.78rem" }}>Based on your risk score of {Math.round(riskScore)}, complete these next:</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {recommendedModules.slice(0, 3).map((m: any) => (
              <button key={m.id} className="filter-chip" onClick={() => { setActiveQuiz(m); setQuizAnswers([]); setQuizResult(null); }}
                style={{ padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(141,208,194,0.25)", background: "rgba(141,208,194,0.08)", color: "var(--accent-2)", fontSize: "0.82rem", cursor: "pointer" }}>
                📚 {m.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Training Modules Grid */}
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "1rem" }}>📚 Security Modules</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 14, marginBottom: 28 }}>
        {training?.modules?.map((mod: any) => {
          const prog = training?.progress?.find((p: any) => p.moduleId === mod.id);
          const isPassed = prog && prog.score >= mod.passMark;
          const pct = isPassed ? 100 : prog ? Math.round((prog.score / mod.passMark) * 100) : 0;
          const diffColor = mod.difficulty === "Easy" ? "var(--success)" : mod.difficulty === "Hard" ? "var(--danger)" : "var(--warning)";

          return (
            <div key={mod.id} className={`training-card ${isPassed ? "done" : ""}`} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.6rem" }}>📚</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className="diff-tag" style={{ background: `${diffColor}15`, color: diffColor, border: `1px solid ${diffColor}25` }}>
                    {mod.difficulty}
                  </span>
                  {isPassed && <span className="diff-tag" style={{ background: "rgba(141,208,194,0.12)", color: "var(--success)", border: "1px solid rgba(141,208,194,0.25)" }}>✓ Passed</span>}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.95rem" }}>{mod.title}</div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>Pass mark: {mod.passMark} pts</div>
              </div>
              {(prog || isPassed) && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>Score: {prog?.score || 0}</span>
                    <span style={{ fontSize: "0.75rem", color: isPassed ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: isPassed ? "var(--success)" : "linear-gradient(90deg,var(--warning),var(--accent))" }} />
                  </div>
                </div>
              )}
              <button
                className={isPassed ? "buttonSecondary" : "buttonPrimary"}
                style={{ width: "100%", justifyContent: "center", marginTop: "auto", fontSize: "0.85rem" }}
                onClick={() => { setActiveQuiz(mod); setQuizAnswers([]); setQuizResult(null); }}
              >
                {isPassed ? "🔁 Retake Quiz" : "▶ Start Module"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Phishing Simulator */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
          🎣 Phishing Simulator
          <span className="diff-tag" style={{ background: "rgba(255,133,120,0.1)", color: "var(--danger)", border: "1px solid rgba(255,133,120,0.2)", marginLeft: 4 }}>INTERACTIVE</span>
        </div>
        <div className="training-card">
          {phishingDone ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>{phishingScore >= 3 ? "🎓" : "📖"}</div>
              <h3 style={{ marginBottom: 8 }}>Simulation Complete!</h3>
              <p className="muted" style={{ marginBottom: 16 }}>You correctly identified <strong style={{ color: "var(--accent)" }}>{phishingScore}/{PHISHING_SCENARIOS.length}</strong> scenarios.</p>
              <div style={{ padding: "12px 20px", borderRadius: 12, background: phishingScore >= 3 ? "rgba(141,208,194,0.08)" : "rgba(255,133,120,0.08)", border: `1px solid ${phishingScore >= 3 ? "rgba(141,208,194,0.2)" : "rgba(255,133,120,0.2)"}`, marginBottom: 20, display: "inline-block" }}>
                <span style={{ color: phishingScore >= 3 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
                  {phishingScore >= 3 ? "✓ Great awareness!" : "⚠️ Review the tips below"}
                </span>
              </div>
              <div><button className="buttonPrimary" onClick={resetPhishing}>Try Again</button></div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ fontWeight: 600 }}>Scenario {phishingIndex + 1} of {PHISHING_SCENARIOS.length}</div>
                <div className="muted" style={{ fontSize: "0.82rem" }}>Score: {phishingScore}</div>
              </div>
              <div className="phishing-email">
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div><strong>From:</strong> <span style={{ color: "var(--accent)" }}>{PHISHING_SCENARIOS[phishingIndex].from}</span></div>
                  <div><strong>Subject:</strong> {PHISHING_SCENARIOS[phishingIndex].subject}</div>
                </div>
                {PHISHING_SCENARIOS[phishingIndex].body}
              </div>

              {phishingAnswer === null ? (
                <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                  <button className="buttonPrimary" style={{ flex: 1, justifyContent: "center", background: "rgba(255,133,120,0.15)", border: "1px solid rgba(255,133,120,0.3)", color: "var(--danger)" }} onClick={() => handlePhishingAnswer(true)}>
                    🚨 Suspicious — Report It
                  </button>
                  <button className="buttonSecondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => handlePhishingAnswer(false)}>
                    ✅ Looks Legitimate
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <div style={{ padding: "14px 18px", borderRadius: 12, marginBottom: 16, background: phishingAnswer === PHISHING_SCENARIOS[phishingIndex].answer ? "rgba(141,208,194,0.08)" : "rgba(255,133,120,0.08)", border: `1px solid ${phishingAnswer === PHISHING_SCENARIOS[phishingIndex].answer ? "rgba(141,208,194,0.25)" : "rgba(255,133,120,0.25)"}` }}>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: phishingAnswer === PHISHING_SCENARIOS[phishingIndex].answer ? "var(--success)" : "var(--danger)" }}>
                      {phishingAnswer === PHISHING_SCENARIOS[phishingIndex].answer ? "✓ Correct!" : "✗ Incorrect"}
                    </div>
                    <p className="muted" style={{ fontSize: "0.85rem" }}>{PHISHING_SCENARIOS[phishingIndex].explanation}</p>
                  </div>
                  <button className="buttonPrimary" style={{ width: "100%", justifyContent: "center" }} onClick={nextPhishing}>
                    {phishingIndex + 1 >= PHISHING_SCENARIOS.length ? "See Results →" : "Next Scenario →"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Video Resources */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: "1rem" }}>🎬 Video Resources</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 14 }}>
          {YOUTUBE_LINKS.map((vid, i) => (
            <a
              key={i}
              href={`https://www.youtube.com/watch?v=${vid.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="training-card"
              style={{ display: "block", textDecoration: "none", padding: 0, overflow: "hidden" }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9", background: "rgba(255,255,255,0.04)" }}>
                <img
                  src={`https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`}
                  alt={vid.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
                />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                    ▶
                  </div>
                </div>
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text)" }}>{vid.title}</div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>Duration: {vid.duration}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600, marginTop: 4 }}>
                  Watch on YouTube ↗
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Quiz Modal — dynamic question bank */}
      {activeQuiz && (() => {
        const questions = getQuestionsForModule(activeQuiz.title);
        return (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setActiveQuiz(null)}>
          <div className="modal-box">
            {quizResult ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: 12 }}>{quizResult.passed ? "🎓" : "📖"}</div>
                <h3 style={{ marginBottom: 8 }}>{quizResult.passed ? "Module Passed!" : "Not Quite There"}</h3>
                <p className="muted" style={{ marginBottom: 20 }}>You scored <strong style={{ color: "var(--accent)" }}>{quizResult.score}</strong> / {activeQuiz.passMark} (pass mark)</p>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <button className="buttonSecondary" onClick={() => setActiveQuiz(null)}>Close</button>
                  {!quizResult.passed && <button className="buttonPrimary" onClick={() => { setQuizAnswers([]); setQuizResult(null); }}>Retry Quiz</button>}
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Security Quiz</div>
                  <h3 style={{ fontSize: "1.2rem" }}>{activeQuiz.title}</h3>
                  <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>Answer all 3 questions correctly to pass. Pass mark: {activeQuiz.passMark} pts</p>
                </div>
                  {questions.map((q, i) => (
                    <div key={i} style={{ padding: 18, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 14, fontSize: "0.9rem", lineHeight: 1.6 }}>Q{i + 1}. {q.q}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {q.opts.map((opt, j) => {
                          const isSelected = quizAnswers[i] === j;
                          return (
                            <label key={j} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, background: isSelected ? "rgba(141,208,194,0.08)" : "rgba(255,255,255,0.01)", border: isSelected ? "1px solid rgba(141,208,194,0.25)" : "1px solid rgba(255,255,255,0.07)", transition: "all 0.15s", fontSize: "0.88rem" }}>
                              <input type="radio" name={`q${i}`} checked={isSelected} onChange={() => { const a = [...quizAnswers]; a[i] = j; setQuizAnswers(a); }} style={{ accentColor: "var(--accent-2)", flexShrink: 0 }} />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                    <button className="buttonSecondary" onClick={() => setActiveQuiz(null)} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                    <button className="buttonPrimary" onClick={submitQuiz} disabled={quizAnswers.filter(a => a !== undefined).length < 3} style={{ flex: 1, justifyContent: "center" }}>Submit Answers →</button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
