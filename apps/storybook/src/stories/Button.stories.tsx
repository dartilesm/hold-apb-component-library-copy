import type { Meta, StoryObj } from "storybook";
import type { ReactNode } from "react";
import { MailIcon, ArrowRightIcon, TrashIcon } from "lucide-react";

import { buttonSpec as s } from "@dept/core/story-specs/button";
import { Button } from "@dept/react";

// Map the spec's framework-agnostic icon keys to React nodes.
const icons: Record<string, ReactNode> = {
  trash: <TrashIcon />,
  mail: <MailIcon />,
  "arrow-right": <ArrowRightIcon />,
};

function resolve(args: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...args };
  for (const slot of ["leftIcon", "rightIcon"] as const) {
    if (typeof out[slot] === "string") out[slot] = icons[out[slot] as string];
  }
  return out as Story["args"];
}

const meta: Meta<typeof Button> = {
  // Storybook's CSF indexer requires a STATIC title literal (it can't be a
  // computed/imported value); keep it in sync with buttonSpec.title.
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: s.argTypes as Meta<typeof Button>["argTypes"],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = { args: resolve(s.stories.Default.args) };
export const Secondary: Story = { args: resolve(s.stories.Secondary.args) };
export const Destructive: Story = { args: resolve(s.stories.Destructive.args) };
export const Outline: Story = { args: resolve(s.stories.Outline.args) };
export const Ghost: Story = { args: resolve(s.stories.Ghost.args) };
export const Link: Story = { args: resolve(s.stories.Link.args) };
export const WithIcons: Story = { args: resolve(s.stories.WithIcons.args) };
export const Loading: Story = { args: resolve(s.stories.Loading.args) };
export const Small: Story = { args: resolve(s.stories.Small.args) };
export const Large: Story = { args: resolve(s.stories.Large.args) };
