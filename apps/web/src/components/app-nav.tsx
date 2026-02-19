"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

const links = [
  { href: "/", label: "Home", testId: "global-nav-home" },
  { href: "/study", label: "Study", testId: "global-nav-study" },
  { href: "/review", label: "Review", testId: "global-nav-review" },
  { href: "/collection", label: "Collection", testId: "global-nav-collection" },
];

export function AppNav(): ReactElement {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="app-nav" aria-label="Main navigation" data-testid="global-nav">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          data-testid={link.testId}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={isActive(link.href) ? "nav-link active" : "nav-link"}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
