import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TagExplorer } from "@/components/tag-explorer";
import { getUserYears } from "@/lib/actions";

export default async function TagsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Get the user's most recent year
  const yearsResult = await getUserYears(session.user.id);
  const currentYear =
    yearsResult.success && yearsResult.data && yearsResult.data.length > 0
      ? yearsResult.data[0].year
      : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TagExplorer userId={session.user.id} year={currentYear} />
        </div>
      </main>
    </div>
  );
}
