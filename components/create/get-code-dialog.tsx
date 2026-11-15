"use client";

import {
  CodeBlockTab,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { Check, Copy } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { PersistedTabs } from "@/components/docs/persisted-tabs";
import { createCommands, PROJECT_NAME } from "@/lib/create/commands";
import type { CreateConfig } from "@/lib/create/config";
import { agentPrompt, configSummary, FRAMEWORK_NAMES } from "@/lib/create/describe";
import type { Framework, InstalledItem, InstallPlan } from "@/lib/create/files";
import { PACKAGE_MANAGERS, type PackageManager } from "@/lib/docs/package-managers";
import { Button } from "@/registry/ui/button/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/ui/dialog/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/ui/tabs/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

export interface GetCodeDialogProps {
  /** The configuration's canonical code. */
  code: string;
  /** The configuration itself: every command and file is built from it, never from the URL. */
  config: CreateConfig;
}

const CONFIRM_MS = 2000;
const FRAMEWORKS: Framework[] = ["next", "vite"];

/** Copies text and reports it through the dialog's one polite status region. */
function useCopy(announce: (message: string) => void) {
  const [copied, setCopied] = useState<string | null>(null);
  const timeout = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timeout.current), []);
  const copy = async (key: string, text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      announce(`Could not copy the ${label}; select the text instead.`);
      return;
    }
    setCopied(key);
    announce(`${label[0].toUpperCase()}${label.slice(1)} copied`);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setCopied(null), CONFIRM_MS);
  };
  return { copied, copy };
}

type CopyFn = ReturnType<typeof useCopy>;

/** A command or prompt that wraps instead of scrolling, with its copy button. */
function CopyBlock({
  id,
  text,
  label,
  copier,
  slot,
}: {
  id: string;
  text: string;
  label: string;
  copier: CopyFn;
  slot: string;
}) {
  const done = copier.copied === id;
  return (
    <div className="flex items-start gap-1 rounded-lg border bg-muted/40 py-1.5 pr-1 pl-2.5">
      <pre
        data-slot={slot}
        className="min-w-0 flex-1 py-1 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap"
      >
        <code>{text}</code>
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0"
        aria-label={`Copy ${label}`}
        onClick={() => copier.copy(id, text, label)}
      >
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </div>
  );
}

/**
 * The package-manager tabs, remembered with the item pages' (`PersistedTabs`, group
 * `package-manager`). Controlled, so the agent prompt follows the same choice.
 */
function ManagerTabs({
  manager,
  onManager,
  children,
}: {
  manager: PackageManager;
  onManager: (manager: PackageManager) => void;
  children: (manager: PackageManager) => ReactNode;
}) {
  return (
    <PersistedTabs
      groupId="package-manager"
      value={manager}
      onValueChange={(value) => onManager(value as PackageManager)}
      className="my-0"
    >
      <CodeBlockTabsList aria-label="Package manager">
        {PACKAGE_MANAGERS.map((name) => (
          <CodeBlockTabsTrigger key={name} value={name}>
            {name}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {PACKAGE_MANAGERS.map((name) => (
        <CodeBlockTab key={name} value={name} className="grid gap-2 p-2">
          {children(name)}
        </CodeBlockTab>
      ))}
    </PersistedTabs>
  );
}

function FileList({ items }: { items: InstalledItem[] }) {
  return (
    <ul className="grid gap-1.5">
      {items.map((item) => (
        <li key={item.name} className="grid gap-0.5">
          <span className="font-medium">{item.title}</span>
          <span className="font-mono text-xs break-all text-muted-foreground">
            {item.files.join(", ") || "no file"}
            {item.skipped.length > 0 && ` (skipped in Vite: ${item.skipped.join(", ")})`}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The files each install writes, read from the catalog once the dialog opens. */
function WhatYouGet({ config, framework }: { config: CreateConfig; framework: Framework }) {
  const [plan, setPlan] = useState<InstallPlan | null>(null);
  useEffect(() => {
    let live = true;
    import("@/lib/create/files").then(({ installPlan }) => {
      if (live) setPlan(installPlan(config, framework));
    });
    return () => {
      live = false;
    };
  }, [config, framework]);

  if (!plan) return <p className="text-muted-foreground">Reading the catalog…</p>;
  return (
    <div className="grid gap-4" data-slot="create-files">
      <p className="text-muted-foreground">
        In a new {FRAMEWORK_NAMES[framework]} project. Everything is plain source you can edit.
      </p>
      <section className="grid gap-1.5" aria-labelledby="create-files-theme">
        <h3 id="create-files-theme" className="font-heading text-base">
          Theme and fonts
        </h3>
        <ul className="grid gap-1 text-muted-foreground">
          <li>
            <code className="font-mono text-xs text-foreground">{plan.stylesheet}</code>: the look,
            pen and screentone as CSS variables, with the utilities and keyframes
          </li>
          <li>
            <code className="font-mono text-xs text-foreground">{plan.fontFile}</code>:{" "}
            {framework === "vite" ? "imports" : "loads"} {plan.fonts.join(", ")}
            {framework === "vite" ? " from Fontsource" : " with next/font"}
          </li>
        </ul>
      </section>
      <section className="grid gap-1.5" aria-labelledby="create-files-kit">
        <h3 id="create-files-kit" className="font-heading text-base">
          The kit
        </h3>
        <FileList items={plan.kit} />
      </section>
      {plan.brought.length > 0 && (
        <section className="grid gap-1.5" aria-labelledby="create-files-brought">
          <h3 id="create-files-brought" className="font-heading text-base">
            Brought by the kit
          </h3>
          <FileList items={plan.brought} />
        </section>
      )}
      <p className="text-muted-foreground">
        Packages:{" "}
        <span className="font-mono text-xs break-all text-foreground">
          {plan.packages.join(", ") || "none"}
        </span>
      </p>
    </div>
  );
}

/**
 * "Get code": the way out of the Create page. The commands come from `lib/create/commands.ts`
 * for the decoded configuration (the project folder is the fixed `my-manga-app`, so no typed
 * text reaches a command), the files from the same item builders the routes serve, and a prompt
 * for an agent. Mounted once, at the foot of the rail.
 */
export function GetCodeDialog({ code, config }: GetCodeDialogProps) {
  const [manager, setManager] = useState<PackageManager>(PACKAGE_MANAGERS[0]);
  const [framework, setFramework] = useState<Framework>("next");
  const [status, setStatus] = useState("");
  const copier = useCopy(setStatus);
  const commandsFor = (name: PackageManager) => createCommands(config, name);
  const canonical = commandsFor(manager).code;

  return (
    <Dialog onOpenChange={() => setStatus("")}>
      <DialogTrigger render={<Button className="w-full" data-slot="create-get-code" />}>
        Get code
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Get code</DialogTitle>
          <DialogDescription>
            Code{" "}
            <code className="font-mono" data-slot="create-dialog-code">
              {code}
            </code>
            : {configSummary(config)}. One shadcn command installs it.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="new" className="min-w-0">
          <TabsList className="h-auto! w-full flex-wrap justify-start">
            <TabsTrigger value="new">New project</TabsTrigger>
            <TabsTrigger value="existing">Existing project</TabsTrigger>
            <TabsTrigger value="files">What you get</TabsTrigger>
            <TabsTrigger value="agent">For an agent</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="grid gap-3 pt-2">
            <ToggleGroup
              aria-label="Framework"
              variant="outline"
              spacing={0}
              className="w-full *:data-[slot=toggle-group-item]:flex-1 sm:w-fit"
              value={[framework]}
              onValueChange={(value: unknown[]) => {
                const next = value[0] as Framework | undefined;
                if (next) setFramework(next);
              }}
            >
              {FRAMEWORKS.map((name) => (
                <ToggleGroupItem key={name} value={name}>
                  {FRAMEWORK_NAMES[name]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ManagerTabs manager={manager} onManager={setManager}>
              {(name) => {
                const commands = commandsFor(name);
                return (
                  <CopyBlock
                    id={`new-${framework}-${name}`}
                    slot="create-command-new"
                    label={`new ${FRAMEWORK_NAMES[framework]} project command`}
                    text={framework === "vite" ? commands.viteProject : commands.nextProject}
                    copier={copier}
                  />
                );
              }}
            </ManagerTabs>
            <p className="text-muted-foreground">
              It creates the folder <code className="font-mono">{PROJECT_NAME}</code>; change the
              name after <code className="font-mono">-n</code> for another one.
            </p>
            {framework === "vite" && (
              <p className="text-muted-foreground" data-slot="create-vite-note">
                Vite, as measured: the kit&apos;s page files are not installed, and the fonts come
                from Fontsource packages instead of next/font.
              </p>
            )}
          </TabsContent>

          <TabsContent value="existing" className="grid gap-3 pt-2">
            <ManagerTabs manager={manager} onManager={setManager}>
              {(name) => {
                const commands = commandsFor(name);
                return (
                  <>
                    <h3 className="font-medium">The theme, the fonts and the kit</h3>
                    <CopyBlock
                      id={`existing-${name}`}
                      slot="create-command-existing"
                      label="existing project command"
                      text={commands.existingProject}
                      copier={copier}
                    />
                    <p className="text-muted-foreground">
                      This overwrites the kit&apos;s files if they are already in your project,
                      including ones you have edited.
                    </p>
                    <h3 className="font-medium">The look only</h3>
                    <CopyBlock
                      id={`look-${name}`}
                      slot="create-command-look"
                      label="look only command"
                      text={commands.lookOnly}
                      copier={copier}
                    />
                    <p className="text-muted-foreground">The theme and its fonts, no component.</p>
                  </>
                );
              }}
            </ManagerTabs>
          </TabsContent>

          <TabsContent value="files" className="pt-2">
            <WhatYouGet config={config} framework={framework} />
          </TabsContent>

          <TabsContent value="agent" className="grid gap-3 pt-2">
            <p className="text-muted-foreground">
              Paste this into a coding agent. It names the code, the command and the mangacn docs
              MCP and Agent Skill.
            </p>
            <CopyBlock
              id="agent"
              slot="create-agent-prompt"
              label="agent prompt"
              text={agentPrompt(config, { manager, framework })}
              copier={copier}
            />
            <p className="text-muted-foreground">
              The same as Markdown:{" "}
              <a className="underline underline-offset-2" href={`/create.md?c=${canonical}`}>
                /create.md
              </a>
              . Set up by hand with the{" "}
              <a className="underline underline-offset-2" href="/docs/installation">
                Installation
              </a>{" "}
              guide.
            </p>
          </TabsContent>
        </Tabs>
        <span
          role="status"
          aria-live="polite"
          className="sr-only"
          data-slot="create-copy-command-status"
        >
          {status}
        </span>
      </DialogContent>
    </Dialog>
  );
}
