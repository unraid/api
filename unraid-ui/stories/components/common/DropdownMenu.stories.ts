import type { Meta, StoryObj } from "@storybook/vue3";
import DropdownMenu from "../../../src/components/common/dropdown-menu/DropdownMenu.vue";
import DropdownMenuTrigger from "../../../src/components/common/dropdown-menu/DropdownMenuTrigger.vue";
import DropdownMenuContent from "../../../src/components/common/dropdown-menu/DropdownMenuContent.vue";
import DropdownMenuItem from "../../../src/components/common/dropdown-menu/DropdownMenuItem.vue";
import DropdownMenuLabel from "../../../src/components/common/dropdown-menu/DropdownMenuLabel.vue";
import DropdownMenuSeparator from "../../../src/components/common/dropdown-menu/DropdownMenuSeparator.vue";
import Button from "../../../src/components/common/button/Button.vue";

const meta = {
  title: "Components/Common",
  component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dropdown: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      Button,
    },
    template: `
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="secondary">Open Menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    `,
  }),
}; 