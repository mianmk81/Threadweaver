"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import CompanySetupModal from "@/components/ui/CompanySetupModal";
import { useThreadweaverStore } from "@/lib/store/useThreadweaverStore";
import { generateCustomCards } from "@/lib/utils/api";
import type { CompanyProfile } from "@/lib/types";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const { setCompanyProfile, createSession } = useThreadweaverStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCompanySetupComplete = async (profile: CompanyProfile) => {
    setCompanyProfile(profile);
    setShowCompanySetup(false);
    setIsGeneratingCards(true);

    try {
      // Generate custom cards based on company profile
      const response = await generateCustomCards({
        companyProfile: profile,
        numberOfCards: 10,
      });

      console.log(`Generated ${response.cards.length} custom cards for ${profile.companyName}`);

      // Create session with custom profile
      createSession(`${profile.industry} - ${profile.companyName}`, profile);

      // Navigate to loom
      router.push('/loom');
    } catch (error) {
      console.error('Failed to generate custom cards:', error);
      // Fallback to default scenario on error
      createSession(`${profile.industry} - ${profile.companyName}`, profile);
      router.push('/loom');
    } finally {
      setIsGeneratingCards(false);
    }
  };

  const handleSkipSetup = () => {
    createSession('Campus Dining / Restaurant Group');
    setShowCompanySetup(false);
    router.push('/loom');
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Cosmic background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && (
          <>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background:
                    i % 2 === 0 ? "var(--color-gold)" : "var(--color-emerald)",
                  opacity: Math.random() * 0.5 + 0.2,
                  animation: `float ${Math.random() * 6 + 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
        {/* Title section */}
        <div className="mb-12 space-y-6">
          <h1
            className="text-6xl font-bold tracking-tight md:text-7xl lg:text-8xl"
            style={{
              background: "linear-gradient(135deg, var(--color-gold), var(--color-emerald))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "0 0 40px rgba(255, 215, 0, 0.3)",
            }}
          >
            Threadweaver
          </h1>
          <p
            className="text-2xl font-light tracking-wide md:text-3xl"
            style={{ color: "var(--color-gold)" }}
          >
            Sustainable Futures
          </p>
        </div>

        {/* Description */}
        <div className="mb-16 max-w-2xl space-y-4">
          <p className="text-lg leading-relaxed text-gray-300 md:text-xl">
            You are a <span style={{ color: "var(--color-gold)" }}>Chronomancer</span>,
            a weaver of time's fabric. Make sustainability decisions across{" "}
            <span style={{ color: "var(--color-emerald)" }}>6 critical metrics</span>,
            jump forward through time, and rewind to explore alternate futures.
          </p>
          <p className="text-base leading-relaxed text-gray-400 md:text-lg">
            This is not prediction—it's a counterfactual engine for understanding how
            sustainability choices compound across time.
          </p>
        </div>

        {/* Metrics preview */}
        <div className="mb-16 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { name: "Waste", icon: "♻️" },
            { name: "Emissions", icon: "🌍" },
            { name: "Cost", icon: "💰" },
            { name: "Efficiency", icon: "⚡" },
            { name: "Trust", icon: "🤝" },
            { name: "Score", icon: "⭐" },
          ].map((metric, i) => (
            <div
              key={metric.name}
              className="card-cosmic flex flex-col items-center gap-2 p-4"
              style={{
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-sm font-medium text-gray-300">{metric.name}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col items-center gap-4">
          {/* Customize Company Button */}
          <button
            onClick={() => setShowCompanySetup(true)}
            disabled={isGeneratingCards}
            className="btn-ghost group relative overflow-hidden text-base border-2 border-emerald/50 hover:border-emerald"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <span>Customize Your Company</span>
            </span>
            {/* Hover glow effect */}
            <div
              className="absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(16, 185, 129, 0.2), transparent)",
              }}
            />
          </button>

          {/* Enter the Loom Button */}
          <Link
            href="/loom"
            className="btn-primary group relative overflow-hidden text-lg shadow-lg"
            style={{
              boxShadow: "0 0 30px rgba(255, 215, 0, 0.4)",
            }}
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className="text-2xl">🧵</span>
              <span>Enter the Loom</span>
              <span className="text-2xl">✨</span>
            </span>
            {/* Hover glow effect */}
            <div
              className="absolute inset-0 -z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255, 215, 0, 0.3), transparent)",
              }}
            />
          </Link>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-2">
            Customize your company for personalized scenarios, or jump right in with the default experience
          </p>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-4xl gap-6 md:grid-cols-3">
          <div className="space-y-2 text-center">
            <div className="text-3xl">⏰</div>
            <h3 className="font-semibold" style={{ color: "var(--color-gold)" }}>
              Time Travel
            </h3>
            <p className="text-sm text-gray-400">
              Jump forward 3, 6, or 12 months to see your decisions unfold
            </p>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-3xl">🔄</div>
            <h3 className="font-semibold" style={{ color: "var(--color-gold)" }}>
              Reweave Timelines
            </h3>
            <p className="text-sm text-gray-400">
              Rewind to any decision and create alternate futures to compare
            </p>
          </div>
          <div className="space-y-2 text-center">
            <div className="text-3xl">🤖</div>
            <h3 className="font-semibold" style={{ color: "var(--color-gold)" }}>
              AI Oracle
            </h3>
            <p className="text-sm text-gray-400">
              Explainable AI generates decisions based on your current state
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-sm text-gray-500">
          <p>
            A simulation engine by{" "}
            <span style={{ color: "var(--color-emerald)" }}>Chronomancers</span>
          </p>
        </div>
      </main>

      {/* Company Setup Modal */}
      <CompanySetupModal
        isOpen={showCompanySetup}
        onComplete={handleCompanySetupComplete}
        onSkip={handleSkipSetup}
      />

      {/* Loading overlay when generating cards */}
      {isGeneratingCards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gold border-t-transparent mb-4"></div>
            <p className="text-gold text-lg font-semibold">Generating personalized scenarios...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
