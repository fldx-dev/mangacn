"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/ui/navigation-menu/navigation-menu";

const genres = [
  { href: "#shonen", title: "Shōnen", text: "Rivals, training arcs, louder SFX." },
  { href: "#shojo", title: "Shōjo", text: "Feelings drawn in screentone." },
  { href: "#seinen", title: "Seinen", text: "Slower, darker, heavier ink." },
  { href: "#josei", title: "Josei", text: "Work, rent and second chances." },
  { href: "#isekai", title: "Isekai", text: "One truck, another world." },
  { href: "#slice-of-life", title: "Slice of life", text: "Tea, rain and small days." },
];

export default function NavigationMenuLinkGridDemo() {
  return (
    <div className="flex min-h-[27rem] w-full items-start justify-center">
      <NavigationMenu aria-label="Browse" defaultValue="genres">
        <NavigationMenuList>
          <NavigationMenuItem value="genres">
            <NavigationMenuTrigger>Genres</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[min(28rem,calc(100vw-3rem))] gap-1 sm:grid-cols-2">
                {genres.map((genre) => (
                  <li key={genre.href}>
                    <NavigationMenuLink href={genre.href} className="flex-col items-start gap-0.5">
                      <span className="font-medium">{genre.title}</span>
                      <span className="text-muted-foreground">{genre.text}</span>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="magazines">
            <NavigationMenuTrigger>Magazines</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-48 gap-1">
                <li>
                  <NavigationMenuLink href="#weekly">Weekly</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#monthly">Monthly</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
