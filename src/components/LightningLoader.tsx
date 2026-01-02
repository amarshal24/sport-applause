import { motion } from "framer-motion";

interface LightningLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const LightningLoader = ({ size = "md", text }: LightningLoaderProps) => {
  const sizeClasses = {
    sm: "text-4xl",
    md: "text-6xl",
    lg: "text-8xl",
  };

  const containerSizes = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Lightning bolt container with glow effects */}
      <div className={`relative ${containerSizes[size]} flex items-center justify-center`}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner glow ring */}
        <motion.div
          className="absolute inset-4 rounded-full bg-primary/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Lightning bolt */}
        <motion.span
          className={`${sizeClasses[size]} z-10 drop-shadow-[0_0_15px_hsl(var(--primary))]`}
          animate={{
            scale: [1, 1.15, 1],
            filter: [
              "drop-shadow(0 0 10px hsl(var(--primary)))",
              "drop-shadow(0 0 25px hsl(var(--primary))) drop-shadow(0 0 40px hsl(var(--primary)))",
              "drop-shadow(0 0 10px hsl(var(--primary)))",
            ],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          ⚡️
        </motion.span>

        {/* Electric sparks */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full"
            style={{
              top: "50%",
              left: "50%",
            }}
            animate={{
              x: [0, Math.cos((i * 60 * Math.PI) / 180) * 60],
              y: [0, Math.sin((i * 60 * Math.PI) / 180) * 60],
              opacity: [1, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* Loading text */}
      {text && (
        <motion.p
          className="text-muted-foreground font-medium"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.p>
      )}

      {/* Brand name */}
      <motion.div
        className="flex items-center gap-1 text-lg font-bold"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className="text-foreground">U</span>
        <motion.span
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          ⚡️
        </motion.span>
        <span className="text-foreground">Sportz</span>
      </motion.div>
    </div>
  );
};

export default LightningLoader;
