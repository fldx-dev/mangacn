import { BookOpenIcon, TriangleAlertIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/registry/ui/alert/alert";
import { Button } from "@/registry/ui/button/button";

export default function AlertVariantsDemo() {
  return (
    <div className="grid w-full max-w-md gap-4">
      <Alert>
        <BookOpenIcon />
        <AlertTitle>New chapter available</AlertTitle>
        <AlertDescription>Chapter 12 is out. Pick up where you left off.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <TriangleAlertIcon />
        <AlertTitle>Upload failed</AlertTitle>
        <AlertDescription>Page 7 is larger than 20 MB. Export it again and retry.</AlertDescription>
      </Alert>
      <Alert>
        <AlertTitle>Title only, no icon</AlertTitle>
        <AlertDescription>The grid falls back to one column.</AlertDescription>
        <AlertAction>
          <Button size="xs" variant="outline">
            Undo
          </Button>
        </AlertAction>
      </Alert>
    </div>
  );
}
