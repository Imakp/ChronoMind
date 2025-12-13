import { Suspense } from "react";
import { DailyLogs } from "@/components/daily-logs";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears, getDailyLogsList, getOrCreateDailyLog } from "@/lib/actions";
import { Loader2 } from "lucide-react";

interface DailyLogsPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function DailyLogsPage({ params }: DailyLogsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { year } = await params;
  const yearNumber = parseInt(year);
  const yearsResult = await getUserYears(session.user.id);
  const userYear = yearsResult.data?.find((y) => y.year === yearNumber);

  if (!userYear) redirect("/");

  // Parallel data fetching
  const today = new Date();
  const [logsResult, todayLogResult] = await Promise.all([
    getDailyLogsList(userYear.id),
    getOrCreateDailyLog(userYear.id, today)
  ]);

  const initialLogs = logsResult.success && logsResult.data ? logsResult.data : [];
  const todayLog = todayLogResult.success && todayLogResult.data ? todayLogResult.data : null;

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DailyLogs 
        yearId={userYear.id} 
        year={userYear.year} 
        initialLogs={initialLogs as any} // Cast because list logs might miss content, but component expects DailyLog[]
        todayLog={todayLog}
      />
    </Suspense>
  );
}
