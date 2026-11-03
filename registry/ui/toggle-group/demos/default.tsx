import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

export default function ToggleGroupDefaultDemo() {
  return (
    <ToggleGroup aria-label="Reading mode" variant="outline" spacing={0} defaultValue={["page"]}>
      <ToggleGroupItem value="page">Page</ToggleGroupItem>
      <ToggleGroupItem value="spread">Spread</ToggleGroupItem>
      <ToggleGroupItem value="scroll">Scroll</ToggleGroupItem>
    </ToggleGroup>
  );
}
