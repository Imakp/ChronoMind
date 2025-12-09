import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears } from "@/lib/actions";
import { AppShell } from "@/components/layout/app-shell";

interface YearLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    year: string;
  }>;
}

export default async function YearLayout({
  children,
  params,
}: YearLayoutProps) {
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
    redirect("/");
  }

  return (
    <AppShell year={userYear.year} userId={session.user.id}>
      {children}
    </AppShell>
  );
}
