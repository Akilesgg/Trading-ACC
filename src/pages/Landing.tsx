import React from "react";
import { motion } from "motion/react";
import { ArrowRight, Zap, Shield, TrendingUp, BarChart3, Users, Globe, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthProvider";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Señales IA en Tiempo Real",
      description: "Algoritmos avanzados que detectan BOS, CHoCH y liquidez institucional con un 85% de precisión."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Seguridad Institucional",
      description: "Tus datos y claves están protegidos con encriptación de grado militar y backend serverless."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      title: "Análisis Cuantitativo",
      description: "Cálculo dinámico de RSI, MACD, EMA y correlaciones con BTC para una toma de decisiones informada."
    }
  ];

  return (
    <div className="bg-background min-h-screen overflow-x-hidden relative">
      {/* Page Specific Background */}
      <div className="fixed inset-0 opacity-[0.08] grayscale contrast-150 pointer-events-none z-0">
        <img 
          src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop" 
          alt="Landing Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10">
        {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="px-6 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.4em] rounded-full border border-primary/20 shadow-xl shadow-primary/5">
              Trading de Próxima Generación
            </span>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-on-surface leading-[0.9]">
              Domina el Mercado con <span className="text-primary">Inteligencia Artificial</span>
            </h1>
            <p className="text-on-surface-variant max-w-3xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              La plataforma definitiva para traders que buscan señales precisas, análisis fundamental profundo y herramientas de nivel institucional.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button 
              onClick={() => user ? navigate("/dashboard") : login()}
              className="btn-primary px-16 py-6 text-sm group"
            >
              {user ? "Ir al Dashboard" : "Comenzar Ahora"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative mt-20 mx-auto max-w-5xl"
          >
            <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-[3rem] -z-10" />
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-[3rem] p-4 shadow-2xl overflow-hidden">
              <img 
                src="https://picsum.photos/seed/trading-dashboard/1920/1080" 
                alt="Dashboard Preview" 
                className="rounded-[2.5rem] w-full shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-8 bg-surface-container-low/50">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-on-surface">¿Por qué elegir Trading ACC?</h2>
            <p className="text-on-surface-variant uppercase tracking-widest text-[10px] font-black opacity-50">Tecnología de vanguardia para resultados reales</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="trading-card p-10 space-y-6 group hover:border-primary/30 transition-all"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <span className="text-5xl font-black text-primary tracking-tighter">10K+</span>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Usuarios Activos</p>
          </div>
          <div className="space-y-2">
            <span className="text-5xl font-black text-primary tracking-tighter">85%</span>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Win Rate IA</p>
          </div>
          <div className="space-y-2">
            <span className="text-5xl font-black text-primary tracking-tighter">$2B+</span>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Volumen Analizado</p>
          </div>
          <div className="space-y-2">
            <span className="text-5xl font-black text-primary tracking-tighter">24/7</span>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Monitoreo Live</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto trading-card p-16 text-center space-y-10 bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
          <div className="space-y-4">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-on-surface">¿Listo para transformar tu trading?</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
              Únete a miles de traders que ya están usando la inteligencia artificial para maximizar sus beneficios.
            </p>
          </div>
          <button 
            onClick={() => user ? navigate("/dashboard") : login()}
            className="btn-primary px-16 py-6 text-sm shadow-2xl shadow-primary/20"
          >
            Empieza Gratis Hoy
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-6 h-6 text-on-primary" />
            </div>
            <span className="text-2xl font-black uppercase tracking-tighter text-on-surface">Trading ACC</span>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Contacto</a>
          </div>
          <p className="text-[10px] font-black text-on-surface-variant opacity-50 uppercase tracking-widest">
            © 2026 Trading ACC. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
    </div>
  );
};

export default LandingPage;
