import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#005b9f] via-blue-800 to-blue-600">
      <div className="flex h-screen items-center justify-center px-4">
        <div className="space-y-8 text-center max-w-4xl mx-auto">
          {/* CSIR Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="CSIR Stage-Gate Logo"
              className="h-16 md:h-20"
            />
          </div>

          <h1
            className={cn(
              "text-4xl md:text-6xl font-semibold text-white drop-shadow-md",
              font.className
            )}
          >
            CSIR Stage-Gate Platform
          </h1>

          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Streamline your research and development projects with our
            comprehensive stage-gate management system. Track progress, manage
            reviews, and ensure project success from concept to completion.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-project-diagram text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Project Management</h3>
              <p className="text-sm text-white/80">
                Manage projects across all stages with comprehensive tracking
                and reporting
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
              <div className="p-3 rounded-full bg-purple-50 text-purple-600 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-clipboard-check text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Gate Reviews</h3>
              <p className="text-sm text-white/80">
                Structured review process with decision tracking and
                documentation
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-all duration-300">
              <div className="p-3 rounded-full bg-green-50 text-green-600 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-file-alt text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2">Document Management</h3>
              <p className="text-sm text-white/80">
                Integrated SharePoint document storage and version control
              </p>
            </div>
          </div>

          <div className="mt-12">
            <LoginButton mode="modal" asChild>
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-[#005b9f] hover:bg-white/90 font-semibold px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Sign in to Platform
              </Button>
            </LoginButton>
          </div>

          <div className="mt-8 text-white/70 text-sm">
            <p>© 2024 CSIR. All rights reserved. | Version 1.0.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
