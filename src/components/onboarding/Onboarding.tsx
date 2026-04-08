import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Target, Shield, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Bienvenido a Trading ACC",
      description: "Tu nueva terminal de inteligencia artificial para dominar los mercados cripto.",
      icon: <Zap className="w-12 h-12 text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Señales de Alta Precisión",
      description: "Recibe alertas en tiempo real basadas en algoritmos cuantitativos y SMC.",
      icon: <Target className="w-12 h-12 text-primary" />,
      color: "bg-primary/10"
    },
    {
      title: "Seguridad Total",
      description: "Tus operaciones y datos están protegidos con tecnología de nivel institucional.",
      icon: <Shield className="w-12 h-12 text-primary" />,
      color: "bg-primary/10"
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="trading-card max-w-lg w-full p-12 text-center space-y-10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-container-high">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className={cn("w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10", currentStep.color)}>
              {currentStep.icon}
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-on-surface">{currentStep.title}</h2>
              <p className="text-on-surface-variant leading-relaxed">{currentStep.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => step < steps.length ? setStep(step + 1) : onComplete()}
            className="btn-primary w-full py-5 text-sm group"
          >
            {step === steps.length ? "Empezar a Operar" : "Siguiente"}
            {step === steps.length ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
          </button>
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i + 1 === step ? "w-6 bg-primary" : "bg-surface-container-highest"
                )}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
