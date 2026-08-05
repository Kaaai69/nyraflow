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
  className?: string;
}>;

export function SectionHeading({
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <header className={`max-w-4xl ${className}`}>
      <h2 className="text-display text-balance text-[#F1F5F9]">
        {title}
      </h2>
      <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-[#94A3B8] md:text-xl">
        {description}
      </p>
    </header>
  );
}
