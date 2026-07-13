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
      className={`mx-auto w-full max-w-[1240px] px-6 md:px-10 xl:px-16 ${className}`}
    >
      {children}
    </div>
  );
}
type SectionHeadingProps = Readonly<{
  title: string;
  description: string;
  className?: string;
}>;

export function SectionHeading({
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <header className={`max-w-4xl ${className}`}>
      <h2 className="text-balance text-[clamp(2.375rem,5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
        {title}
      </h2>
      <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-text-secondary md:text-xl">
        {description}
      </p>
    </header>
  );
}
