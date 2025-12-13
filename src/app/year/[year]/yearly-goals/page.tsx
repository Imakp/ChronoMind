import { Suspense } from "react";
import { YearlyGoals } from "@/components/yearly-goals";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears, getGoals } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface YearlyGoalsPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function YearlyGoalsPage({
  params,
}: YearlyGoalsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { year } = await params;
  const yearNumber = parseInt(year);
  const yearsResult = await getUserYears(session.user.id);
  const userYear = yearsResult.data?.find((y) => y.year === yearNumber);

  if (!userYear) redirect("/");

  const goalsResult = await getGoals(userYear.id);
  const initialGoals = goalsResult.success && goalsResult.data ? goalsResult.data : [];

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <YearlyGoals yearId={userYear.id} year={userYear.year} initialGoals={initialGoals} />
    </Suspense>
  );
}
