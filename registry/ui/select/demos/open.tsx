import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select/select";

const genres = [
  { label: "Shōnen", value: "shonen" },
  { label: "Shōjo", value: "shojo" },
  { label: "Seinen", value: "seinen" },
  { label: "Josei", value: "josei" },
];
const formats = [
  { label: "One-shot", value: "one-shot" },
  { label: "Webtoon", value: "webtoon" },
];

export default function SelectOpenDemo() {
  return (
    <Select items={[...genres, ...formats]} defaultValue="seinen" defaultOpen>
      <SelectTrigger aria-label="Genre" className="w-full max-w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          <SelectLabel>Demographic</SelectLabel>
          {genres.map((genre) => (
            <SelectItem key={genre.value} value={genre.value}>
              {genre.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Format</SelectLabel>
          {formats.map((format) => (
            <SelectItem key={format.value} value={format.value}>
              {format.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
