import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TagExplorer } from "@/components/tag-explorer";

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

  return (
    <div className="h-full">
      <TagExplorer userId={session.user.id} />
    </div>
  );
}
