import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";
import { Input } from "@/registry/ui/input/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";

const scopes = [
  { label: "Series", value: "series" },
  { label: "Chapters", value: "chapters" },
  { label: "Artists", value: "artists" },
];

export default function ButtonGroupSelectDemo() {
  return (
    <ButtonGroup aria-label="Search" className="w-full max-w-sm">
      <Select items={scopes} defaultValue="series">
        <SelectTrigger aria-label="Search in">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {scopes.map((scope) => (
              <SelectItem key={scope.value} value={scope.value}>
                {scope.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input aria-label="Search terms" placeholder="Kaiju Diner" />
      <Button variant="outline">Go</Button>
    </ButtonGroup>
  );
}
