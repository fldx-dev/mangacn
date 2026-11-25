import { profile } from "./components/profile-data";
import { ProfileForm } from "./components/profile-form";

// A signed-in reader's profile: the public profile and the password, one card each, in one
// column. The page is a server component; the form holds the state. Everything on it comes from
// `profile`; replace it with your fetch (`const profile = await getProfile()` in this async
// page). Inside your app's own shell (a sidebar layout, a header), put the content below in its
// content area instead of this `main`.

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-[42rem] flex-col gap-6 p-4 pb-10 md:p-6 xl:p-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight uppercase">Profile</h1>
        <p className="text-sm text-muted-foreground">
          How other readers see you, and how you sign in.
        </p>
      </header>
      <ProfileForm defaultValues={profile} />
    </main>
  );
}
