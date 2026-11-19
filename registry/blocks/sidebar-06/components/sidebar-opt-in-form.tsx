import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInput } from "@/components/ui/sidebar";

// Based on shadcn/ui sidebar-06 (MIT, https://ui.shadcn.com), base-nova style, fetched 2026-11-18.
// The studio letter's sign-up, a card at the sidebar's foot. Stock flattens its card and recolours
// its button; here the card is drawn flat already and the button keeps its own ink.

export function SidebarOptInForm() {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardTitle className="text-sm">Get the studio letter</CardTitle>
        <CardDescription>
          Opt in for new chapters and news from the studio, once a week.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <form aria-label="Get the studio letter">
          <div className="grid gap-2.5">
            <SidebarInput type="email" placeholder="Email" />
            <Button className="w-full">Subscribe</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
