import { OnboardingFlow } from "./components/onboarding-flow";

// A first-run flow: profile, interests and habits in a stepper, then a summary. The answers live
// in local state; pass `onComplete` to save them, and edit onboarding-data.ts for your choices.
export default function Page() {
  return (
    <main className="flex w-full flex-col px-4 py-8 md:px-8 md:py-12">
      <OnboardingFlow />
    </main>
  );
}
