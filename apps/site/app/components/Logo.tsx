type LogoProps = {
  className?: string;
  label?: boolean;
  light?: boolean;
};

export default function Logo({ className = "", label = true, light = false }: LogoProps) {
  const wordmark = light ? "text-white" : "text-[#16181d]";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="#16181D" />
        <path d="M8 18.5 12 9.5l3.1 6.1L18.2 12l1.8 6.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="18.5" r="2.25" fill="#FF5A4F" />
      </svg>
      {label && <span className={`${wordmark} text-[15px] font-semibold tracking-[-0.03em]`}>chaosline</span>}
    </span>
  );
}
