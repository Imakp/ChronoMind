import YearDashboard from "@/components/year-dashboard";

interface YearPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function YearPage({ params }: YearPageProps) {
  const { year } = await params;
  const yearNumber = parseInt(year);

  return <YearDashboard year={yearNumber} />;
}
