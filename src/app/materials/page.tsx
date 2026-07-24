import { createClient } from "@/lib/supabase/server";
import MaterialsClient from "./MaterialsClient";
import type { College, Material } from "@/types";

type Props = {
  searchParams: Promise<{
    collegeId?: string;
    branch?: string;
    year?: string;
    subject?: string;
    type?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const { collegeId, branch, year, subject, type } = params;
  const supabase = await createClient();

  // Fetch colleges for the filter UI
  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, city, state, approved, created_at")
    .eq("approved", true)
    .order("name");

  // Fetch materials if filters are set
  let materials: Material[] = [];
  let college: College | null = null;

  if (collegeId && branch && year) {
    const { data: collegeData } = await supabase
      .from("colleges")
      .select("*")
      .eq("id", collegeId)
      .single();
    college = collegeData;

    let q = supabase
      .from("materials")
      .select("*")
      .eq("college_id", collegeId)
      .eq("branch", branch)
      .eq("year", parseInt(year))
      .eq("approved", true)
      .order("upvotes", { ascending: false });

    if (subject) q = q.ilike("subject", `%${subject}%`);
    if (type && type !== "all") q = q.eq("type", type);

    const { data } = await q;
    materials = (data as Material[]) ?? [];
  }

  return (
    <MaterialsClient
      colleges={(colleges as College[]) ?? []}
      initialMaterials={materials}
      initialCollege={college}
      initialParams={{
        collegeId: collegeId ?? "",
        branch: branch ?? "",
        year: year ? parseInt(year) : 0,
        subject: subject ?? "",
        type: (type ?? "all") as string,
      }}
    />
  );
}
