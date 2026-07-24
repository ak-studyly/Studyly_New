"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, Download, Search, SlidersHorizontal,
  PlusCircle, FileText, ArrowUpRight,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import AddCollegeModal from "@/components/ui/AddCollegeModal";
import { createClient } from "@/lib/supabase/client";
import {
  cn, BRANCHES, YEARS, CLASS_KEY,
  MATERIAL_TYPE_LABELS, MATERIAL_TYPE_STYLES,
  formatPostTime, formatFileSize,
} from "@/lib/utils";
import type { College, Material, MaterialType, SavedClass } from "@/types";

const TYPE_OPTIONS = [
  { value: "all",       label: "all types" },
  { value: "notes",     label: "notes" },
  { value: "past_paper",label: "past paper" },
  { value: "slides",    label: "slides" },
  { value: "summary",   label: "summary" },
];

const VOTER_KEY = "studyly_voter";

function getVoterKey() {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(VOTER_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(VOTER_KEY, key);
  }
  return key;
}

type Params = {
  collegeId: string;
  branch: string;
  year: number;
  subject: string;
  type: string;
};

type Props = {
  colleges: College[];
  initialMaterials: Material[];
  initialCollege: College | null;
  initialParams: Params;
};

export default function MaterialsClient({
  colleges, initialMaterials, initialCollege, initialParams,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [collegeId, setCollegeId] = useState(initialParams.collegeId);
  const [branch, setBranch] = useState(initialParams.branch);
  const [year, setYear] = useState(initialParams.year ? String(initialParams.year) : "");
  const [subject, setSubject] = useState(initialParams.subject);
  const [typeFilter, setTypeFilter] = useState(initialParams.type || "all");
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [loading, setLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);

  const hasFilters = !!collegeId && !!branch && !!year;

  // Load voted IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("studyly_voted");
      if (stored) setVotedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  // Save class to localStorage when all three selected
  useEffect(() => {
    if (collegeId && branch && year) {
      const college = colleges.find((c) => c.id === collegeId);
      if (college) {
        const saved: SavedClass = {
          collegeId,
          collegeName: college.name,
          branch,
          year: parseInt(year),
        };
        localStorage.setItem(CLASS_KEY, JSON.stringify(saved));
      }
    }
  }, [collegeId, branch, year, colleges]);

  const fetchMaterials = useCallback(async () => {
    if (!collegeId || !branch || !year) return;
    setLoading(true);
    const supabase = createClient();

    let q = supabase
      .from("materials")
      .select("*")
      .eq("college_id", collegeId)
      .eq("branch", branch)
      .eq("year", parseInt(year))
      .eq("approved", true)
      .order("upvotes", { ascending: false });

    if (subject.trim()) q = q.ilike("subject", `%${subject.trim()}%`);
    if (typeFilter !== "all") q = q.eq("type", typeFilter);

    const { data } = await q;
    setMaterials((data as Material[]) ?? []);
    setLoading(false);
  }, [collegeId, branch, year, subject, typeFilter]);

  function handleSearch() {
    if (!hasFilters) return;
    const params = new URLSearchParams();
    params.set("collegeId", collegeId);
    params.set("branch", branch);
    params.set("year", year);
    if (subject.trim()) params.set("subject", subject.trim());
    if (typeFilter !== "all") params.set("type", typeFilter);
    router.push(`/materials?${params.toString()}`);
    fetchMaterials();
  }

  async function handleUpvote(material: Material) {
    if (votedIds.has(material.id)) return;
    const voterKey = getVoterKey();
    const supabase = createClient();

    const { data } = await supabase.rpc("upvote_material", {
      p_material_id: material.id,
      p_voter_key: voterKey,
    });

    if (data) {
      // Update local state
      setMaterials((prev) =>
        prev.map((m) => m.id === material.id ? { ...m, upvotes: m.upvotes + 1 } : m)
      );
      const newVoted = new Set(votedIds).add(material.id);
      setVotedIds(newVoted);
      localStorage.setItem("studyly_voted", JSON.stringify([...newVoted]));
    }
  }

  const selectedCollege = colleges.find((c) => c.id === collegeId);
  const step1Done = !!collegeId;
  const step2Done = step1Done && !!branch;
  const canSearch = step2Done && !!year;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
            browse materials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            PDF notes, past papers, slides and summaries — shared by students.
          </p>
        </div>

        {/* Filter card */}
        <div className="card p-5 mb-6">
          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-4">
            <div className={cn("w-2 h-2 rounded-full", step1Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
            <span className={cn("text-xs", step1Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400")}>college</span>
            <div className={cn("w-2 h-2 rounded-full", step2Done ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
            <span className={cn("text-xs", step2Done ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400")}>branch</span>
            <div className={cn("w-2 h-2 rounded-full", canSearch ? "bg-brand dark:bg-brand-mid" : "bg-gray-200 dark:bg-neutral-700")} />
            <span className={cn("text-xs", canSearch ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400")}>year</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* College */}
            <select
              className="select"
              value={collegeId}
              onChange={(e) => { setCollegeId(e.target.value); setBranch(""); setYear(""); setMaterials([]); }}
            >
              <option value="">select your college…</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
              ))}
            </select>

            {/* Branch */}
            <div className={cn("transition-all duration-300 overflow-hidden", step1Done ? "max-h-20 opacity-100" : "max-h-0 opacity-0")}>
              <select
                className="select"
                value={branch}
                onChange={(e) => { setBranch(e.target.value); setYear(""); setMaterials([]); }}
              >
                <option value="">select branch…</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Year */}
            <div className={cn("transition-all duration-300 overflow-hidden", step2Done ? "max-h-20 opacity-100" : "max-h-0 opacity-0")}>
              <select
                className="select"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">select year…</option>
                {YEARS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>

            {/* Subject + search */}
            <div className={cn("transition-all duration-300 overflow-hidden", canSearch ? "max-h-20 opacity-100" : "max-h-0 opacity-0")}>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="subject (optional) — e.g. Operating Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                />
                <button
                  onClick={handleSearch}
                  disabled={!canSearch || loading}
                  className="btn-primary px-4 flex items-center gap-2 whitespace-nowrap"
                >
                  <Search size={14} />
                  {loading ? "searching…" : "search"}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setAddCollegeOpen(true)}
            className="flex items-center gap-1.5 text-xs text-brand dark:text-brand-mid hover:underline mt-3"
          >
            <PlusCircle size={12} />
            don't see your college? add it
          </button>
        </div>

        {/* Results */}
        {hasFilters && (
          <>
            {/* Type filter tabs */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <SlidersHorizontal size={13} className="text-gray-400 dark:text-gray-600" />
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => {
                    setTypeFilter(t.value);
                    setTimeout(fetchMaterials, 0);
                  }}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all",
                    typeFilter === t.value
                      ? "bg-brand border-brand text-white font-medium"
                      : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="h-4 bg-gray-100 dark:bg-neutral-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : materials.length === 0 ? (
              <div className="card p-10 text-center">
                <FileText size={32} className="text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">No materials found.</p>
                <p className="text-gray-400 dark:text-gray-600 text-xs mb-4">
                  Be the first to upload for {branch} {year}{["st","nd","rd","th"][Math.min(parseInt(year)-1,3)]} year!
                </p>
                <button
                  onClick={() => router.push("/upload")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  upload a PDF
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  {materials.length} result{materials.length !== 1 ? "s" : ""} —
                  sorted by upvotes
                </p>
                {materials.map((m) => (
                  <MaterialCard
                    key={m.id}
                    material={m}
                    hasVoted={votedIds.has(m.id)}
                    onUpvote={() => handleUpvote(m)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Upload CTA */}
        {!hasFilters && (
          <div className="border border-dashed border-black/10 dark:border-white/10 rounded-xl p-6 flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-neutral-900">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Have good notes?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Share your PDFs and help your peers.</p>
            </div>
            <button onClick={() => router.push("/upload")} className="btn-primary flex items-center gap-2">
              upload a PDF
            </button>
          </div>
        )}
      </div>

      <AddCollegeModal open={addCollegeOpen} onClose={() => setAddCollegeOpen(false)} />
    </div>
  );
}

function MaterialCard({
  material: m, hasVoted, onUpvote,
}: {
  material: Material;
  hasVoted: boolean;
  onUpvote: () => void;
}) {
  return (
    <div className="card p-4 flex items-center gap-4 hover:border-brand-mid dark:hover:border-brand-mid transition-colors">
      {/* Left — type icon */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        m.type === "notes"      ? "bg-green-100 dark:bg-green-950" :
        m.type === "past_paper" ? "bg-amber-100 dark:bg-amber-950" :
        m.type === "slides"     ? "bg-blue-100 dark:bg-blue-950"   :
                                  "bg-pink-100 dark:bg-pink-950"
      )}>
        <FileText size={18} className={cn(
          m.type === "notes"      ? "text-green-700 dark:text-green-300" :
          m.type === "past_paper" ? "text-amber-700 dark:text-amber-300" :
          m.type === "slides"     ? "text-blue-700 dark:text-blue-300"   :
                                    "text-pink-700 dark:text-pink-300"
        )} />
      </div>

      {/* Middle — info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={cn("tag", MATERIAL_TYPE_STYLES[m.type])}>
            {MATERIAL_TYPE_LABELS[m.type]}
          </span>
          {m.subject && (
            <span className="text-xs text-gray-400 dark:text-gray-600">{m.subject}</span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
          by {m.uploader_name} · {formatPostTime(m.created_at)}
          {m.file_size && ` · ${formatFileSize(m.file_size)}`}
        </p>
      </div>

      {/* Right — upvote + download */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUpvote}
          disabled={hasVoted}
          title={hasVoted ? "already upvoted" : "upvote"}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all",
            hasVoted
              ? "bg-brand-light dark:bg-green-950 border-brand-mid text-brand dark:text-brand-mid cursor-default"
              : "border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-brand dark:hover:border-brand-mid hover:text-brand dark:hover:text-brand-mid"
          )}
        >
          <Star size={12} fill={hasVoted ? "currentColor" : "none"} />
          {m.upvotes}
        </button>

        <a
          href={m.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-brand dark:hover:border-brand-mid hover:text-brand dark:hover:text-brand-mid transition-all"
          title="open PDF"
        >
          <ArrowUpRight size={13} />
          open
        </a>
      </div>
    </div>
  );
}
