import React from "react";
import { motion } from "motion/react";
import { Check, Zap, Shield, Star } from "lucide-react";
import { useAuth } from "../AuthProvider";
import { cn } from "@/lib/utils";

const PricingPage = () => {
  const { user, plan } = useAuth();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "0",
      description: "Para principiantes que quieren explorar el mercado.",
      features: [
        "Señales básicas (BTC/ETH)",
        "Terminal de trading",
        "Noticias en tiempo real",
        "Análisis IA limitado (3/día)"
      ],
      buttonText: "Plan Actual",
      highlight: false
    },
    {
      id: "pro",
      name: "Pro",
      price: "49",
      description: "Para traders serios que buscan una ventaja competitiva.",
      features: [
        "Todas las señales (100+ pares)",
        "Análisis IA ilimitado",
        "Alertas de Telegram",
        "Detección de ballenas",
        "Backtesting visual"
      ],
      buttonText: "Mejorar a Pro",
      highlight: true
    },
    {
      id: "elite",
      name: "Elite",
      price: "99",
      description: "Para instituciones y traders de alto rendimiento.",
      features: [
        "Todo lo de Pro",
        "Señales de alta frecuencia",
        "Acceso anticipado a gemas",
        "Soporte prioritario 24/7",
        "Copy Trading avanzado"
      ],
      buttonText: "Mejorar a Elite",
      highlight: false
    }
  ];

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      alert("Por favor, inicia sesión para suscribirte.");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, userId: user.uid })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20 px-8 max-w-7xl mx-auto"
    >
      <div className="text-center space-y-6 mb-20">
        <h1 className="text-5xl font-black uppercase tracking-tighter text-on-surface">Planes de Inversión</h1>
        <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
          Elige el plan que mejor se adapte a tu estilo de trading y comienza a operar con inteligencia artificial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -10 }}
            className={cn(
              "trading-card p-10 flex flex-col gap-8 relative overflow-hidden",
              p.highlight ? "border-primary/50 shadow-2xl shadow-primary/10" : "border-outline-variant/10"
            )}
          >
            {p.highlight && (
              <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
                Recomendado
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-on-surface">{p.name}</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">{p.description}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-on-surface">${p.price}</span>
              <span className="text-on-surface-variant text-sm font-bold">/mes</span>
            </div>

            <div className="space-y-4 flex-1">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-on-surface-variant">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(p.id)}
              disabled={plan.toLowerCase() === p.id}
              className={cn(
                "w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
                p.highlight 
                  ? "bg-primary text-on-primary shadow-xl shadow-primary/20 hover:scale-105" 
                  : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
                plan.toLowerCase() === p.id && "opacity-50 cursor-not-allowed"
              )}
            >
              {plan.toLowerCase() === p.id ? "Plan Actual" : p.buttonText}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-tighter text-on-surface">Activación Instantánea</h4>
          <p className="text-sm text-on-surface-variant">Acceso inmediato a todas las funciones tras el pago.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-tighter text-on-surface">Pago Seguro</h4>
          <p className="text-sm text-on-surface-variant">Procesado por Stripe con encriptación de nivel bancario.</p>
        </div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-tighter text-on-surface">Sin Compromiso</h4>
          <p className="text-sm text-on-surface-variant">Cancela tu suscripción en cualquier momento desde tu perfil.</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingPage;
