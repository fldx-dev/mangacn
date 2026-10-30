import { BookOpenIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert/alert";

export default function AlertDefaultDemo() {
  return (
    <Alert className="max-w-md">
      <BookOpenIcon />
      <AlertTitle>New chapter available</AlertTitle>
      <AlertDescription>Chapter 12 is out. Pick up where you left off on page 3.</AlertDescription>
    </Alert>
  );
}
