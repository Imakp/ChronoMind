import { CreativeDump } from "@/components/creative-dump";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserYears } from "@/lib/actions";

interface CreativeDumpPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function CreativeDumpPage({
  params,
}: CreativeDumpPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { year } = await params;
  const yearNumber = parseInt(year);
  const yearsResult = await getUserYears(session.user.id);
  const userYear = yearsResult.data?.find((y) => y.year === yearNumber);

  if (!userYear) redirect("/");

  return <CreativeDump yearId={userYear.id} year={userYear.year} />;
}
