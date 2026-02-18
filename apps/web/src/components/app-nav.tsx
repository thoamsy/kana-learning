"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/study", label: "Study" },
  { href: "/review", label: "Review" },
  { href: "/collection", label: "Collection" },
];

export function AppNav(): ReactElement {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Main navigation">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "nav-link active" : "nav-link"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
