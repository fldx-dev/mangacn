import { ToggleGroup, ToggleGroupItem } from "@/registry/ui/toggle-group/toggle-group";

const columns = ["1", "2", "3", "4"] as const;

export default function ToggleGroupSingleDemo() {
  return (
    <div className="grid justify-items-center gap-3">
      <span id="toggle-group-single-columns" className="text-sm font-medium">
        Panels per row
      </span>
      <ToggleGroup aria-labelledby="toggle-group-single-columns" defaultValue={["2"]}>
        {columns.map((count) => (
          <ToggleGroupItem key={count} value={count} aria-label={`${count} per row`}>
            {count}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
