export type College = {
  id: string;
  name: string;
  city: string;
  state: string;
  approved: boolean;
  created_at: string;
};

export type MaterialType = "notes" | "past_paper" | "slides" | "summary";

export type Material = {
  id: string;
  college_id: string;
  branch: string;
  year: number;
  subject: string | null;
  title: string;
  type: MaterialType;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploader_name: string;
  upvotes: number;
  approved: boolean;
  created_at: string;
};

export type SavedClass = {
  collegeId: string;
  collegeName: string;
  branch: string;
  year: number;
};
