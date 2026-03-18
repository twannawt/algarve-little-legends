import { RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingResetButtonProps {
  visible: boolean;
  onReset: () => void;
}

export function FloatingResetButton({ visible, onReset }: FloatingResetButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed bottom-24 right-4" style={{ zIndex: 10000 }}>
          <motion.button
            data-testid="reset-filters-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              onReset();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow active:scale-95"
            aria-label="Filters resetten"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
