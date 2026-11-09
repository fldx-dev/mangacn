import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/registry/ui/button/button";
import { ButtonGroup } from "@/registry/ui/button-group/button-group";

export default function ButtonGroupDefaultDemo() {
  return (
    <ButtonGroup aria-label="Chapter navigation">
      <Button variant="outline">
        <ChevronLeftIcon data-icon="inline-start" />
        Prev
      </Button>
      <Button variant="outline">Ch. 12</Button>
      <Button variant="outline">
        Next
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </ButtonGroup>
  );
}
