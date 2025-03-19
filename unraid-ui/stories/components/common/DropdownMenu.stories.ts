import type { Meta, StoryObj } from '@storybook/vue3';
import { MoreVertical } from 'lucide-vue-next';
import Button from '../../../src/components/common/button/Button.vue';
import DropdownMenu from '../../../src/components/common/dropdown-menu/DropdownMenu.vue';
import DropdownMenuContent from '../../../src/components/common/dropdown-menu/DropdownMenuContent.vue';
import DropdownMenuItem from '../../../src/components/common/dropdown-menu/DropdownMenuItem.vue';
import DropdownMenuLabel from '../../../src/components/common/dropdown-menu/DropdownMenuLabel.vue';
import DropdownMenuSeparator from '../../../src/components/common/dropdown-menu/DropdownMenuSeparator.vue';
import DropdownMenuTrigger from '../../../src/components/common/dropdown-menu/DropdownMenuTrigger.vue';

const meta = {
  title: 'Components/Common/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Controls the open state of the dropdown menu',
    },
  },
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

export const IconDropdown: Story = {
  render: () => ({
    components: {
      DropdownMenu,
      DropdownMenuTrigger,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      Button,
      MoreVertical,
    },
    template: ` 
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" size="icon">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
    `,
  }),
};
