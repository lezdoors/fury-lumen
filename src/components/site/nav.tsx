"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#box", label: "The box" },
  { href: "#work", label: "Output" },
  { href: "#prices", label: "Prices" },
  { href: "#arithmetic", label: "Arithmetic" },
];

export function Nav() {
  // The bar is transparent over the hero and only takes a surface once the
  // page has moved under it — the horizon should not be sitting behind glass.
  const [lifted, setLifted] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${lifted ? " nav--lifted" : ""}`}>
      <Link className="nav__mark" href="/">
        <Image src="/brand/lumen-mark.svg" alt="" width={22} height={22} aria-hidden />
        Lumen
      </Link>
      <ul className="nav__links">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
      <Link className="nav__cta" href="/studio">
        Open the studio
      </Link>
    </nav>
  );
}
