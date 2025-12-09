import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears } from "@/lib/actions";
import YearSelector from "@/components/year-selector";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  // Fetch user's existing years
  const yearsResult = await getUserYears(session.user.id);
  const availableYears = yearsResult.success ? yearsResult.data || [] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Centered Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl">
          <YearSelector
            availableYears={availableYears}
            userId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
