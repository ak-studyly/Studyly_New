"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Upload, Star, ArrowRight, PlusCircle, FileText } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AddCollegeModal from "@/components/ui/AddCollegeModal";
import { createClient } from "@/lib/supabase/client";
import { cn, BRANCHES, YEARS, CLASS_KEY } from "@/lib/utils";
import type { College, SavedClass } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [savedClass, setSavedClass] = useState<SavedClass | null>(null);
  const [collegeId, setCollegeId] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("colleges").select("*").eq("approved", true).order("name")
      .then(({ data }) => setColleges((data as College[]) ?? []));

    try {
      const stored = localStorage.getItem(CLASS_KEY);
      if (stored) setSavedClass(JSON.parse(stored));
    } catch {}
  }, []);

  const step1Done = !!collegeId;
  const step2Done = step1Done && !!branch;
  const canGo = step2Done && !!year;

  function buildUrl(c: SavedClass) {
    return `/materials?collegeId=${c.collegeId}&branch=${encodeURIComponent(c.branch)}&year=${c.year}`;
  }

  function handleGo() {
    if (!canGo) return;
    const college = colleges.find((c) => c.id === collegeId);
    if (!college) return;
    const saved: SavedClass = { collegeId, collegeName: college.name, branch, year: parseInt(year) };
    localStorage.setItem(CLASS_KEY, JSON.stringify(saved));
    router.push(buildUrl(saved));
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="inline-block text-xs font-medium bg-brand-light dark:bg-green-950 text-brand dark:text-brand-mid px-4 py-1.5 rounded-full mb-6">
          study smarter, together
        </span>

        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-gray-900 dark:text-gray-100 leading-tight max-w-2xl mb-4">
          Study materials,{" "}
          <em className="text-brand dark:text-brand-mid not-italic">shared by students</em>
        </h1>

        <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed mb-10">
          Find notes, past papers, slides and summaries uploaded by students at your college.
          Filter by branch, year, and subject. Upload your own to help others.
        </p>

        {/* Saved class shortcut */}
        {savedClass ? (
          <div className="card p-5 w-full max-w-md mb-6 text-left">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-3">
              your class
            </p>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">{savedClass.collegeName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-4">
              {savedClass.branch} · {savedClass.year}{["st","nd","rd","th"][Math.min(savedClass.year - 1, 3)]} year
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(buildUrl(savedClass))}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <BookOpen size={15} />
                browse materials
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(CLASS_KEY);
                  setSavedClass(null);
                }}
                className="btn-secondary px-4 text-xs"
              >
                change
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-5 w-full max-w-md mb-6 text-left">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-600 mb-4">
              find materials for your class
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-2 mb-4">
              <div className={cn("w-2 h-2 rounded-full transition-colors", step1Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs transition-colors", step1Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-600")}>college</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", step2Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs transition-colors", step2Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-600")}>branch</span>
              <div className={cn("w-2 h-2 rounded-full transition-colors", canGo ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
              <span className={cn("text-xs transition-colors", canGo ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-600")}>year</span>
            </div>

            <div className="flex flex-col gap-2">
              <select
                className="select"
                value={collegeId}
                onChange={(e) => { setCollegeId(e.target.value); setBranch(""); setYear(""); }}
              >
                <option value="">select your college…</option>
                {colleges.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
                ))}
              </select>

              <div className={cn(
                "transition-all duration-300 overflow-hidden flex flex-col gap-2",
                step1Done ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              )}>
                <select
                  className="select"
                  value={branch}
                  onChange={(e) => { setBranch(e.target.value); setYear(""); }}
                >
                  <option value="">select branch…</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className={cn(
                "transition-all duration-300 overflow-hidden",
                step2Done ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
              )}>
                <select className="select" value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">select year…</option>
                  {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>

              <button
                onClick={handleGo}
                disabled={!canGo}
                className="btn-primary mt-1 flex items-center justify-center gap-2"
              >
                <BookOpen size={15} />
                browse materials
                <ArrowRight size={14} />
              </button>
            </div>

            <button
              onClick={() => setAddCollegeOpen(true)}
              className="flex items-center gap-1.5 text-xs text-brand dark:text-brand-mid hover:underline mt-3"
            >
              <PlusCircle size={12} />
              don't see your college? add it
            </button>
          </div>
        )}

        <button
          onClick={() => router.push("/upload")}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <Upload size={15} />
          upload your notes
        </button>
      </section>

      {/* Features */}
      <section className="bg-gray-50 dark:bg-neutral-900 border-t border-black/8 dark:border-white/8 px-6 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <FileText size={20} className="text-brand dark:text-brand-mid" />,
              title: "PDF materials only",
              desc: "Notes, past papers, slides and summaries — all as PDFs for safety and consistency.",
            },
            {
              icon: <Star size={20} className="text-brand dark:text-brand-mid" />,
              title: "community upvotes",
              desc: "The best materials rise to the top. Upvote what helped you.",
            },
            {
              icon: <Upload size={20} className="text-brand dark:text-brand-mid" />,
              title: "easy to contribute",
              desc: "Upload your notes in under a minute. No account needed.",
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="w-9 h-9 bg-brand-light dark:bg-green-950 rounded-xl flex items-center justify-center mb-1">
                {f.icon}
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/8 dark:border-white/8 px-6 py-5 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-600">
          <span className="font-serif text-sm text-brand dark:text-brand-mid font-semibold">Study<em>ly</em></span>
          {" "}· built by students, for students
        </p>
      </footer>

      <AddCollegeModal open={addCollegeOpen} onClose={() => setAddCollegeOpen(false)} />
    </div>
  );
}
