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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-container-low p-8 rounded-[2.5rem] z-[110] border border-outline-variant/20 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Configuración de Alertas</h3>
              <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                <Activity className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest">Notificaciones al Móvil</span>
                  <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black">ACTIVO</span>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Configuración Telegram</p>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      1. Crea un bot con <span className="text-primary">@BotFather</span> en Telegram.<br/>
                      2. Obtén tu <span className="text-primary">API Token</span>.<br/>
                      3. Obtén tu <span className="text-primary">Chat ID</span> (usa @userinfobot).
                    </p>
                  </div>

                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[9px] font-bold text-primary uppercase mb-1">INSTRUCCIONES PRECISAS</p>
                    <p className="text-[9px] text-on-surface-variant leading-relaxed">
                      1. El sistema ya tiene pre-configurados tus datos.<br/>
                      2. Presiona <span className="text-primary font-bold">"ENVIAR PRUEBA"</span> para verificar la conexión.<br/>
                      3. Las alertas se enviarán <span className="text-primary font-bold">AUTOMÁTICAMENTE</span> cuando la IA detecte una ruptura confirmada con una confianza {'>'} 80%.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <input 
                      type="text" 
                      placeholder="Telegram Bot Token" 
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-primary/50"
                    />
                    <input 
                      type="text" 
                      placeholder="Chat ID" 
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={onSendTest}
                    disabled={isSendingTest}
                    className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {isSendingTest ? "Enviando..." : "Enviar Prueba"}
                  </button>
                  <button className="flex-1 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors">Vincular Discord</button>
                </div>
              </div>

              <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold uppercase tracking-widest">Alertas Sonoras (PC)</span>
                  <div className="w-10 h-5 bg-primary rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-on-primary rounded-full shadow-sm"></div>
                  </div>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                  Se reproducirá un sonido "Ping" cuando una señal entre en zona de ruptura.
                </p>
              </div>
            </div>

            <button 
              onClick={onSave}
              className="w-full py-4 bg-primary text-on-primary rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
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
