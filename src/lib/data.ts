import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CourseContent, Progress } from "./course-types";

export type CourseRow = {
  id: string; topic: string; level: string; title: string; created_at: string; completed_at: string | null;
  content: CourseContent; progress: Progress;
};

export const coursesQuery = queryOptions({
  queryKey: ["courses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as CourseRow[];
  },
});

export const courseQuery = (id: string) =>
  queryOptions({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").eq("id", id).single();
      if (error) throw error;
      return data as unknown as CourseRow;
    },
  });

export const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
    return { email: u.user?.email ?? "", display_name: data?.display_name ?? "Learner", avatar: data?.avatar ?? "a1", id: u.user!.id };
  },
});

export async function saveProgress(id: string, progress: Progress, completed: boolean) {
  const { error } = await supabase
    .from("courses")
    .update({ progress: progress as never, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}
