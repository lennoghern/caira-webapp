import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "../../foundations/icon/Icon";
import { Backdrop, Section, ThemeMatrix } from "../../test/story-kit";
import { Label } from "../label/Label";
import { List, ListHeader, ListItem, ListSection } from "./List";

const meta = {
  title: "Layout/List",
  component: List,
  args: { listStyle: "plain", selectionStyle: "highlight", selectionMode: "single" },
  argTypes: {
    listStyle: { control: "inline-radio", options: ["plain", "inset"] },
    selectionStyle: { control: "inline-radio", options: ["highlight", "checkmark"] },
    selectionMode: { control: "inline-radio", options: ["none", "single", "multiple"] },
  },
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

function Mailboxes(props: React.ComponentProps<typeof List>) {
  return (
    <List aria-label="Mailboxes" {...props}>
      <ListItem id="inbox">Inbox</ListItem>
      <ListItem id="drafts">Drafts</ListItem>
      <ListItem id="sent">Sent</ListItem>
      <ListItem id="trash">Trash</ListItem>
    </List>
  );
}

export const Playground: Story = {
  render: (args) => (
    <Backdrop kind="plain" className="p-10">
      <Mailboxes {...args} defaultSelectedKeys={["drafts"]} className="max-w-xs" />
    </Backdrop>
  ),
};

export const StylesAndSelection: Story = {
  name: "Styles and selection",
  render: () => (
    <Section
      title="Styles and selection"
      note="Plain rows run edge to edge; the inset style sets a group apart in a filled shape. A list that leads somewhere keeps its selected row highlighted; a list of options shows a checkmark instead (HIG Lists and tables). Row height follows the Density switch of the toolbar."
    >
      <Backdrop kind="plain" className="grid items-start gap-6 p-6 sm:grid-cols-3">
        <Mailboxes selectionMode="single" defaultSelectedKeys={["drafts"]} data-testid="plain" />
        <Mailboxes aria-label="Mailboxes, inset" listStyle="inset" selectionMode="single" defaultSelectedKeys={["sent"]} data-testid="inset" />
        <Mailboxes
          aria-label="Mailboxes to show"
          listStyle="inset"
          selectionMode="multiple"
          selectionStyle="checkmark"
          defaultSelectedKeys={["inbox", "sent"]}
          data-testid="checkmark"
        />
      </Backdrop>
    </Section>
  ),
};

export const SectionsAndRows: Story = {
  name: "Sections and row content",
  render: () => (
    <Section
      title="Sections and row content"
      note="Headers in title-style capitalization name each group. A row can carry a leading icon, supplemental text, a disclosure indicator for drilling in, and controls of its own, reached with the Right arrow. The last row is disabled."
    >
      <Backdrop kind="plain" className="grid items-start gap-6 p-6 sm:grid-cols-2">
        <List aria-label="Settings" listStyle="inset" selectionMode="single" disabledKeys={["vpn"]} data-testid="sections">
          <ListSection>
            <ListHeader>Network</ListHeader>
            <ListItem id="wifi" textValue="Wi-Fi" disclosureIndicator>
              <Label icon={<Icon name="info" />}>Wi-Fi</Label>
              <Label level="secondary" className="ms-auto">
                Home
              </Label>
            </ListItem>
            <ListItem id="bluetooth" textValue="Bluetooth" disclosureIndicator>
              <Label icon={<Icon name="info" />}>Bluetooth</Label>
              <Label level="secondary" className="ms-auto">
                On
              </Label>
            </ListItem>
            <ListItem id="vpn" textValue="VPN">
              <Label icon={<Icon name="info" />}>VPN</Label>
            </ListItem>
          </ListSection>
          <ListSection>
            <ListHeader>Display</ListHeader>
            <ListItem id="brightness" textValue="Brightness" disclosureIndicator>
              <Label icon={<Icon name="info" />}>Brightness</Label>
            </ListItem>
          </ListSection>
        </List>
        <div className="grid content-start gap-6">
          <List aria-label="Downloads" data-testid="with-controls">
            <ListItem id="report" textValue="Report">
              <Label lineLimit={1}>Report, a file with a long name that does not fit in the row</Label>
              <button className="ms-auto shrink-0 text-accent-text underline">Show in folder</button>
            </ListItem>
            <ListItem id="budget" textValue="Budget">
              <Label>Budget</Label>
              <button className="ms-auto shrink-0 text-accent-text underline">Show in folder</button>
            </ListItem>
          </List>
          <List aria-label="Search results" listStyle="inset" renderEmptyState={() => "No results"} data-testid="empty" />
        </div>
      </Backdrop>
    </Section>
  ),
};

export const ThemeStates: Story = {
  name: "Theme matrix",
  render: () => (
    <ThemeMatrix backdrop="plain" cellClassName="items-start">
      {() => (
        <List aria-label="Mailboxes" listStyle="inset" selectionMode="single" defaultSelectedKeys={["drafts"]} disabledKeys={["trash"]} className="w-full">
          <ListItem id="inbox" textValue="Inbox">
            <Label>Inbox</Label>
            <Label level="secondary" className="ms-auto">
              12
            </Label>
          </ListItem>
          <ListItem id="drafts" textValue="Drafts">
            <Label>Drafts</Label>
            <Label level="secondary" className="ms-auto">
              3
            </Label>
          </ListItem>
          <ListItem id="trash">Trash</ListItem>
        </List>
      )}
    </ThemeMatrix>
  ),
};
