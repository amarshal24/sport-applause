import { motion } from "framer-motion";

export type FilterType = "none" | "sparkle" | "fire" | "confetti" | "glow" | "victory";

interface AnimatedFilterProps {
  type: FilterType;
}

export const AnimatedFilter = ({ type }: AnimatedFilterProps) => {
  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {type === "sparkle" && <SparkleFilter />}
      {type === "fire" && <FireFilter />}
      {type === "confetti" && <ConfettiFilter />}
      {type === "glow" && <GlowFilter />}
      {type === "victory" && <VictoryFilter />}
    </div>
  );
};

const SparkleFilter = () => {
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            scale: 0,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  );
};

const FireFilter = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 w-8 h-8"
          style={{
            left: `${(i / 8) * 100}%`,
            background: "radial-gradient(circle, hsl(var(--energy-orange)), transparent)"
          }}
          animate={{
            y: [0, -100],
            scale: [1, 1.5, 0],
            opacity: [0.8, 0.5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}
    </>
  );
};

const ConfettiFilter = () => {
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            backgroundColor: i % 3 === 0 ? "hsl(var(--primary))" : 
                           i % 3 === 1 ? "hsl(var(--secondary))" : 
                           "hsl(var(--accent))",
            borderRadius: i % 2 === 0 ? "50%" : "0"
          }}
          animate={{
            y: ["0%", "110%"],
            rotate: [0, 360],
            x: [0, Math.random() * 40 - 20]
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}
    </>
  );
};

const GlowFilter = () => {
  return (
    <motion.div
      className="absolute inset-0 rounded-lg"
      style={{
        background: "radial-gradient(circle at center, hsl(var(--stadium-glow) / 0.3), transparent)",
        boxShadow: "0 0 40px hsl(var(--stadium-glow) / 0.6)"
      }}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.95, 1.05, 0.95]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

const VictoryFilter = () => {
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-lg border-4"
        style={{
          borderColor: "hsl(var(--victory-green))",
          boxShadow: "0 0 30px hsl(var(--victory-green) / 0.5)"
        }}
        animate={{
          borderWidth: ["2px", "4px", "2px"],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-8 bg-accent"
          style={{
            left: `${(i / 6) * 100}%`,
            top: "50%"
          }}
          animate={{
            scaleY: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        />
      ))}
    </>
  );
};
