import { ClipboardListIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert/alert";

const issues = [
  { page: 4, fix: "speed lines missing on the jump" },
  { page: 9, fix: "balloon covers the ferry rail" },
  { page: 13, fix: "sound effect not lettered yet" },
];

export default function AlertWithListVariant() {
  return (
    <Alert className="max-w-md">
      <ClipboardListIcon />
      <AlertTitle>Three pages to fix before print</AlertTitle>
      <AlertDescription className="[&_p:not(:last-child)]:mb-1">
        <p>The pre-print check of chapter 12 found:</p>
        <ul className="list-disc ps-5">
          {issues.map((issue) => (
            <li key={issue.page}>
              Page {issue.page}: {issue.fix}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
