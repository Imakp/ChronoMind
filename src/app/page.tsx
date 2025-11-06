import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/navigation/navbar";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to Your Year-Based Journal
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Hello, {session.user?.name || session.user?.email}!
              </p>
              <p className="text-gray-500">
                This is a protected page. You can only see this because you're
                authenticated.
              </p>
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  🚧 Dashboard coming soon! This will be where you select years
                  and access your journal sections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
