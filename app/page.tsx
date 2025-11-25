import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  FileText,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";

const headingFont = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#005b9f] via-blue-800 to-blue-600 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="CSIR Logo" className="h-10 md:h-12" />
            <span className="text-white font-semibold text-lg hidden sm:block">
              Stage-Gate Platform
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-white text-[#005b9f] hover:bg-white/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white/90 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Trusted by CSIR Research Teams</span>
          </div>

          {/* Main Heading */}
          <h1
            className={cn(
              "text-5xl md:text-7xl font-bold text-white drop-shadow-2xl leading-tight",
              headingFont.className
            )}
          >
            Transform Your R&D
            <br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
              Project Management
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/90 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Streamline research and development with our comprehensive
            stage-gate management system. Track progress, manage reviews, and
            drive innovation from concept to completion.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-white/70 text-sm">Active Projects</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-white/70 text-sm">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-white/70 text-sm">Research Teams</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 bg-white/5 backdrop-blur-md border-t border-white/10">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2
              className={cn(
                "text-3xl md:text-5xl font-bold text-white mb-4",
                headingFont.className
              )}
            >
              Everything You Need to Succeed
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Powerful features designed for modern research and development
              teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Project Management
              </h3>
              <p className="text-white/70 leading-relaxed">
                Manage projects across all stages with comprehensive tracking,
                real-time updates, and detailed reporting capabilities.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Gate Reviews
              </h3>
              <p className="text-white/70 leading-relaxed">
                Structured review process with multi-reviewer support, decision
                tracking, and comprehensive documentation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Document Management
              </h3>
              <p className="text-white/70 leading-relaxed">
                Integrated SharePoint document storage with version control,
                secure sharing, and seamless collaboration.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Team Collaboration
              </h3>
              <p className="text-white/70 leading-relaxed">
                Real-time collaboration tools, role-based access control, and
                seamless communication across teams.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Analytics & Insights
              </h3>
              <p className="text-white/70 leading-relaxed">
                Powerful analytics dashboard with custom reports, KPI tracking,
                and data-driven decision making tools.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 border border-white/10 hover:border-white/20 group">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Enterprise Security
              </h3>
              <p className="text-white/70 leading-relaxed">
                Bank-level security with OAuth integration, role-based
                permissions, and comprehensive audit trails.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-white/70 text-sm mb-4 md:mb-0">
              © 2024 CSIR. All rights reserved. | Version 2.0.0
            </div>
            <div className="flex items-center space-x-6 text-sm text-white/70">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
