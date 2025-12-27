import { QuarterlyReflections } from "@/components/quarterly-reflections";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getQuarterlyReflections, getUserYears } from "@/lib/actions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

interface QuarterlyReflectionsPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function QuarterlyReflectionsPage({
  params,
}: QuarterlyReflectionsPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { year } = await params;
  const yearNumber = parseInt(year);
  const yearsResult = await getUserYears(session.user.id);
  const userYear = yearsResult.data?.find((y) => y.year === yearNumber);

  if (!userYear) redirect("/");

  // Fetch initial data
  const initialDataResult = await getQuarterlyReflections(userYear.id);
  const initialData =
    initialDataResult.success && initialDataResult.data
      ? initialDataResult.data
      : [];

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <QuarterlyReflections
        yearId={userYear.id}
        year={userYear.year}
        initialData={initialData}
      />
    </Suspense>
  );
}
