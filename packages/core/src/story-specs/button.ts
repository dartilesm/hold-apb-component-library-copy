/**
 * Framework-agnostic story spec for Button — data only, no framework nodes.
 * Icon slots are referenced by string key; each framework's stories file maps
 * the key to a real icon in a thin render adapter. Shared so React/Vue/Svelte
 * Storybooks show the identical matrix (unified later via Storybook Composition).
 */
export interface StorySpec {
  title: string;
  argTypes: Record<string, { control: string; options?: string[] }>;
  stories: Record<string, { args: Record<string, unknown> }>;
}

export const buttonSpec = {
  title: "Components/Button",
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  stories: {
    Default: { args: { children: "Button" } },
    Secondary: { args: { variant: "secondary", children: "Secondary" } },
    Destructive: { args: { variant: "destructive", children: "Delete", leftIcon: "trash" } },
    Outline: { args: { variant: "outline", children: "Outline" } },
    Ghost: { args: { variant: "ghost", children: "Ghost" } },
    Link: { args: { variant: "link", children: "Link" } },
    WithIcons: { args: { children: "Send email", leftIcon: "mail", rightIcon: "arrow-right" } },
    Loading: { args: { isLoading: true, children: "Please wait" } },
    Small: { args: { size: "sm", children: "Small" } },
    Large: { args: { size: "lg", children: "Large" } },
  },
} satisfies StorySpec;
