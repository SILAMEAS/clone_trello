"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback } from "react";

type Props = {};

const menuItems = [
  {
    label: "Home",
    url: "/",
  },
  {
    label: "Pricing",
    url: "/pricing",
  },
  {
    label: "Services",
    url: "/services",
  },
];

const NavbarLink = (props: Props) => {
  const pathname = usePathname();
  const isActive = useCallback(
    (url: string) => {

      return url === "/" ? pathname === url : pathname.includes(url);
    },
    [pathname]
  );

  return (
    <div className="flex items-center gap-5">
      {menuItems.map((item) => (
        <Link
          href={item.url}
          key={item.label}
          className={`${isActive(item.url) && "text-primary-500"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default NavbarLink;
