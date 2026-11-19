"use client";

import { cn } from "cn";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { type FileRejection, FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { getPasswordStrength, PasswordInput } from "@/components/ui/password-input";
import { Separator } from "@/components/ui/separator";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import {
  PROFILE_BIO_MAX,
  PROFILE_INTERESTS_MAX,
  PROFILE_PHOTO_MAX_SIZE,
  type Profile,
} from "./profile-data";

// Profile editing in two cards, each its own form with its own Save: the public profile (photo,
// names, bio, interests, website) and the password. A Save checks its card, focuses the first
// invalid field or announces the result; nothing is sent anywhere: pass `onSaveProfile` and
// `onSavePassword`. The photo stays in the browser as an object URL, revoked when it changes.

type ProfileErrors = Partial<Record<"displayName" | "username" | "website", string>>;
type PasswordErrors = Partial<Record<"current" | "next" | "confirm", string>>;

export interface PasswordChange {
  current: string;
  next: string;
}

const USERNAME = /^[A-Za-z0-9_]{3,30}$/;

/** The messages a failed profile Save shows, by field; empty when the profile can be saved. */
export function validateProfile(values: Profile): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!values.displayName.trim()) errors.displayName = "Enter a display name.";
  if (!USERNAME.test(values.username)) {
    errors.username = "Use 3 to 30 letters, digits or underscores.";
  }
  if (values.website.trim() && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(values.website.trim())) {
    errors.website = "Enter a full address like https://example.com.";
  }
  return errors;
}

/** The messages a failed password Save shows, by field; empty when the change can be saved. */
export function validatePassword(current: string, next: string, confirm: string): PasswordErrors {
  const errors: PasswordErrors = {};
  if (!current) errors.current = "Enter your current password.";
  if (getPasswordStrength(next) < 2) {
    errors.next = "Choose a stronger password: 8 characters or more, mixing letters and digits.";
  }
  if (confirm !== next) errors.confirm = "The passwords do not match.";
  return errors;
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export interface ProfileFormProps extends React.ComponentProps<"div"> {
  /** The saved profile. */
  defaultValues: Profile;
  /** Called with the profile and the picked photo (if any) after a valid Save. */
  onSaveProfile?: (values: Profile, photo: File | null) => void;
  /** Called with the current and new password after a valid Save. */
  onSavePassword?: (change: PasswordChange) => void;
}

export function ProfileForm({
  defaultValues,
  onSaveProfile,
  onSavePassword,
  className,
  ...props
}: ProfileFormProps) {
  const id = React.useId();
  const fieldId = (name: string) => `${id}-${name}`;
  const focus = (name: string) => document.getElementById(fieldId(name))?.focus();

  const [values, setValues] = React.useState(defaultValues);
  const [errors, setErrors] = React.useState<ProfileErrors>({});
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [photoError, setPhotoError] = React.useState("");
  const [preview, setPreview] = React.useState<string>();
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [passwordErrors, setPasswordErrors] = React.useState<PasswordErrors>({});
  // A new key per announcement, so saving twice is announced twice.
  const [announcement, setAnnouncement] = React.useState({ key: 0, text: "" });
  const announce = (text: string) => setAnnouncement((last) => ({ key: last.key + 1, text }));
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setValues((last) => ({ ...last, [key]: value }));

  // The preview is the picked file's object URL, revoked when the photo changes or the form goes.
  React.useEffect(() => {
    if (!photo) {
      setPreview(undefined);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const rejectPhoto = ([rejection]: FileRejection[]) => {
    if (!rejection) return;
    const reason = rejection.reason === "size" ? "is larger than 2 MB" : "is not an image";
    setPhotoError(`${rejection.file.name} ${reason}. Choose an image up to 2 MB.`);
  };

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateProfile(values);
    setErrors(found);
    const first = (["displayName", "username", "website"] as const).find((key) => found[key]);
    if (first) {
      focus(first);
      return;
    }
    onSaveProfile?.(values, photo);
    announce("Profile saved");
  };

  const savePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validatePassword(current, next, confirm);
    setPasswordErrors(found);
    const first = (["current", "next", "confirm"] as const).find((key) => found[key]);
    if (first) {
      focus(first);
      return;
    }
    onSavePassword?.({ current, next });
    setCurrent("");
    setNext("");
    setConfirm("");
    announce("Password changed");
  };

  /** aria-describedby for a control: its description, then its error when it has one. */
  const describedBy = (name: string, error?: string, description?: boolean) =>
    [description && fieldId(`${name}-description`), error && fieldId(`${name}-error`)]
      .filter(Boolean)
      .join(" ") || undefined;

  const profileHeading = fieldId("profile-heading");
  const passwordHeading = fieldId("password-heading");
  const atBioLimit = values.bio.length >= PROFILE_BIO_MAX;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-6", className)} {...props}>
      <section aria-labelledby={profileHeading}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id={profileHeading} className="font-display text-lg uppercase">
                Public profile
              </h2>
            </CardTitle>
            <CardDescription>What other readers see on your page and comments.</CardDescription>
          </CardHeader>
          <CardContent>
            <form aria-labelledby={profileHeading} noValidate onSubmit={saveProfile}>
              <FieldSet>
                <FieldGroup>
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
                    <Field className="items-start md:w-auto">
                      {/* A wrapper, so the field stretches it and not the round avatar. */}
                      <div className="flex flex-col items-start gap-3">
                        <Avatar className="size-20 md:size-24">
                          {preview && <AvatarImage src={preview} alt="Your new photo" />}
                          <AvatarFallback className="font-display text-xl">
                            {initials(values.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <FileUpload
                          name="photo"
                          accept="image/*"
                          multiple={false}
                          maxSize={PROFILE_PHOTO_MAX_SIZE}
                          value={photo ? [photo] : []}
                          onValueChange={(files) => {
                            setPhoto(files[0] ?? null);
                            if (files[0]) setPhotoError("");
                          }}
                          onReject={rejectPhoto}
                          className="w-auto items-start"
                        >
                          <FileUploadTrigger
                            variant="outline"
                            size="sm"
                            aria-describedby={describedBy("photo", photoError, true)}
                          >
                            Change photo
                          </FileUploadTrigger>
                        </FileUpload>
                      </div>
                      <FieldDescription id={fieldId("photo-description")} className="sr-only">
                        An image up to 2 MB.
                      </FieldDescription>
                      <FieldError id={fieldId("photo-error")} className="max-w-56">
                        {photoError}
                      </FieldError>
                    </Field>
                    <FieldGroup className="min-w-0 flex-1">
                      <Field data-invalid={errors.displayName ? true : undefined}>
                        <FieldLabel htmlFor={fieldId("displayName")}>
                          Display name <span className="text-muted-foreground">(required)</span>
                        </FieldLabel>
                        <Input
                          id={fieldId("displayName")}
                          name="displayName"
                          autoComplete="nickname"
                          required
                          value={values.displayName}
                          onChange={(event) => set("displayName", event.target.value)}
                          aria-invalid={errors.displayName ? true : undefined}
                          aria-describedby={describedBy("displayName", errors.displayName)}
                        />
                        <FieldError id={fieldId("displayName-error")}>
                          {errors.displayName}
                        </FieldError>
                      </Field>
                      <Field data-invalid={errors.username ? true : undefined}>
                        <FieldLabel htmlFor={fieldId("username")}>
                          Username <span className="text-muted-foreground">(required)</span>
                        </FieldLabel>
                        <InputGroup>
                          <InputGroupAddon>
                            <InputGroupText aria-hidden="true">@</InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            id={fieldId("username")}
                            name="username"
                            autoComplete="username"
                            required
                            value={values.username}
                            onChange={(event) => set("username", event.target.value)}
                            aria-invalid={errors.username ? true : undefined}
                            aria-describedby={describedBy("username", errors.username)}
                          />
                        </InputGroup>
                        <FieldError id={fieldId("username-error")}>{errors.username}</FieldError>
                      </Field>
                    </FieldGroup>
                  </div>
                  <Separator />
                  <Field>
                    <FieldLabel htmlFor={fieldId("bio")}>Bio</FieldLabel>
                    <Textarea
                      id={fieldId("bio")}
                      name="bio"
                      rows={3}
                      maxLength={PROFILE_BIO_MAX}
                      value={values.bio}
                      onChange={(event) => set("bio", event.target.value)}
                      aria-describedby={fieldId("bio-count")}
                    />
                    <FieldDescription id={fieldId("bio-count")} className="text-end tabular-nums">
                      {values.bio.length} / {PROFILE_BIO_MAX} characters
                    </FieldDescription>
                    {/* Polite, and only at the limit: the count itself is read on focus. */}
                    <span role="status" className="sr-only">
                      {atBioLimit ? `The bio is at its ${PROFILE_BIO_MAX}-character limit.` : ""}
                    </span>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={fieldId("interests")}>Interests</FieldLabel>
                    <TagsInput
                      id={fieldId("interests")}
                      name="interests"
                      max={PROFILE_INTERESTS_MAX}
                      value={values.interests}
                      onValueChange={(tags) => set("interests", tags)}
                      placeholder="Add an interest"
                      aria-describedby={fieldId("interests-description")}
                    />
                    <FieldDescription id={fieldId("interests-description")}>
                      Up to {PROFILE_INTERESTS_MAX}; separate them with commas.
                    </FieldDescription>
                  </Field>
                  <Field data-invalid={errors.website ? true : undefined}>
                    <FieldLabel htmlFor={fieldId("website")}>Website</FieldLabel>
                    <Input
                      id={fieldId("website")}
                      name="website"
                      type="url"
                      autoComplete="url"
                      placeholder="https://"
                      value={values.website}
                      onChange={(event) => set("website", event.target.value)}
                      aria-invalid={errors.website ? true : undefined}
                      aria-describedby={describedBy("website", errors.website)}
                    />
                    <FieldError id={fieldId("website-error")}>{errors.website}</FieldError>
                  </Field>
                  <Field orientation="horizontal" className="justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                      Save profile
                    </Button>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </form>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby={passwordHeading}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id={passwordHeading} className="font-display text-lg uppercase">
                Password
              </h2>
            </CardTitle>
            <CardDescription>Change the password you sign in with.</CardDescription>
          </CardHeader>
          <CardContent>
            <form aria-labelledby={passwordHeading} noValidate onSubmit={savePassword}>
              <FieldSet>
                <FieldGroup>
                  <Field data-invalid={passwordErrors.current ? true : undefined}>
                    <FieldLabel htmlFor={fieldId("current")}>
                      Current password <span className="text-muted-foreground">(required)</span>
                    </FieldLabel>
                    <PasswordInput
                      id={fieldId("current")}
                      name="currentPassword"
                      autoComplete="current-password"
                      required
                      value={current}
                      onChange={(event) => setCurrent(event.target.value)}
                      aria-invalid={passwordErrors.current ? true : undefined}
                      aria-describedby={describedBy("current", passwordErrors.current)}
                    />
                    <FieldError id={fieldId("current-error")}>{passwordErrors.current}</FieldError>
                  </Field>
                  <Field data-invalid={passwordErrors.next ? true : undefined}>
                    <FieldLabel htmlFor={fieldId("next")}>
                      New password <span className="text-muted-foreground">(required)</span>
                    </FieldLabel>
                    <PasswordInput
                      id={fieldId("next")}
                      name="newPassword"
                      autoComplete="new-password"
                      required
                      showStrength
                      value={next}
                      onChange={(event) => setNext(event.target.value)}
                      aria-invalid={passwordErrors.next ? true : undefined}
                      aria-describedby={describedBy("next", passwordErrors.next)}
                    />
                    <FieldError id={fieldId("next-error")}>{passwordErrors.next}</FieldError>
                  </Field>
                  <Field data-invalid={passwordErrors.confirm ? true : undefined}>
                    <FieldLabel htmlFor={fieldId("confirm")}>
                      Confirm new password <span className="text-muted-foreground">(required)</span>
                    </FieldLabel>
                    <PasswordInput
                      id={fieldId("confirm")}
                      name="confirmPassword"
                      autoComplete="new-password"
                      required
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      aria-invalid={passwordErrors.confirm ? true : undefined}
                      aria-describedby={describedBy("confirm", passwordErrors.confirm)}
                    />
                    <FieldError id={fieldId("confirm-error")}>{passwordErrors.confirm}</FieldError>
                  </Field>
                  <Field orientation="horizontal" className="justify-end">
                    <Button type="submit" className="w-full md:w-auto">
                      Save password
                    </Button>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </form>
          </CardContent>
        </Card>
      </section>

      <div role="status" className="sr-only">
        <span key={announcement.key}>{announcement.text}</span>
      </div>
    </div>
  );
}
