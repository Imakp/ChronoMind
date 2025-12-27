import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TagExplorer } from "@/components/tag-explorer";
import { getTagsForYear, getTaggedContentByTagAndYear } from "@/lib/actions";
import { Suspense } from "react";

import { Loader2 } from "lucide-react";

import type { TaggedContent } from "@/types";

interface TagWithCount {
  id: string;
  name: string;
  count: number;
}

interface TagsPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function TagsPage({ params }: TagsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { year } = await params;
  const yearNumber = parseInt(year);

  // Fetch initial tags server-side
  const tagsResult = await getTagsForYear(session.user.id, yearNumber);

  let initialTags: TagWithCount[] = [];
  let initialContent: TaggedContent[] = [];
  let initialSelectedTagId: string | null = null;

  if (tagsResult.success && tagsResult.data) {
    initialTags = tagsResult.data.map((t) => ({
      id: t.id,
      name: t.name,
      count: t._count.highlights,
    }));

    if (initialTags.length > 0) {
      initialSelectedTagId = initialTags[0].id;
      // Prefetch content for the first tag
      const contentResult = await getTaggedContentByTagAndYear(
        session.user.id,
        initialSelectedTagId as string,
        yearNumber
      );
      if (contentResult.success && contentResult.data) {
        initialContent = contentResult.data;
      }
    }
  }

  return (
    <div className="h-[calc(100vh-100px)]">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <TagExplorer
          userId={session.user.id}
          year={yearNumber}
          initialTags={initialTags}
          initialSelectedTagId={initialSelectedTagId}
          initialContent={initialContent}
        />
      </Suspense>
    </div>
  );
}
