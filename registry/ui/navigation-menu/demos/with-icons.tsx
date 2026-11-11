"use client";

import { BookmarkIcon, ClockIcon, DownloadIcon, StarIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/ui/navigation-menu/navigation-menu";

export default function NavigationMenuWithIconsDemo() {
  return (
    <div className="flex min-h-72 w-full items-start justify-center">
      <NavigationMenu aria-label="Account" defaultValue="shelf">
        <NavigationMenuList>
          <NavigationMenuItem value="shelf">
            <NavigationMenuTrigger>My shelf</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-48 gap-1">
                <li>
                  <NavigationMenuLink href="#reading">
                    <ClockIcon />
                    Reading
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#bookmarked">
                    <BookmarkIcon />
                    Bookmarked
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#favourites">
                    <StarIcon />
                    Favourites
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#downloads">
                    <DownloadIcon />
                    Downloads
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="account">
            <NavigationMenuTrigger>Account</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-40 gap-1">
                <li>
                  <NavigationMenuLink href="#profile">Profile</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#settings">Settings</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
