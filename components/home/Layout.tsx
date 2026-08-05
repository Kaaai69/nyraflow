import type { ReactNode } from "react";

type SectionContainerProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function SectionContainer({
  children,
  className = "",
}: SectionContainerProps) {
  return (
    <div
      className={`mx-auto w-full max-w-site px-gutter-mobile md:px-gutter-tablet xl:px-gutter-desktop ${className}`}
    >
      {children}
    </div>
  );
}

type SectionHeadingProps = Readonly<{
  title: string;
  description: string;
  lightTheme?: boolean;
  className?: string;
}>;

export function SectionHeading({
  title,
  description,
  lightTheme = false,
  className = "",
}: SectionHeadingProps) {
  return (
    <header className={`max-w-4xl ${className}`}>
      <h2
        className={`text-display text-balance font-bold tracking-tight ${
          lightTheme ? "text-[#101114]" : "text-[#FFFFFF]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-6 max-w-[65ch] text-lg leading-relaxed md:text-xl ${
          lightTheme ? "text-[#101114]/75" : "text-white/70"
        }`}
      >
        {description}
      </p>
    </header>
  );
}
