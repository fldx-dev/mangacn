import { profile } from "@/registry/blocks/profile-01/components/profile-data";
import { ProfileForm } from "@/registry/blocks/profile-01/components/profile-form";

// The page's form on its own; /view/profile-01 is the whole page with its heading.
export default function Profile01DefaultVariant() {
  return <ProfileForm defaultValues={profile} className="max-w-[42rem]" />;
}
