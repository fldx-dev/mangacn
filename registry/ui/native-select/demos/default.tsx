import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "@/registry/ui/native-select/native-select";

export default function NativeSelectDefaultDemo() {
  return (
    <NativeSelect aria-label="Genre" defaultValue="" className="w-full max-w-48">
      <NativeSelectOption value="" disabled>
        Pick a genre
      </NativeSelectOption>
      <NativeSelectOptGroup label="By readership">
        <NativeSelectOption value="shonen">Shōnen</NativeSelectOption>
        <NativeSelectOption value="shojo">Shōjo</NativeSelectOption>
        <NativeSelectOption value="seinen">Seinen</NativeSelectOption>
        <NativeSelectOption value="josei">Josei</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  );
}
