"use client";

import { cn } from "cn";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type EmailFrequency,
  type PageLayout,
  type ReadingDirection,
  type Settings,
  type SettingsOption,
  settingsEmailFrequencies,
  settingsLanguages,
  settingsTimeZones,
} from "./settings-data";

// Account settings in four cards, each a fieldset named by its heading, with a section nav that
// wraps above them on a phone and sticks in a left column from 1280. Save checks the form,
// focuses the first invalid field or announces the result; nothing is sent anywhere: replace
// `onSave` and the dialog's confirm with your own calls. Every input has a name, so the form
// also posts as a plain form.

type Errors = Partial<Record<"displayName" | "email", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The messages a failed Save shows, by field; empty when the settings can be saved. */
export function validateSettings(values: Settings): Errors {
  const errors: Errors = {};
  if (!values.displayName.trim()) errors.displayName = "Enter a display name.";
  if (values.email.trim() && !EMAIL.test(values.email.trim())) {
    errors.email = "Enter an email address like name@example.com.";
  }
  return errors;
}

export interface SettingsFormProps extends Omit<React.ComponentProps<"div">, "onSubmit"> {
  /** The saved settings; Reset returns to them. */
  defaultValues: Settings;
  /** Called with the settings after a Save that passed validation. */
  onSave?: (values: Settings) => void;
  /** Called when the reader confirms the account deletion. */
  onDeleteAccount?: () => void;
  /**
   * The sections shown, in their fixed order; the others, and their links in the section nav,
   * are not drawn, and Save skips their checks. Drop `account` when the app edits the display
   * name in profile-01 (it takes email, language and time zone with it).
   * @default ["account", "notifications", "reading", "danger"]
   */
  sections?: SettingsSection[];
}

const SECTIONS = [
  { key: "account", title: "Account" },
  { key: "notifications", title: "Notifications" },
  { key: "reading", title: "Reading" },
  { key: "danger", title: "Danger zone" },
] as const;

/** A section of the settings form. */
export type SettingsSection = (typeof SECTIONS)[number]["key"];

const ALL_SECTIONS: SettingsSection[] = SECTIONS.map(({ key }) => key);

export function SettingsForm({
  defaultValues,
  onSave,
  onDeleteAccount,
  sections = ALL_SECTIONS,
  className,
  ...props
}: SettingsFormProps) {
  const id = React.useId();
  const shown = (key: SettingsSection) => sections.includes(key);
  const fieldId = (name: string) => `${id}-${name}`;
  const headingId = (key: SettingsSection) => `${id}-${key}`;

  const [values, setValues] = React.useState(defaultValues);
  const [errors, setErrors] = React.useState<Errors>({});
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  // A new key per announcement, so saving twice is announced twice.
  const [announcement, setAnnouncement] = React.useState({ key: 0, text: "" });
  const displayNameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  const announce = (text: string) => setAnnouncement((current) => ({ key: current.key + 1, text }));
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const setNotification = (key: keyof Settings["notifications"], checked: boolean) =>
    setValues((current) => ({
      ...current,
      notifications: { ...current.notifications, [key]: checked },
    }));

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A hidden section's fields cannot be fixed, so they are not checked.
    const next = shown("account") ? validateSettings(values) : {};
    setErrors(next);
    if (next.displayName) displayNameRef.current?.focus();
    else if (next.email) emailRef.current?.focus();
    else {
      onSave?.(values);
      announce("Settings saved");
    }
  };

  const reset = () => {
    setValues(defaultValues);
    setErrors({});
  };

  const sectionHeading = (key: SettingsSection, title: string) => (
    <CardTitle>
      <h2 id={headingId(key)} tabIndex={-1} className="scroll-mt-6 font-display text-lg uppercase">
        {title}
      </h2>
    </CardTitle>
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-6 xl:grid xl:grid-cols-[12rem_minmax(0,42rem)] xl:items-start xl:gap-10",
        className,
      )}
      {...props}
    >
      <nav aria-label="Settings sections" className="xl:sticky xl:top-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm xl:flex-col xl:gap-3">
          {SECTIONS.filter(({ key }) => shown(key)).map(({ key, title }) => (
            <li key={key}>
              <a
                href={`#${headingId(key)}`}
                className="underline-offset-4 hover:underline"
                // The heading takes focus, so the next Tab starts inside its section.
                onClick={() => document.getElementById(headingId(key))?.focus()}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        <form
          aria-label="Settings"
          noValidate
          onSubmit={save}
          className="flex min-w-0 flex-col gap-6"
        >
          {shown("account") ? (
            <section aria-labelledby={headingId("account")}>
              <Card>
                <CardHeader>
                  {sectionHeading("account", "Account")}
                  <CardDescription>Who you are on the site, and where you read.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldSet>
                    <FieldGroup>
                      <Field data-invalid={errors.displayName ? true : undefined}>
                        <FieldLabel htmlFor={fieldId("display-name")}>
                          Display name <span className="text-muted-foreground">(required)</span>
                        </FieldLabel>
                        <Input
                          ref={displayNameRef}
                          id={fieldId("display-name")}
                          name="displayName"
                          autoComplete="nickname"
                          required
                          value={values.displayName}
                          onChange={(event) => set("displayName", event.target.value)}
                          aria-invalid={errors.displayName ? true : undefined}
                          aria-describedby={
                            errors.displayName ? fieldId("display-name-error") : undefined
                          }
                        />
                        <FieldError id={fieldId("display-name-error")}>
                          {errors.displayName}
                        </FieldError>
                      </Field>
                      <Field data-invalid={errors.email ? true : undefined}>
                        <FieldLabel htmlFor={fieldId("email")}>Email</FieldLabel>
                        <Input
                          ref={emailRef}
                          id={fieldId("email")}
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={values.email}
                          onChange={(event) => set("email", event.target.value)}
                          aria-invalid={errors.email ? true : undefined}
                          aria-describedby={errors.email ? fieldId("email-error") : undefined}
                        />
                        <FieldError id={fieldId("email-error")}>{errors.email}</FieldError>
                      </Field>
                      <SettingsSelect
                        id={fieldId("language")}
                        label="Language"
                        name="language"
                        options={settingsLanguages}
                        value={values.language}
                        onValueChange={(value) => set("language", value)}
                      />
                      <SettingsSelect
                        id={fieldId("time-zone")}
                        label="Time zone"
                        name="timeZone"
                        options={settingsTimeZones}
                        value={values.timeZone}
                        onValueChange={(value) => set("timeZone", value)}
                      />
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {shown("notifications") ? (
            <section aria-labelledby={headingId("notifications")}>
              <Card>
                <CardHeader>
                  {sectionHeading("notifications", "Notifications")}
                  <CardDescription>What we tell you about, and how often.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldSet>
                    <FieldGroup>
                      <SettingsSwitch
                        id={fieldId("new-chapters")}
                        name="newChapters"
                        label="New chapters"
                        description="A series you follow publishes a chapter."
                        checked={values.notifications.newChapters}
                        onCheckedChange={(checked) => setNotification("newChapters", checked)}
                      />
                      <SettingsSwitch
                        id={fieldId("replies")}
                        name="replies"
                        label="Replies"
                        description="Someone answers one of your comments."
                        checked={values.notifications.replies}
                        onCheckedChange={(checked) => setNotification("replies", checked)}
                      />
                      <SettingsSwitch
                        id={fieldId("weekly-digest")}
                        name="weeklyDigest"
                        label="Weekly digest"
                        description="The week's new volumes from your shelves."
                        checked={values.notifications.weeklyDigest}
                        onCheckedChange={(checked) => setNotification("weeklyDigest", checked)}
                      />
                      <Separator />
                      <SettingsRadios
                        id={fieldId("email-frequency")}
                        label="Email frequency"
                        name="emailFrequency"
                        options={settingsEmailFrequencies}
                        value={values.emailFrequency}
                        onValueChange={(value) => set("emailFrequency", value as EmailFrequency)}
                      />
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
              </Card>
            </section>
          ) : null}

          {shown("reading") ? (
            <section aria-labelledby={headingId("reading")}>
              <Card>
                <CardHeader>
                  {sectionHeading("reading", "Reading")}
                  <CardDescription>How the reader opens a chapter.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FieldSet>
                    <FieldGroup>
                      <Field>
                        <FieldTitle id={fieldId("direction-label")}>Reading direction</FieldTitle>
                        {/* A wrapper, so the field stretches it and not the group. */}
                        <div>
                          <ToggleGroup
                            aria-labelledby={fieldId("direction-label")}
                            variant="outline"
                            spacing={0}
                            value={[values.readingDirection]}
                            // A single toggle group can be emptied; a direction is always set.
                            onValueChange={(next: string[]) => {
                              if (next[0]) set("readingDirection", next[0] as ReadingDirection);
                            }}
                          >
                            <ToggleGroupItem value="rtl">Right to left</ToggleGroupItem>
                            <ToggleGroupItem value="ltr">Left to right</ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                        <input
                          type="hidden"
                          name="readingDirection"
                          value={values.readingDirection}
                        />
                      </Field>
                      <SettingsRadios
                        id={fieldId("page-layout")}
                        label="Page layout"
                        name="pageLayout"
                        options={[
                          { label: "Single page", value: "single" },
                          { label: "Two-page spread", value: "spread" },
                        ]}
                        value={values.pageLayout}
                        onValueChange={(value) => set("pageLayout", value as PageLayout)}
                      />
                      <Separator />
                      <SettingsSwitch
                        id={fieldId("content-warnings")}
                        name="contentWarnings"
                        label="Content warnings"
                        description="Ask before opening a chapter marked for mature readers."
                        checked={values.contentWarnings}
                        onCheckedChange={(checked) => set("contentWarnings", checked)}
                      />
                    </FieldGroup>
                  </FieldSet>
                </CardContent>
              </Card>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 md:flex-row md:justify-end">
            <Button type="button" variant="outline" onClick={reset}>
              Reset
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>

        {shown("danger") ? (
          <section aria-labelledby={headingId("danger")}>
            <Card>
              <CardHeader>
                {sectionHeading("danger", "Danger zone")}
                <CardDescription>Things you cannot take back.</CardDescription>
              </CardHeader>
              <CardContent>
                <FieldSet>
                  <FieldGroup>
                    <Field orientation="responsive">
                      <FieldContent>
                        <FieldTitle>Delete account</FieldTitle>
                        <FieldDescription>
                          Your shelves, comments and reading history go with it.
                        </FieldDescription>
                      </FieldContent>
                      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                        <AlertDialogTrigger render={<Button type="button" variant="destructive" />}>
                          Delete account
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your shelves, comments and reading history are removed. This cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              onClick={() => {
                                setDeleteOpen(false);
                                onDeleteAccount?.();
                                announce("Account deletion requested");
                              }}
                            >
                              Delete account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </Field>
                  </FieldGroup>
                </FieldSet>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <div role="status" className="sr-only">
          <span key={announcement.key}>{announcement.text}</span>
        </div>
      </div>
    </div>
  );
}

function SettingsSelect({
  id,
  label,
  name,
  options,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  name: string;
  options: SettingsOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        name={name}
        items={options}
        value={value}
        onValueChange={(next) => {
          if (typeof next === "string") onValueChange(next);
        }}
      >
        <SelectTrigger id={id} className="w-full sm:max-w-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  );
}

function SettingsSwitch({
  id,
  name,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  name: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      </FieldContent>
      <Switch
        id={id}
        name={name}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={`${id}-description`}
      />
    </Field>
  );
}

function SettingsRadios({
  id,
  label,
  name,
  options,
  value,
  onValueChange,
}: {
  id: string;
  label: string;
  name: string;
  options: SettingsOption[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <Field>
      <FieldTitle id={`${id}-label`}>{label}</FieldTitle>
      <RadioGroup
        name={name}
        aria-labelledby={`${id}-label`}
        value={value}
        onValueChange={(next) => onValueChange(String(next))}
      >
        {options.map((option) => (
          <Field key={option.value} orientation="horizontal">
            <RadioGroupItem id={`${id}-${option.value}`} value={option.value} />
            <FieldLabel htmlFor={`${id}-${option.value}`} className="font-normal">
              {option.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </Field>
  );
}
