import { Rating } from "@/registry/ui/rating/rating";

const volumes = [
  { title: "Kaiju Diner, vol. 1", rating: 4.5 },
  { title: "Kaiju Diner, vol. 2", rating: 3 },
  { title: "Kaiju Diner, vol. 3", rating: 5 },
];

export default function RatingReadOnlyDemo() {
  return (
    <ul className="flex w-full max-w-sm flex-col gap-3">
      {volumes.map((volume) => (
        <li
          key={volume.title}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
        >
          <span className="text-sm">{volume.title}</span>
          <Rating value={volume.rating} readOnly size="sm" />
        </li>
      ))}
    </ul>
  );
}
