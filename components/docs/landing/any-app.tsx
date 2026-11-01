import { cn } from "cn";
import type { ReactNode } from "react";
import { Badge } from "@/registry/ui/badge/badge";
import { Button } from "@/registry/ui/button/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/ui/card/card";
import { Checkbox } from "@/registry/ui/checkbox/checkbox";
import { Input } from "@/registry/ui/input/input";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/ui/progress/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";
import { Switch } from "@/registry/ui/switch/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/registry/ui/table/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";
import { TABLE_FITS } from "./fit";

const RELEASES = {
  week: [
    { name: "Billing page", owner: "Mio", status: "Shipped" },
    { name: "Usage alerts", owner: "Ren", status: "Review" },
    { name: "Team invites", owner: "Sora", status: "Building" },
  ],
  month: [
    { name: "Audit log", owner: "Ren", status: "Shipped" },
    { name: "SSO", owner: "Mio", status: "Shipped" },
    { name: "Billing page", owner: "Mio", status: "Shipped" },
  ],
};

const STACKS = [
  { label: "Pick a framework", value: null },
  { label: "Next.js", value: "next" },
  { label: "React Router", value: "react-router" },
  { label: "Vite", value: "vite" },
];

function ReleaseTable({ rows }: { rows: (typeof RELEASES)["week"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Feature</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.name}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.owner}</TableCell>
            <TableCell>{row.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** A release dashboard from the primitives alone: card, tabs, table, progress, badges, button. */
function Dashboard() {
  return (
    <Card className={cn("w-full min-w-0", TABLE_FITS)}>
      <CardHeader>
        <CardTitle>Releases</CardTitle>
        <CardDescription>What the team shipped and what is next.</CardDescription>
        <CardAction className="flex gap-1.5">
          <Badge variant="secondary">Q4</Badge>
          <Badge variant="outline">Beta</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4">
        <Tabs defaultValue="week" className="min-w-0 gap-3">
          <TabsList variant="line" aria-label="Period">
            <TabsTrigger value="week">This week</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
          <TabsContent value="week">
            <ReleaseTable rows={RELEASES.week} />
          </TabsContent>
          <TabsContent value="month">
            <ReleaseTable rows={RELEASES.month} />
          </TabsContent>
        </Tabs>
        <Progress value={72} className="w-full">
          <ProgressLabel>Roadmap done</ProgressLabel>
          <ProgressValue />
        </Progress>
      </CardContent>
      <CardFooter>
        <Button type="button" className="w-full sm:w-auto">
          New release
        </Button>
      </CardFooter>
    </Card>
  );
}

/** A sign-up form from the primitives alone: input, select, checkbox, switch, buttons. */
function SignUp() {
  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle>Create your workspace</CardTitle>
        <CardDescription>An email and a framework, then you are in.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="grid gap-1.5">
          <label htmlFor="any-app-email" className="font-medium">
            Work email
          </label>
          <Input id="any-app-email" type="email" placeholder="you@company.com" />
        </div>
        <div className="grid gap-1.5">
          <span id="any-app-stack-label" className="font-medium">
            Framework
          </span>
          <Select items={STACKS}>
            <SelectTrigger aria-labelledby="any-app-stack-label" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STACKS.map((stack) => (
                  <SelectItem key={stack.label} value={stack.value}>
                    {stack.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="any-app-terms" />
          <label htmlFor="any-app-terms">I accept the terms</label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="any-app-notes" defaultChecked />
          <label htmlFor="any-app-notes">Email me release notes</label>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button">Create workspace</Button>
        <Button type="button" variant="outline">
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}

function Column({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className="m-0 flex min-w-0 flex-col gap-4">
      {children}
      <figcaption className="text-pretty text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/** Section 5: the primitives in ordinary product UI, with no manga-native piece in sight. */
export function AnyApp({ primitives }: { primitives: number }) {
  return (
    <section
      data-landing="any-app"
      aria-labelledby="landing-any-app"
      className="border-t bg-tone-1"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:py-20">
        <div className="flex flex-col gap-2">
          <h2 id="landing-any-app" className="font-display text-3xl sm:text-4xl">
            Works in any app
          </h2>
          <p className="max-w-prose text-pretty">
            No panels, no bubbles: the same primitives you already use, drawn in ink.
          </p>
        </div>
        <div className="grid min-w-0 gap-10 md:grid-cols-2 md:items-start">
          <Column
            caption={`The ${primitives} primitives keep shadcn's API; a stock dashboard becomes this by swapping imports.`}
          >
            <Dashboard />
          </Column>
          <Column caption="Labels, focus rings and keyboard behaviour stay as Base UI ships them; only the ink is new.">
            <SignUp />
          </Column>
        </div>
      </div>
    </section>
  );
}
