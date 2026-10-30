import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";

const genres = [
  { label: "Pick a genre", value: null },
  { label: "Shōnen", value: "shonen" },
  { label: "Seinen", value: "seinen" },
];

const states = [
  { label: "Placeholder", root: {}, trigger: {} },
  { label: "Selected", root: { defaultValue: "seinen" }, trigger: {} },
  { label: "Small", root: { defaultValue: "shonen" }, trigger: { size: "sm" } },
  { label: "Disabled", root: { defaultValue: "seinen", disabled: true }, trigger: {} },
  { label: "Invalid", root: {}, trigger: { "aria-invalid": true } },
] as const;

export default function SelectStatesDemo() {
  return (
    <div className="grid w-full max-w-48 gap-3">
      {states.map(({ label, root, trigger }) => (
        <Select key={label} items={genres} {...root}>
          <SelectTrigger aria-label={label} className="w-full" {...trigger}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {genres.map((genre) => (
              <SelectItem key={genre.label} value={genre.value}>
                {genre.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}
