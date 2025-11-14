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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <YearSelector
            availableYears={availableYears}
            userId={session.user.id}
          />
        </div>
      </main>
    </div>
  );
}
