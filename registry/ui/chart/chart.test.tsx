import { cleanup, render, screen } from "@testing-library/react";
import type * as React from "react";
import { Bar, BarChart } from "recharts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { expectDemosAccessible } from "@/lib/test/axe";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegendContent,
  ChartStyle,
  ChartTooltipContent,
} from "./chart";

afterEach(cleanup);

const config = {
  print: { label: "Print", color: "url(#tone-dots-4)" },
  digital: { label: "Digital", theme: { light: "var(--chart-1)", dark: "var(--chart-2)" } },
} satisfies ChartConfig;

// The tooltip and legend contents read the config from the container's context. The container's
// ResponsiveContainer clones its one child with a size, so a plain holder stands in for a chart.
function Holder({ children }: { children: React.ReactNode; width?: number; height?: number }) {
  return <div>{children}</div>;
}

function InContainer({ children }: { children: React.ReactNode }) {
  return (
    <ChartContainer id="sales" config={config}>
      <Holder>{children}</Holder>
    </ChartContainer>
  );
}

const payload = [
  {
    dataKey: "print",
    name: "print",
    value: 42,
    color: "url(#tone-dots-4)",
    payload: {},
    graphicalItemId: "bar-print",
  },
  {
    dataKey: "digital",
    name: "digital",
    value: 1280,
    color: "var(--color-digital)",
    payload: {},
    graphicalItemId: "bar-digital",
  },
];

describe("ChartContainer", () => {
  it("keeps stock's slot and turns recharts' axes, grid and cursor to ink and tone-3", () => {
    const { container } = render(
      <ChartContainer id="sales" config={config} className="custom-class">
        <BarChart data={[{ month: "Jan", print: 4 }]}>
          <Bar dataKey="print" />
        </BarChart>
      </ChartContainer>,
    );
    const chart = container.querySelector<HTMLElement>('[data-slot="chart"]');
    expect(chart?.dataset.chart).toBe("chart-sales");
    expect(chart?.classList.contains("custom-class")).toBe(true);
    const className = chart?.className ?? "";
    for (const hook of [
      "[&_.recharts-cartesian-axis-line]:stroke-ink",
      "[&_.recharts-cartesian-axis-tick_text]:fill-ink",
      // recharts 3.8 sets tick labels apart from the axis group, under this class.
      "[&_.recharts-cartesian-axis-tick-value]:fill-ink",
      "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-tone-3",
      "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-ink",
      "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-tone-1",
    ]) {
      expect(className, hook).toContain(hook);
    }
    expect(className).not.toMatch(/muted-foreground|stroke-border/);
  });

  it("writes each series colour as a --color-<key> variable, per theme", () => {
    const { container } = render(<ChartStyle id="chart-sales" config={config} />);
    const css = container.querySelector("style")?.innerHTML ?? "";
    expect(css).toContain("[data-chart=chart-sales]");
    expect(css).toContain("--color-print: url(#tone-dots-4);");
    expect(css).toContain("--color-digital: var(--chart-1);");
    expect(css).toContain(".dark [data-chart=chart-sales]");
    expect(css).toContain("--color-digital: var(--chart-2);");
  });

  it("throws outside a container, like stock", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ChartLegendContent payload={[]} />)).toThrow(
      "useChart must be used within a <ChartContainer />",
    );
  });
});

describe("ChartTooltipContent", () => {
  it("is a small heavy-outlined paper card with no border or shadow", () => {
    render(
      <InContainer>
        <ChartTooltipContent active payload={payload} label="Jan" />
      </InContainer>,
    );
    const box = screen.getByText("Print").closest('[data-slot="card"]') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.dataset.size).toBe("sm");
    expect(box.className).toContain("[--outline-width:var(--outline-width-heavy)]");
    expect(box.className).not.toMatch(/(^|\s)border(\s|-)|shadow-/);
    expect(box.querySelector(':scope > [data-slot="ink-frame"]')?.getAttribute("data-fill")).toBe(
      "paper",
    );
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("swatches each series with its fill, so a chart-tones pattern shows", () => {
    render(
      <InContainer>
        <ChartTooltipContent active payload={payload} />
      </InContainer>,
    );
    const fills = [...document.querySelectorAll('[data-slot="card"] svg rect')].map((rect) =>
      rect.getAttribute("fill"),
    );
    expect(fills).toEqual(["url(#tone-dots-4)", "var(--color-digital)"]);
  });

  it("renders nothing while inactive", () => {
    render(
      <InContainer>
        <ChartTooltipContent active={false} payload={payload} />
      </InContainer>,
    );
    expect(document.querySelector('[data-slot="card"]')).toBeNull();
  });
});

describe("ChartLegendContent", () => {
  it("labels each series in the body face beside an SVG swatch", () => {
    render(
      <InContainer>
        <ChartLegendContent
          payload={[
            { value: "print", dataKey: "print", type: "rect", color: "url(#tone-dots-4)" },
            {
              value: "digital",
              dataKey: "digital",
              type: "line",
              color: "var(--color-digital)",
              payload: { strokeWidth: 3, strokeDasharray: "6 4" },
            },
          ]}
        />
      </InContainer>,
    );
    const print = screen.getByText("Print");
    expect(print.className).not.toContain("font-display");
    expect(print.querySelector("svg rect")?.getAttribute("fill")).toBe("url(#tone-dots-4)");
    // A line series shows a stroke sample with its weight and dash.
    const line = screen.getByText("Digital").querySelector("svg line");
    expect(line?.getAttribute("stroke")).toBe("var(--color-digital)");
    expect(line?.getAttribute("stroke-width")).toBe("3");
    expect(line?.getAttribute("stroke-dasharray")).toBe("6 4");
  });
});

describe("Chart demos", () => {
  expectDemosAccessible(import.meta.glob("./demos/*.tsx"));
});
