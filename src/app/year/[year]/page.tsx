import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears } from "@/lib/actions";
import YearDashboard from "@/components/year-dashboard";

interface YearPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function YearPage({ params }: YearPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { year } = await params;
  const yearNumber = parseInt(year);

  if (isNaN(yearNumber)) {
    redirect("/");
  }

  // Verify the user has access to this year
  const yearsResult = await getUserYears(session.user.id);

  if (!yearsResult.success) {
    redirect("/");
  }

  const userYear = yearsResult.data?.find((y) => y.year === yearNumber);

  if (!userYear) {
    // Year doesn't exist, redirect back to year selector
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <YearDashboard year={userYear} userId={session.user.id} />
      </main>
    </div>
  );
}
