import React from "react";

interface NovaOrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

export const NovaOrb: React.FC<NovaOrbProps> = ({
  size = "md",
  className = "",
  alt = "BOT BRO Logo",
}) => {
  const sizeMap = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-md select-none border border-black/10 dark:border-white/10 ${dim} ${className}`}
    >
      <img
        src="/bot-bro-logo.jpg"
        alt={alt}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  );
};

export const BotBroLogo = NovaOrb;
export default NovaOrb;
