import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Search01Icon, Task01Icon, InboxIcon, Analytics01Icon, UserMultipleIcon,
  InvoiceIcon, ContactBookIcon, AiBrain01Icon, MagicWand01Icon, Book02Icon,
  Settings02Icon, StarIcon, CircleIcon, ArrowRight01Icon, ArrowDown01Icon,
  ArrowLeft01Icon, UnfoldMoreIcon, Add01Icon, ArrowUpDownIcon, FilterHorizontalIcon,
  Download04Icon, Mail01Icon, MoreHorizontalIcon, Tick02Icon, PencilEdit01Icon,
  ArrowTurnBackwardIcon, ArrowUpRight01Icon, Cancel01Icon, File02Icon,
  ArrowUp01Icon, ViewIcon, Copy01Icon, SecurityCheckIcon, UserSettings01Icon,
  FlashIcon, ArrowDownToLineIcon, Clock01Icon, AiMagicIcon,
  ArrowUp02Icon, Attachment01Icon, Globe02Icon, MessageAdd01Icon,
  Flag03Icon, ListViewIcon, KanbanIcon, Invoice01Icon, Archive02Icon, Mic01Icon,
} from "@hugeicons/core-free-icons";

/** Premium icon set — Hugeicons (stroke-rounded). Single source of truth for the OS. */
export const I = {
  search: Search01Icon,
  tasks: Task01Icon,
  inbox: InboxIcon,
  reports: Analytics01Icon,
  clients: UserMultipleIcon,
  returns: InvoiceIcon,
  contacts: ContactBookIcon,
  agents: AiBrain01Icon,
  skills: MagicWand01Icon,
  knowledge: Book02Icon,
  settings: Settings02Icon,
  star: StarIcon,
  list: CircleIcon,
  chevronRight: ArrowRight01Icon,
  chevronDown: ArrowDown01Icon,
  chevronLeft: ArrowLeft01Icon,
  switcher: UnfoldMoreIcon,
  plus: Add01Icon,
  sort: ArrowUpDownIcon,
  filter: FilterHorizontalIcon,
  download: Download04Icon,
  mail: Mail01Icon,
  more: MoreHorizontalIcon,
  check: Tick02Icon,
  edit: PencilEdit01Icon,
  sendBack: ArrowTurnBackwardIcon,
  escalate: ArrowUpRight01Icon,
  close: Cancel01Icon,
  file: File02Icon,
  deltaUp: ArrowUp01Icon,
  deltaDown: ArrowDown01Icon,
  eye: ViewIcon,
  copy: Copy01Icon,
  shield: SecurityCheckIcon,
  persona: UserSettings01Icon,
  trigger: FlashIcon,
  output: ArrowDownToLineIcon,
  history: Clock01Icon,
  sparkle: AiMagicIcon,
  send: ArrowUp02Icon,
  attach: Attachment01Icon,
  globe: Globe02Icon,
  newChat: MessageAdd01Icon,
  flag: Flag03Icon,
  viewList: ListViewIcon,
  viewBoard: KanbanIcon,
  billing: Invoice01Icon,
  archive: Archive02Icon,
  mic: Mic01Icon,
} as const;

export type IconName = keyof typeof I;

/**
 * Render a premium Hugeicon. `size` is px; color follows `currentColor`,
 * so pass a text-* class for color.
 */
export function Icon({
  icon,
  size = 16,
  strokeWidth = 1.5,
  className,
}: {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeWidth} className={className} />;
}
