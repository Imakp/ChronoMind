import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TagExplorer } from "@/components/tag-explorer";

export default async function TagsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TagExplorer userId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
