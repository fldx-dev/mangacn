"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/registry/ui/navigation-menu/navigation-menu";

const series = [
  { href: "#ongoing", title: "Ongoing", text: "New chapters every week." },
  { href: "#completed", title: "Completed", text: "Finished runs, start to end." },
  { href: "#one-shots", title: "One-shots", text: "A whole story in one chapter." },
];

export default function NavigationMenuDefaultDemo() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center">
      <NavigationMenu aria-label="Site" defaultValue="series">
        <NavigationMenuList>
          <NavigationMenuItem value="series">
            <NavigationMenuTrigger>Series</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-60 gap-1">
                {series.map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink href={item.href} className="flex-col items-start gap-0.5">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-muted-foreground">{item.text}</span>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="chapters">
            <NavigationMenuTrigger>Chapters</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-48 gap-1">
                <li>
                  <NavigationMenuLink href="#latest">Latest</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#bookmarks">Bookmarks</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#library" className={navigationMenuTriggerStyle()}>
              Library
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
