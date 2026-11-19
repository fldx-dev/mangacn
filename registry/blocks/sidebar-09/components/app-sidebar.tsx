"use client";

import { ArchiveXIcon, FileIcon, InboxIcon, PenToolIcon, SendIcon, Trash2Icon } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { NavUser } from "./nav-user";

// Based on shadcn/ui sidebar-09 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// Stock's nested sidebars, mail-style, with a manga studio's post in stock's shape: an icon rail
// of mailboxes and, beside it from md up, the open mailbox's letters from the editor, the
// assistants and the printer. Each inner sidebar is a navigation landmark with its own name. Where
// stock draws rules, a fill for the logo and a hover fill, mangacn's separators, an avatar and
// an underline do, so every line is the items'.

// This is sample data
const data = {
  user: {
    name: "Hana Mori",
    email: "hana@example.com",
    // No photo: the avatar shows the fallback's initials. Put an image URL here.
    avatar: "",
  },
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: <InboxIcon />,
      isActive: true,
    },
    {
      title: "Drafts",
      url: "#",
      icon: <FileIcon />,
      isActive: false,
    },
    {
      title: "Sent",
      url: "#",
      icon: <SendIcon />,
      isActive: false,
    },
    {
      title: "Junk",
      url: "#",
      icon: <ArchiveXIcon />,
      isActive: false,
    },
    {
      title: "Trash",
      url: "#",
      icon: <Trash2Icon />,
      isActive: false,
    },
  ],
  mails: [
    {
      name: "Kenji Arai",
      email: "kenji@example.com",
      subject: "Chapter 12 deadline",
      date: "09:34 AM",
      teaser:
        "Hi Hana, a reminder that the inks for chapter 12 are due Friday.\nSend the thumbnails for 13 when you can.",
    },
    {
      name: "Yuki Sato",
      email: "yuki@example.com",
      subject: "Re: Screentone pass",
      date: "Yesterday",
      teaser:
        "Tones are done on pages 1 to 9. The night scene on 7 needs a darker dot.\nShall I try the 60-line halftone there?",
    },
    {
      name: "Ren Okada",
      email: "ren@example.com",
      subject: "Lettering proofs",
      date: "2 days ago",
      teaser:
        "Proofs for the sound effects are attached.\nThe big KABOOM on page 14 might crowd the panel's edge.",
    },
    {
      name: "Mei Tanaka",
      email: "mei@example.com",
      subject: "Re: Cover colours",
      date: "2 days ago",
      teaser:
        "I've tried the cover in three palettes.\nCan we pick one on a quick call before the printer's slot?",
    },
    {
      name: "Inkpot Printing",
      email: "print@example.com",
      subject: "Volume 3 print slot",
      date: "1 week ago",
      teaser:
        "Your print slot for volume 3 is confirmed for the 24th.\nFiles are due in CMYK at 600 dpi the week before.",
    },
    {
      name: "Sora Ito",
      email: "sora@example.com",
      subject: "Re: Background references",
      date: "1 week ago",
      teaser:
        "I took photos of the harbour at dusk for the ferry scene.\nThey're in the shared folder under references.",
    },
    {
      name: "Aki Mori",
      email: "aki@example.com",
      subject: "New one-shot idea",
      date: "1 week ago",
      teaser:
        "I've been sketching a one-shot about a lighthouse keeper's cat.\nDo you have time this week to look at the storyboard?",
    },
    {
      name: "Nao Fujita",
      email: "nao@example.com",
      subject: "Convention table",
      date: "1 week ago",
      teaser:
        "Our table at the doujin market is booked for next month.\nI'll bring the prints if you can sign the books.",
    },
    {
      name: "Kenji Arai",
      email: "kenji.arai@example.com",
      subject: "Re: Reader survey",
      date: "1 week ago",
      teaser:
        "The survey came back: chapter 11 placed third this week.\nReaders loved the rooftop chase, so keep the pace.",
    },
    {
      name: "Rika Hoshino",
      email: "rika@example.com",
      subject: "Studio dinner",
      date: "1 week ago",
      teaser:
        "To celebrate the anime announcement, dinner is on the studio.\nAre you free next Friday evening? Tell me what you'd like.",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Note: I'm using state to show active item.
  // IRL you should use the url/router.
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const [mails, setMails] = React.useState(data.mails);
  const { setOpen } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        role="navigation"
        aria-label="Mailboxes"
        className="w-[calc(var(--sidebar-width-icon)+1px)]!"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" className="md:h-8 md:p-0" render={<a href="/" />}>
                <Avatar>
                  <AvatarFallback>
                    <PenToolIcon className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Inkpot Studio</span>
                  <span className="truncate text-xs">Weekly serial</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                        const mail = [...data.mails].sort(() => Math.random() - 0.5);
                        setMails(mail.slice(0, Math.max(5, Math.floor(Math.random() * 10) + 1)));
                        setOpen(true);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </Sidebar>
      <Separator orientation="vertical" className="hidden md:block" />

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar
        collapsible="none"
        role="navigation"
        aria-label={`${activeItem?.title ?? "Mailbox"} messages`}
        className="hidden flex-1 md:flex"
      >
        <SidebarHeader className="gap-3.5 p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">{activeItem?.title}</div>
            <Label className="flex items-center gap-2 text-sm">
              <span>Unreads</span>
              <Switch />
            </Label>
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarSeparator className="mx-0" />
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {mails.map((mail, index) => (
                <React.Fragment key={mail.email}>
                  {index > 0 ? <SidebarSeparator className="mx-0" /> : null}
                  <a
                    href={`mailto:${mail.email}`}
                    className="flex flex-col items-start gap-2 p-4 text-sm leading-tight whitespace-nowrap hover:underline"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span>{mail.name}</span> <span className="ml-auto text-xs">{mail.date}</span>
                    </div>
                    <span className="font-medium">{mail.subject}</span>
                    <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                      {mail.teaser}
                    </span>
                  </a>
                </React.Fragment>
              ))}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  );
}
