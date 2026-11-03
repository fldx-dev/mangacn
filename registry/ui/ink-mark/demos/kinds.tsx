import { InkMark } from "@/registry/ui/ink-mark/ink-mark";

export default function InkMarkKindsDemo() {
  return (
    <ul className="grid grid-cols-2 gap-x-10 gap-y-6 text-lg sm:grid-cols-3">
      <li>
        <InkMark kind="underline">underline</InkMark>
      </li>
      <li>
        <InkMark kind="circle">circle</InkMark>
      </li>
      <li>
        <InkMark kind="box">box</InkMark>
      </li>
      <li>
        <InkMark kind="strike">strike</InkMark>
      </li>
      <li>
        <InkMark kind="highlight">highlight</InkMark>
      </li>
      <li>
        <InkMark kind="bracket">bracket</InkMark>
      </li>
    </ul>
  );
}
