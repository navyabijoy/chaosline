"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { docNavGroups } from "../docNavConfig";

interface Props {
  mobile?: boolean;
  onClose?: () => void;
}

export default function DocsSidebar({ mobile = false, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (slug: string) => {
    if (slug === "") return pathname === "/docs" || pathname === "/docs/";
    return pathname === `/docs/${slug}`;
  };

  return (
    <nav
      aria-label="Documentation navigation"
      className={mobile ? "px-4 py-6" : "pt-6 pb-8 pr-4"}
    >
      <div className="space-y-8">
        {docNavGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-[13px] font-semibold text-ink mb-2 px-3">
              {group.title}
            </h4>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.slug);
                const href = item.slug ? `/docs/${item.slug}` : "/docs";
                return (
                  <li key={item.slug || "index"}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center px-3 py-1.5 rounded-[6px] text-[13px] transition-colors ${
                        active
                          ? "bg-[#eef5ed] text-[#196b42] font-medium" // using a Mireye-like green for active state
                          : "text-ink/60 hover:text-ink hover:bg-[#f5f5f7]"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
