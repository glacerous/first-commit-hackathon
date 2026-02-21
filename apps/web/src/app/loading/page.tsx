"use client";

import { useEffect, useState } from "react";

type Step = {
    id: number;
    label: string;
    status: "pending" | "active" | "done";
};

const stepLabels = [
    "Validating repository structure",
    "Mapping dependency graph",
    "Analyzing architecture patterns",
    "Generating infrastructure model",
    "Finalizing system overview"
];

export default function LoadingScreen() {
    const [steps, setSteps] = useState<Step[]>([]);
    const [progress, setProgress] = useState(0);

    // Simulated process (replace later with backend polling)
    useEffect(() => {
        let current = 0;

        const interval = setInterval(() => {
            if (current >= stepLabels.length) {
                clearInterval(interval);
                setProgress(100);
                return;
            }

            setSteps((prev) => [
                ...prev.map((s) =>
                    s.status === "active" ? { ...s, status: "done" } : s
                ),
                {
                    id: current,
                    label: stepLabels[current],
                    status: "active"
                }
            ]);

            setProgress(Math.round(((current + 1) / stepLabels.length) * 100));
            current++;
        }, 2200);

        return () => clearInterval(interval);
    }, []);

    return (
        <main className="relative min-h-screen w-full overflow-hidden bg-black text-white selection:bg-white selection:text-black">

            {/* Background Video (same as homepage) */}
            <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
                <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                    <source
                        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
                        type="video/mp4"
                    />
                </video>
                <div className="absolute inset-0 bg-black/60 z-10" />
                <div className="grid-overlay absolute inset-0 z-20 pointer-events-none opacity-40" />
            </div>

            <section className="relative z-30 flex min-h-screen flex-col items-center justify-center px-6">

                {/* Circular Loader */}
                <div className="relative h-28 w-28 mb-12">
                    <svg className="h-full w-full -rotate-90">
                        <circle
                            cx="56"
                            cy="56"
                            r="50"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="2"
                            fill="none"
                        />
                        <circle
                            cx="56"
                            cy="56"
                            r="50"
                            stroke="white"
                            strokeWidth="2"
                            fill="none"
                            strokeDasharray={314}
                            strokeDashoffset={314 - (314 * progress) / 100}
                            className="transition-all duration-700 ease-out"
                        />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center text-[14px] text-white/60">
                        {progress}%
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-[22px] lg:text-[26px] font-medium tracking-tight mb-8 text-white/90">
                    Building Repository Model
                </h1>

                {/* Step List */}
                <div className="w-full max-w-md space-y-4">

                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`flex items-center gap-3 transition-all duration-500 ${step.status === "done"
                                ? "opacity-40"
                                : "opacity-100"
                                }`}
                        >
                            {/* Status Indicator */}
                            <div className="h-4 w-4 flex items-center justify-center">
                                {step.status === "done" ? (
                                    <div className="h-2 w-2 bg-white rounded-full" />
                                ) : (
                                    <div className="h-2 w-2 border border-white rounded-full animate-pulse" />
                                )}
                            </div>

                            {/* Label */}
                            <p
                                className={`text-[15px] tracking-wide ${step.status === "done"
                                    ? "line-through"
                                    : "text-white/80"
                                    }`}
                            >
                                {step.label}
                            </p>
                        </div>
                    ))}

                </div>

            </section>

            <style jsx global>{`
        .grid-overlay {
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 32px 32px;
        }
      `}</style>

        </main>
    );
}