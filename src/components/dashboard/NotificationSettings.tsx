import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Activity } from "lucide-react";

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  telegramToken: string;
  setTelegramToken: (val: string) => void;
  telegramChatId: string;
  setTelegramChatId: (val: string) => void;
  onSendTest: () => void;
  onSave: () => void;
  isSendingTest: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  isOpen,
  onClose,
  telegramToken,
  setTelegramToken,
  telegramChatId,
  setTelegramChatId,
  onSendTest,
  onSave,
  isSendingTest
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg trading-card p-10 z-[110] shadow-[0_0_100px_rgba(0,255,163,0.1)] space-y-8 rounded-[3rem]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-on-surface">Configuración de Alertas</h3>
              <button 
                onClick={onClose} 
                className="p-3 bg-surface-container-high hover:border-primary/30 rounded-2xl border border-outline-variant/10 transition-all group shadow-lg"
              >
                <Activity className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 bg-surface-container-high rounded-[2rem] border border-outline-variant/10 space-y-6 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-on-surface opacity-70">Notificaciones al Móvil</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-3 py-1 rounded-lg font-black border border-primary/20 shadow-lg shadow-primary/5">ACTIVO</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-70">Configuración Telegram</p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium opacity-80">
                      1. Crea un bot con <span className="text-primary font-black">@BotFather</span> en Telegram.<br/>
                      2. Obtén tu <span className="text-primary font-black">API Token</span>.<br/>
                      3. Obtén tu <span className="text-primary font-black">Chat ID</span> (usa @userinfobot).
                    </p>
                  </div>

                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-all duration-1000"></div>
                    <p className="text-[10px] font-black text-primary uppercase mb-2 relative z-10">INSTRUCCIONES PRECISAS</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed font-black uppercase tracking-widest opacity-70 relative z-10">
                      1. El sistema ya tiene pre-configurados tus datos.<br/>
                      2. Presiona <span className="text-primary">"ENVIAR PRUEBA"</span> para verificar la conexión.<br/>
                      3. Las alertas se enviarán <span className="text-primary">AUTOMÁTICAMENTE</span> cuando la IA detecte una ruptura confirmada con una confianza {'>'} 80%.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="text" 
                      placeholder="TELEGRAM BOT TOKEN" 
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 shadow-inner placeholder:text-on-surface-variant/30"
                    />
                    <input 
                      type="text" 
                      placeholder="CHAT ID" 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 shadow-inner placeholder:text-on-surface-variant/30"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={onSendTest}
                    disabled={isSendingTest}
                    className="flex-1 py-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50 shadow-lg"
                  >
                    {isSendingTest ? "Enviando..." : "Enviar Prueba"}
                  </button>
                  <button className="flex-1 py-3 bg-surface-container-highest rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-outline-variant/10 shadow-lg">Vincular Discord</button>
                </div>
              </div>

              <div className="p-6 bg-surface-container-high rounded-[2rem] border border-outline-variant/10 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-widest text-on-surface opacity-70">Alertas Sonoras (PC)</span>
                  <div className="w-12 h-6 bg-primary rounded-full relative shadow-lg shadow-primary/20">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-on-primary rounded-full shadow-sm"></div>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest font-black opacity-50">
                  Se reproducirá un sonido "Ping" cuando una señal entre en zona de ruptura.
                </p>
              </div>
            </div>

            <button 
              onClick={onSave}
              className="btn-primary w-full py-5 text-[11px]"
            >
              Guardar Configuración
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationSettings;
