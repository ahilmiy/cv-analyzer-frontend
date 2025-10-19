import React, { useMemo, useRef, useState } from "react";

/**
 * CV Analyzer – Backend Entegre Versiyon
 * -------------------------------------------------
 * Backend API'ye bağlanır ve gerçek skorlama yapar
 */

// ===== BACKEND URL KONFIGURAYONU =====
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ----------------------------- Backend API Layer -----------------------------
async function analyzeJD({ rawText, files }) {
  const body = new FormData();
  body.append("mode", "analyze");
  body.append("raw_text", rawText || "");
  (files || []).forEach((f) => body.append("files", f));

  const res = await fetch(`${API_BASE_URL}/api/jd/analyze`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Analyze failed ${res.status}: ${text}`);
  }

  return await res.json();
}

async function scoreCVs({ requirements, files }) {
  const skills = (requirements || []).map(r => (typeof r === "string" ? r : r.skill)).filter(Boolean);

  const body = new FormData();
  body.append("mode", "score");
  body.append("skills", JSON.stringify(skills));
  body.append("requirements", JSON.stringify(requirements));
  (files || []).forEach(f => body.append("files", f));

  const res = await fetch(`${API_BASE_URL}/api/cv/score`, { 
    method: "POST", 
    body 
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Scoring failed ${res.status}: ${text}`);
  }
  
  return await res.json();
}

// ----------------------------- Utility Functions -----------------------------
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

// ------------------------------ UI Primitives --------------------------------
function Section({ title, description, children, right }) {
  return (
    <div className="relative rounded-2xl bg-white border border-gray-100 shadow-lg shadow-indigo-500/5 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          {right}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ tone = "gray", children }) {
  const tones = {
    gray: "text-gray-700 bg-gray-100 border-gray-200",
    green: "text-emerald-700 bg-emerald-50 border-emerald-200",
    red: "text-rose-700 bg-rose-50 border-rose-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function Input({ label, hint, icon, className = "", ...props }) {
  return (
    <label className="block">
      {label && <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          {...props}
          className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${icon ? "pl-10" : ""} ${className}`}
        />
      </div>
      {hint && <div className="text-xs text-gray-500 mt-1.5">{hint}</div>}
    </label>
  );
}

function Textarea({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>}
      <textarea
        {...props}
        className={`w-full rounded-xl border border-gray-200 px-4 py-3 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none ${className}`}
      />
      {hint && <div className="text-xs text-gray-500 mt-1.5">{hint}</div>}
    </label>
  );
}

function FileDrop({ label, multiple=false, onFiles, accept, fileCount = 0, maxFiles = null }) {
  const inpRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    let files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (maxFiles && files.length > maxFiles) {
      files = files.slice(0, maxFiles);
    }
    if (files.length > 0) {
      onFiles?.(files);
    }
  };

  const handleFileSelect = (e) => {
    let files = Array.from(e.target.files || []);
    if (maxFiles && files.length > maxFiles) {
      files = files.slice(0, maxFiles);
    }
    onFiles?.(files);
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-2xl p-8 transition-all ${
        isDragging 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
          <div className="text-xs text-gray-500">
            Drag and drop PDF files or select
            {maxFiles && <span className="block mt-1 text-gray-400">Maximum {maxFiles} files</span>}
          </div>
        </div>
        <GhostButton onClick={() => inpRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Select File
        </GhostButton>
        {fileCount > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-gray-700">
              {fileCount} file{fileCount > 1 ? 's' : ''} selected
              {maxFiles && <span className="text-gray-500"> / {maxFiles}</span>}
            </span>
          </div>
        )}
      </div>
      <input
        ref={inpRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
      />
    </div>
  );
}

function ScorePill({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = v >= 70 ? 'from-emerald-500 to-green-500' : v >= 40 ? 'from-amber-500 to-orange-500' : 'from-rose-500 to-red-500';
  
  return (
    <div className="min-w-[160px]">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
        <span className="font-medium">Score</span>
        <span className="font-bold text-gray-900">{v}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

// ------------------------------ Main Component -------------------------------
export default function CVAnalyzerApp() {
  // JD
  const [jdText, setJdText] = useState("");
  const [jdFiles, setJdFiles] = useState([]);
  const [jdId, setJdId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Requirements
  const [requirements, setRequirements] = useState([]);

  // CVs & Candidates
  const [cvFiles, setCvFiles] = useState([]);
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [sortDesc, setSortDesc] = useState(true);

  const weightSum = useMemo(() => requirements.reduce((a, b) => a + (Number(b.weight)||0), 0), [requirements]);

  function updateRequirement(i, patch) { 
    setRequirements((prev) => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r)); 
  }
  
  function addRequirement() { 
    setRequirements((prev) => [...prev, { skill: "", weight: 0.1 }]); 
  }
  
  function removeRequirement(i) { 
    setRequirements((prev) => prev.filter((_, idx) => idx !== i)); 
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      const out = await analyzeJD({ rawText: jdText, files: jdFiles });
      setJdId(out.jd_id || null);

      if (Array.isArray(out.requirements)) {
        setRequirements(out.requirements);
      } else {
        const text = out.requirements_text || out.output || out.result || out.text || "";
        const parsed = parseRequirementsString(text);
        setRequirements(parsed);
      }
    } catch (error) {
      console.error('Analyze error:', error);
      setAnalyzeError(error.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleScore() {
    setScoring(true);
    setScoreError(null);
    
    try {
      const data = await scoreCVs({ requirements, files: cvFiles });

      // Normalize response
      const items = Array.isArray(data) 
        ? data 
        : (data?.items ? data.items : (data ? [data] : []));

      // Map to candidates
      const rows = items.map((it, i) => {
        const f = cvFiles[i];
        const numericScore = Number(it.overall ?? it.score ?? 0);
        
        return {
          id: it.id || `cand_${i}`,
          name: it.name || "Unknown",
          email: it.email || "unknown",
          score: Number.isFinite(numericScore) ? numericScore : 0,
          file: f || null,
        };
      });

      setCandidates(rows);
    } catch (error) {
      console.error('Score error:', error);
      setScoreError(error.message);
    } finally {
      setScoring(false);
    }
  }

  const sortedCandidates = useMemo(() => {
    const arr = [...candidates];
    arr.sort((a,b) => sortDesc ? b.score - a.score : a.score - b.score);
    return arr;
  }, [candidates, sortDesc]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
  <img 
    src="src\logo.png" 
    alt="CV Analyzer Logo" 
    className="w-full h-full object-cover"
  />
</div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                CV Analyzer(MVP)
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-15">Analyze job postings, organize requirements, and score resumes.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={weightSum<=1?"green":"red"}>Toplam ağırlık: {weightSum.toFixed(2)}</Badge>
            {jdId && <Badge tone="blue">JD ID: {jdId}</Badge>}
          </div>
        </header>

        {/* Job Description */}
        <Section
          title="1) Job Description"
          description="Upload PDF files; get automatic skill/weight suggestions through analysis."
          right={
            <PrimaryButton onClick={handleAnalyze} disabled={analyzing || jdFiles.length === 0}>
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Analyze
                </>
              )}
            </PrimaryButton>
          }
        >
          <FileDrop 
            label="Upload PDF (single or multiple)" 
            multiple 
            onFiles={(files)=>setJdFiles(files)} 
            accept="application/pdf"
            fileCount={jdFiles.length}
          />
          
          {analyzeError && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong className="font-semibold">Error:</strong> {analyzeError}
              </div>
            </div>
          )}
        </Section>

        {/* Requirements */}
        <Section
          title="2) Requirements (Skill & Weight)"
          description="Edit skills and weights. Weights should be in 0..1 range, total ≤ 1 recommended."
          right={
            <GhostButton onClick={addRequirement}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Row
            </GhostButton>
          }
        >
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-700">
                  <th className="py-4 pl-6 pr-3">#</th>
                  <th className="py-4 pr-3">Skill</th>
                  <th className="py-4 pr-3">Weight (0..1)</th>
                  <th className="py-4 pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {requirements.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 pl-6 pr-3 text-gray-500 font-medium">{i+1}</td>
                    <td className="py-3 pr-3">
                      <input
                        value={row.skill}
                        onChange={(e)=>updateRequirement(i,{skill:e.target.value})}
                        placeholder="Python"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={1}
                        value={row.weight}
                        onChange={(e)=>updateRequirement(i,{weight:Number(e.target.value)})}
                        className="w-32 rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </td>
                    <td className="py-3 pr-6">
                      <button
                        onClick={()=>removeRequirement(i)} 
                        className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium transition"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {requirements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3 text-gray-400">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
                          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="text-sm text-gray-500">
                          Empty for now. Analyze JD to auto-fill or start with <span className="font-semibold text-gray-700">Add Row</span>.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>

        {/* CV Upload / Candidates */}
        <Section
          title="3) Upload CV & Score"
          description="Upload PDF files and score them with current requirements."
          right={
            <PrimaryButton 
              onClick={handleScore} 
              disabled={scoring || !requirements.length || !cvFiles.length}
            >
              {scoring ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Scoring…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Score
                </>
              )}
            </PrimaryButton>
          }
        >
          <div className="space-y-6">
            <FileDrop 
              label="CV PDF (multiple upload)" 
              multiple 
              onFiles={(files)=>setCvFiles(files)} 
              accept="application/pdf"
              fileCount={cvFiles.length}
              maxFiles={10}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-700">
                  Candidates 
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {candidates.length}
                  </span>
                </div>
                <GhostButton onClick={()=>setSortDesc((s)=>!s)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {sortDesc ? "Descending" : "Ascending"}
                </GhostButton>
              </div>
              
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr className="text-left text-xs font-semibold text-gray-700">
                      <th className="py-4 pl-6 pr-3">Candidate</th>
                      <th className="py-4 pr-3">E-mail</th>
                      <th className="py-4 pr-6">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-4 pl-6 pr-3">
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">ID: {c.id}</div>
                        </td>
                        <td className="py-4 pr-3">
                          <a href={`mailto:${c.email}`} className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition">
                            {c.email}
                          </a>
                        </td>
                        <td className="py-4 pr-6">
                          <ScorePill value={c.score} />
                        </td>
                      </tr>
                    ))}
                    {sortedCandidates.length===0 && (
                      <tr>
                        <td colSpan={3} className="py-16">
                          <EmptyState />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {scoreError && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong className="font-semibold">Error:</strong> {scoreError}
              </div>
            </div>
          )}
        </Section>

        <footer className="pt-4 pb-6 text-xs text-gray-500 text-center">
          This product is at the prototype (MVP) stage and is currently undergoing testing.
        </footer>
      </div>
    </div>
  );
}

// ---- PARSER: "javascript proficiency 5, rest api understanding 5, ..." -> [{skill, weight}]
function parseRequirementsString(input) {
  if (!input || typeof input !== "string") return [];
  const rawItems = input.split(",").map(s => s.trim()).filter(Boolean);

  const items = rawItems.map(chunk => {
    const m = chunk.match(/(.+?)\s+(\d{1,2})$/);
    const label = (m ? m[1] : chunk).trim();
    const score = m ? Math.max(1, Math.min(5, parseInt(m[2], 10))) : 5;
    return { skill: titleizeSkill(label), score };
  });

  let weights = items.map(it => it.score / 5);
  const sum = weights.reduce((a,b)=>a+b,0);
  if (sum > 1) {
    weights = weights.map(w => w / sum);
  }
  return items.map((it, i) => ({ skill: it.skill, weight: Number(weights[i].toFixed(2)) }));
}

function titleizeSkill(s) {
  const special = {
    api: "API",
    sql: "SQL",
    json: "JSON",
    n8n: "n8n",
    js: "JS",
    ui: "UI",
    ux: "UX",
  };
  return s
    .split(/\s+/)
    .map(word => {
      const low = word.toLowerCase();
      if (special[low]) return special[low];
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 text-gray-400">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-gray-600 mb-1">No scored candidates yet</div>
        <div className="text-xs text-gray-500">Upload CVs and click <span className="font-semibold text-gray-700">Score</span> button.</div>
      </div>
    </div>
  );
}