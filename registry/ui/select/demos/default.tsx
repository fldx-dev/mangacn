import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";

const genres = [
  { label: "Pick a genre", value: null },
  { label: "Shōnen", value: "shonen" },
  { label: "Shōjo", value: "shojo" },
  { label: "Seinen", value: "seinen" },
  { label: "Josei", value: "josei" },
];

export default function SelectDefaultDemo() {
  return (
    <Select items={genres}>
      <SelectTrigger aria-label="Genre" className="w-full max-w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {genres.map((genre) => (
            <SelectItem key={genre.label} value={genre.value}>
              {genre.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
