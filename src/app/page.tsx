import { auth, signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold">ChronoMind</h1>
          <p className="text-lg text-muted-foreground">
            Your year-based personal journal and knowledge management system
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button type="submit" size="lg">
              Sign in with Google
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {session.user?.name}</h1>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <Button variant="outline" type="submit">
            Sign out
          </Button>
        </form>
      </header>

      <main>
        <div className="text-center space-y-4">
          <h2 className="text-xl">ChronoMind Dashboard</h2>
          <p className="text-muted-foreground">
            Foundation setup complete! Ready for feature implementation.
          </p>
        </div>
      </main>
    </div>
  );
}
