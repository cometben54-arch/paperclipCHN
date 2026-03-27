import { useState } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Command as CommandIcon,
  DollarSign,
  Hexagon,
  History,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusIcon } from "@/components/StatusIcon";
import { PriorityIcon } from "@/components/PriorityIcon";
import { agentStatusDot, agentStatusDotDefault } from "@/lib/status-colors";
import { EntityRow } from "@/components/EntityRow";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar, type FilterValue } from "@/components/FilterBar";
import { InlineEditor } from "@/components/InlineEditor";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Identity } from "@/components/Identity";

/* ------------------------------------------------------------------ */
/*  区块容器                                                            */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <Separator />
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  颜色色块                                                            */
/* ------------------------------------------------------------------ */

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-md border border-border shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <p className="text-xs font-mono">{cssVar}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  页面                                                               */
/* ------------------------------------------------------------------ */

export function DesignGuide() {
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [selectValue, setSelectValue] = useState("in_progress");
  const [menuChecked, setMenuChecked] = useState(true);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [inlineText, setInlineText] = useState("点击编辑此文本");
  const [inlineTitle, setInlineTitle] = useState("可编辑标题");
  const [inlineDesc, setInlineDesc] = useState(
    "这是一段可编辑的描述。点击即可编辑 — 文本区域会自动调整大小以适应内容，不会产生布局偏移。"
  );
  const [filters, setFilters] = useState<FilterValue[]>([
    { key: "status", label: "状态", value: "活跃" },
    { key: "priority", label: "优先级", value: "高" },
  ]);

  return (
    <div className="space-y-10 max-w-4xl">
      {/* 页面标题 */}
      <div>
        <h2 className="text-xl font-bold">设计指南</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Paperclip 中使用的每个组件、样式和模式。
        </p>
      </div>

      {/* ============================================================ */}
      {/*  覆盖范围                                                     */}
      {/* ============================================================ */}
      <Section title="组件覆盖范围">
        <p className="text-sm text-muted-foreground">
          当新的 UI 基础组件或应用级模式发布时，此页面应随之更新。
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title="UI 基础组件">
            <div className="flex flex-wrap gap-2">
              {[
                "avatar", "badge", "breadcrumb", "button", "card", "checkbox", "collapsible",
                "command", "dialog", "dropdown-menu", "input", "label", "popover", "scroll-area",
                "select", "separator", "sheet", "skeleton", "tabs", "textarea", "tooltip",
              ].map((name) => (
                <Badge key={name} variant="outline" className="font-mono text-[10px]">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
          <SubSection title="应用组件">
            <div className="flex flex-wrap gap-2">
              {[
                "StatusBadge", "StatusIcon", "PriorityIcon", "EntityRow", "EmptyState", "MetricCard",
                "FilterBar", "InlineEditor", "PageSkeleton", "Identity", "CommentThread", "MarkdownEditor",
                "PropertiesPanel", "Sidebar", "CommandPalette",
              ].map((name) => (
                <Badge key={name} variant="ghost" className="font-mono text-[10px]">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  颜色                                                         */}
      {/* ============================================================ */}
      <Section title="颜色">
        <SubSection title="核心">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="背景" cssVar="--background" />
            <Swatch name="前景" cssVar="--foreground" />
            <Swatch name="卡片" cssVar="--card" />
            <Swatch name="主色" cssVar="--primary" />
            <Swatch name="主色前景" cssVar="--primary-foreground" />
            <Swatch name="次要色" cssVar="--secondary" />
            <Swatch name="柔和色" cssVar="--muted" />
            <Swatch name="柔和前景色" cssVar="--muted-foreground" />
            <Swatch name="强调色" cssVar="--accent" />
            <Swatch name="危险色" cssVar="--destructive" />
            <Swatch name="边框" cssVar="--border" />
            <Swatch name="聚焦环" cssVar="--ring" />
          </div>
        </SubSection>

        <SubSection title="侧边栏">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="侧边栏" cssVar="--sidebar" />
            <Swatch name="侧边栏边框" cssVar="--sidebar-border" />
          </div>
        </SubSection>

        <SubSection title="图表">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name="图表 1" cssVar="--chart-1" />
            <Swatch name="图表 2" cssVar="--chart-2" />
            <Swatch name="图表 3" cssVar="--chart-3" />
            <Swatch name="图表 4" cssVar="--chart-4" />
            <Swatch name="图表 5" cssVar="--chart-5" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TYPOGRAPHY                                                   */}
      {/* ============================================================ */}
      <Section title="字体排版">
        <div className="space-y-3">
          <h2 className="text-xl font-bold">页面标题 — text-xl font-bold</h2>
          <h2 className="text-lg font-semibold">章节标题 — text-lg font-semibold</h2>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            章节标题 — text-sm font-semibold uppercase tracking-wide
          </h3>
          <p className="text-sm font-medium">卡片标题 — text-sm font-medium</p>
          <p className="text-sm font-semibold">卡片标题（备用） — text-sm font-semibold</p>
          <p className="text-sm">正文 — text-sm</p>
          <p className="text-sm text-muted-foreground">
            柔和描述 — text-sm text-muted-foreground
          </p>
          <p className="text-xs text-muted-foreground">
            小标签 — text-xs text-muted-foreground
          </p>
          <p className="text-sm font-mono text-muted-foreground">
            等宽标识符 — text-sm font-mono text-muted-foreground
          </p>
          <p className="text-2xl font-bold">大数字 — text-2xl font-bold</p>
          <p className="font-mono text-xs">日志/代码文本 — font-mono text-xs</p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SPACING & RADIUS                                             */}
      {/* ============================================================ */}
      <Section title="圆角">
        <div className="flex items-end gap-4 flex-wrap">
          {[
            ["sm", "var(--radius-sm)"],
            ["md", "var(--radius-md)"],
            ["lg", "var(--radius-lg)"],
            ["xl", "var(--radius-xl)"],
            ["full", "9999px"],
          ].map(([label, radius]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-12 w-12 bg-primary"
                style={{ borderRadius: radius }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BUTTONS                                                      */}
      {/* ============================================================ */}
      <Section title="按钮">
        <SubSection title="变体">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="default">默认</Button>
            <Button variant="secondary">次要</Button>
            <Button variant="outline">轮廓</Button>
            <Button variant="ghost">幽灵</Button>
            <Button variant="destructive">危险</Button>
            <Button variant="link">链接</Button>
          </div>
        </SubSection>

        <SubSection title="尺寸">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="xs">超小</Button>
            <Button size="sm">小</Button>
            <Button size="default">默认</Button>
            <Button size="lg">大</Button>
          </div>
        </SubSection>

        <SubSection title="图标按钮">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon-xs"><Search /></Button>
            <Button variant="ghost" size="icon-sm"><Search /></Button>
            <Button variant="outline" size="icon"><Search /></Button>
            <Button variant="outline" size="icon-lg"><Search /></Button>
          </div>
        </SubSection>

        <SubSection title="带图标">
          <div className="flex items-center gap-2 flex-wrap">
            <Button><Plus /> 新建问题</Button>
            <Button variant="outline"><Upload /> 上传</Button>
            <Button variant="destructive"><Trash2 /> 删除</Button>
            <Button size="sm"><Plus /> 添加</Button>
          </div>
        </SubSection>

        <SubSection title="状态">
          <div className="flex items-center gap-2 flex-wrap">
            <Button disabled>禁用</Button>
            <Button variant="outline" disabled>禁用轮廓</Button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  BADGES                                                       */}
      {/* ============================================================ */}
      <Section title="徽章">
        <SubSection title="变体">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">默认</Badge>
            <Badge variant="secondary">次要</Badge>
            <Badge variant="outline">轮廓</Badge>
            <Badge variant="destructive">危险</Badge>
            <Badge variant="ghost">幽灵</Badge>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  STATUS BADGES & ICONS                                        */}
      {/* ============================================================ */}
      <Section title="状态系统">
        <SubSection title="StatusBadge (all statuses)">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              "active", "running", "paused", "idle", "archived", "planned",
              "achieved", "completed", "failed", "timed_out", "succeeded", "error",
              "pending_approval", "backlog", "todo", "in_progress", "in_review", "blocked",
              "done", "terminated", "cancelled", "pending", "revision_requested",
              "approved", "rejected",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </SubSection>

        <SubSection title="StatusIcon (interactive)">
          <div className="flex items-center gap-3 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"].map(
              (s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusIcon status={s} />
                  <span className="text-xs text-muted-foreground">{s}</span>
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon status={status} onChange={setStatus} />
            <span className="text-sm">点击图标更改状态（当前：{status}）</span>
          </div>
        </SubSection>

        <SubSection title="PriorityIcon (interactive)">
          <div className="flex items-center gap-3 flex-wrap">
            {["critical", "high", "medium", "low"].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <PriorityIcon priority={p} />
                <span className="text-xs text-muted-foreground">{p}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <PriorityIcon priority={priority} onChange={setPriority} />
            <span className="text-sm">点击图标更改（当前：{priority}）</span>
          </div>
        </SubSection>

        <SubSection title="智能体状态指示点">
          <div className="flex items-center gap-4 flex-wrap">
            {(["running", "active", "paused", "error", "archived"] as const).map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`inline-flex h-full w-full rounded-full ${agentStatusDot[label] ?? agentStatusDotDefault}`} />
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="运行调用徽章">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              ["timer", "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"],
              ["assignment", "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"],
              ["on_demand", "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"],
              ["automation", "bg-muted text-muted-foreground"],
            ].map(([label, cls]) => (
              <span key={label} className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
                {label}
              </span>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FORM ELEMENTS                                                */}
      {/* ============================================================ */}
      <Section title="表单元素">
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title="输入框">
            <Input placeholder="默认输入" />
            <Input placeholder="禁用输入" disabled className="mt-2" />
          </SubSection>

          <SubSection title="文本域">
            <Textarea placeholder="请输入内容..." />
          </SubSection>

          <SubSection title="复选框和标签">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="check1" defaultChecked />
                <Label htmlFor="check1">已选中项</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check2" />
                <Label htmlFor="check2">未选中项</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check3" disabled />
                <Label htmlFor="check3">禁用项</Label>
              </div>
            </div>
          </SubSection>

          <SubSection title="行内编辑器">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">标题（单行）</p>
                <InlineEditor
                  value={inlineTitle}
                  onSave={setInlineTitle}
                  as="h2"
                  className="text-xl font-bold"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">正文（单行）</p>
                <InlineEditor
                  value={inlineText}
                  onSave={setInlineText}
                  as="p"
                  className="text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">描述（多行，自动调整大小）</p>
                <InlineEditor
                  value={inlineDesc}
                  onSave={setInlineDesc}
                  as="p"
                  className="text-sm text-muted-foreground"
                  placeholder="添加描述..."
                  multiline
                />
              </div>
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SELECT                                                       */}
      {/* ============================================================ */}
      <Section title="选择器">
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title="默认尺寸">
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">当前值：{selectValue}</p>
          </SubSection>
          <SubSection title="小尺寸触发器">
            <Select defaultValue="high">
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DROPDOWN MENU                                                */}
      {/* ============================================================ */}
      <Section title="下拉菜单">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              快捷操作
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Check className="h-4 w-4" />
              标记为已完成
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookOpen className="h-4 w-4" />
              打开文档
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={menuChecked}
              onCheckedChange={(value) => setMenuChecked(value === true)}
            >
              关注问题
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 className="h-4 w-4" />
              删除问题
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      {/* ============================================================ */}
      {/*  POPOVER                                                      */}
      {/* ============================================================ */}
      <Section title="弹出框">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">打开弹出框</Button>
          </PopoverTrigger>
          <PopoverContent className="space-y-2">
            <p className="text-sm font-medium">智能体心跳</p>
            <p className="text-xs text-muted-foreground">
              上次运行在 24 秒前成功。下次定时运行在 9 分钟后。
            </p>
            <Button size="xs">立即唤醒</Button>
          </PopoverContent>
        </Popover>
      </Section>

      {/* ============================================================ */}
      {/*  COLLAPSIBLE                                                  */}
      {/* ============================================================ */}
      <Section title="可折叠">
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {collapsibleOpen ? "隐藏" : "显示"}高级筛选
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="owner-filter">负责人</Label>
              <Input id="owner-filter" placeholder="按智能体名称筛选" />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      {/* ============================================================ */}
      {/*  SHEET                                                        */}
      {/* ============================================================ */}
      <Section title="侧面板">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">打开侧面板</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>问题属性</SheetTitle>
              <SheetDescription>无需离开当前页面即可编辑元数据。</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-1">
                <Label htmlFor="sheet-title">标题</Label>
                <Input id="sheet-title" defaultValue="改进入门文档" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sheet-description">描述</Label>
                <Textarea id="sheet-description" defaultValue="记录设置中的陷阱和截图。" />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline">取消</Button>
              <Button>保存</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Section>

      {/* ============================================================ */}
      {/*  SCROLL AREA                                                  */}
      {/* ============================================================ */}
      <Section title="滚动区域">
        <ScrollArea className="h-36 rounded-md border border-border">
          <div className="space-y-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-2 text-sm">
                心跳运行 #{i + 1}：已成功完成
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      {/* ============================================================ */}
      {/*  COMMAND                                                      */}
      {/* ============================================================ */}
      <Section title="命令面板 (CMDK)">
        <div className="rounded-md border border-border">
          <Command>
            <CommandInput placeholder="输入命令或搜索..." />
            <CommandList>
              <CommandEmpty>未找到结果。</CommandEmpty>
              <CommandGroup heading="页面">
                <CommandItem>
                  <LayoutDashboard className="h-4 w-4" />
                  仪表板
                </CommandItem>
                <CommandItem>
                  <CircleDot className="h-4 w-4" />
                  问题
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="操作">
                <CommandItem>
                  <CommandIcon className="h-4 w-4" />
                  打开命令面板
                </CommandItem>
                <CommandItem>
                  <Plus className="h-4 w-4" />
                  创建新问题
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <Section title="面包屑">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">项目</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Paperclip App</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>问题列表</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* ============================================================ */}
      {/*  CARDS                                                        */}
      {/* ============================================================ */}
      <Section title="卡片">
        <SubSection title="标准卡片">
          <Card>
            <CardHeader>
              <CardTitle>卡片标题</CardTitle>
              <CardDescription>卡片描述及辅助文本。</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">卡片内容在此处。这是主体区域。</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">操作</Button>
              <Button variant="outline" size="sm">取消</Button>
            </CardFooter>
          </Card>
        </SubSection>

        <SubSection title="指标卡片">
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard icon={Bot} value={12} label="活跃智能体" description="本周 +3" />
            <MetricCard icon={CircleDot} value={48} label="待处理问题" />
            <MetricCard icon={DollarSign} value="$1,234" label="月度成本" description="低于预算" />
            <MetricCard icon={Zap} value="99.9%" label="运行时间" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TABS                                                         */}
      {/* ============================================================ */}
      <Section title="标签页">
        <SubSection title="默认（药丸）变体">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">概览</TabsTrigger>
              <TabsTrigger value="runs">运行</TabsTrigger>
              <TabsTrigger value="config">配置</TabsTrigger>
              <TabsTrigger value="costs">成本</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground py-4">概览标签页内容。</p>
            </TabsContent>
            <TabsContent value="runs">
              <p className="text-sm text-muted-foreground py-4">运行标签页内容。</p>
            </TabsContent>
            <TabsContent value="config">
              <p className="text-sm text-muted-foreground py-4">配置标签页内容。</p>
            </TabsContent>
            <TabsContent value="costs">
              <p className="text-sm text-muted-foreground py-4">成本标签页内容。</p>
            </TabsContent>
          </Tabs>
        </SubSection>

        <SubSection title="线条变体">
          <Tabs defaultValue="summary">
            <TabsList variant="line">
              <TabsTrigger value="summary">摘要</TabsTrigger>
              <TabsTrigger value="details">详情</TabsTrigger>
              <TabsTrigger value="comments">评论</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <p className="text-sm text-muted-foreground py-4">带下划线标签页的摘要内容。</p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-sm text-muted-foreground py-4">详情内容。</p>
            </TabsContent>
            <TabsContent value="comments">
              <p className="text-sm text-muted-foreground py-4">评论内容。</p>
            </TabsContent>
          </Tabs>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  ENTITY ROWS                                                  */}
      {/* ============================================================ */}
      <Section title="实体行">
        <div className="border border-border rounded-md">
          <EntityRow
            leading={
              <>
                <StatusIcon status="in_progress" />
                <PriorityIcon priority="high" />
              </>
            }
            identifier="PAP-001"
            title="实现身份验证流程"
            subtitle="已分配给 Agent Alpha"
            trailing={<StatusBadge status="in_progress" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="done" />
                <PriorityIcon priority="medium" />
              </>
            }
            identifier="PAP-002"
            title="搭建 CI/CD 流水线"
            subtitle="2 天前完成"
            trailing={<StatusBadge status="done" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="todo" />
                <PriorityIcon priority="low" />
              </>
            }
            identifier="PAP-003"
            title="编写 API 文档"
            trailing={<StatusBadge status="todo" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="blocked" />
                <PriorityIcon priority="critical" />
              </>
            }
            identifier="PAP-004"
            title="部署到生产环境"
            subtitle="被 PAP-001 阻塞"
            trailing={<StatusBadge status="blocked" />}
            selected
          />
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  FILTER BAR                                                   */}
      {/* ============================================================ */}
      <Section title="筛选栏">
        <FilterBar
          filters={filters}
          onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
          onClear={() => setFilters([])}
        />
        {filters.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters([
                { key: "status", label: "状态", value: "活跃" },
                { key: "priority", label: "优先级", value: "高" },
              ])
            }
          >
            重置筛选
          </Button>
        )}
      </Section>

      {/* ============================================================ */}
      {/*  AVATARS                                                      */}
      {/* ============================================================ */}
      <Section title="头像">
        <SubSection title="尺寸">
          <div className="flex items-center gap-3">
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>DF</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </div>
        </SubSection>

        <SubSection title="组合">
          <AvatarGroup>
            <Avatar><AvatarFallback>A1</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A2</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A3</AvatarFallback></Avatar>
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  IDENTITY                                                     */}
      {/* ============================================================ */}
      <Section title="身份标识">
        <SubSection title="尺寸">
          <div className="flex items-center gap-6">
            <Identity name="Agent Alpha" size="sm" />
            <Identity name="Agent Alpha" />
            <Identity name="Agent Alpha" size="lg" />
          </div>
        </SubSection>

        <SubSection title="首字母推导">
          <div className="flex flex-col gap-2">
            <Identity name="CEO Agent" size="sm" />
            <Identity name="Alpha" size="sm" />
            <Identity name="Quality Assurance Lead" size="sm" />
          </div>
        </SubSection>

        <SubSection title="自定义首字母">
          <Identity name="Backend Service" initials="BS" size="sm" />
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLTIPS                                                     */}
      {/* ============================================================ */}
      <Section title="工具提示">
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">悬停查看</Button>
            </TooltipTrigger>
            <TooltipContent>这是一个工具提示</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm"><Settings /></Button>
            </TooltipTrigger>
            <TooltipContent>设置</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DIALOG                                                       */}
      {/* ============================================================ */}
      <Section title="对话框">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">打开对话框</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>对话框标题</DialogTitle>
              <DialogDescription>
                这是一个示例对话框，展示了包含标题、内容和底部的标准布局。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>名称</Label>
                <Input placeholder="输入名称" className="mt-1.5" />
              </div>
              <div>
                <Label>描述</Label>
                <Textarea placeholder="请描述..." className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">取消</Button>
              <Button>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      {/* ============================================================ */}
      {/*  EMPTY STATE                                                  */}
      {/* ============================================================ */}
      <Section title="空状态">
        <div className="border border-border rounded-md">
          <EmptyState
            icon={Inbox}
            message="没有可显示的项目。创建您的第一个项目以开始使用。"
            action="创建项目"
            onAction={() => {}}
          />
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROGRESS BARS                                                */}
      {/* ============================================================ */}
      <Section title="进度条（预算）">
        <div className="space-y-3">
          {[
            { label: "低于预算 (40%)", pct: 40, color: "bg-green-400" },
            { label: "警告 (75%)", pct: 75, color: "bg-yellow-400" },
            { label: "超出预算 (95%)", pct: 95, color: "bg-red-400" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-150 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  LOG VIEWER                                                   */}
      {/* ============================================================ */}
      <Section title="日志查看器">
        <div className="bg-neutral-950 rounded-lg p-3 font-mono text-xs max-h-80 overflow-y-auto">
          <div className="text-foreground">[12:00:01] INFO  智能体已成功启动</div>
          <div className="text-foreground">[12:00:02] INFO  正在处理任务 PAP-001</div>
          <div className="text-yellow-400">[12:00:05] WARN  速率限制即将达到 (80%)</div>
          <div className="text-foreground">[12:00:08] INFO  任务 PAP-001 已完成</div>
          <div className="text-red-400">[12:00:12] ERROR 连接上游服务超时</div>
          <div className="text-blue-300">[12:00:12] SYS   5秒后重试连接...</div>
          <div className="text-foreground">[12:00:17] INFO  已成功重新连接</div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 animate-pulse" />
              <span className="inline-flex h-full w-full rounded-full bg-cyan-400" />
            </span>
            <span className="text-cyan-400">实时</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROPERTY ROW PATTERN                                         */}
      {/* ============================================================ */}
      <Section title="属性行模式">
        <div className="border border-border rounded-md p-4 space-y-1 max-w-sm">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">状态</span>
            <StatusBadge status="active" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">优先级</span>
            <PriorityIcon priority="high" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">负责人</span>
            <div className="flex items-center gap-1.5">
              <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
              <span className="text-xs">Agent Alpha</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">创建时间</span>
            <span className="text-xs">Jan 15, 2025</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  NAVIGATION PATTERNS                                          */}
      {/* ============================================================ */}
      <Section title="导航模式">
        <SubSection title="侧边栏导航项">
          <div className="w-60 border border-border rounded-md p-3 space-y-0.5 bg-card">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />
              仪表板
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <CircleDot className="h-4 w-4" />
              问题
              <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                12
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Bot className="h-4 w-4" />
              智能体
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Hexagon className="h-4 w-4" />
              项目
            </div>
          </div>
        </SubSection>

        <SubSection title="视图切换">
          <div className="flex items-center border border-border rounded-md w-fit">
            <button className="px-3 py-1.5 text-xs font-medium bg-accent text-foreground rounded-l-md">
              <ListTodo className="h-3.5 w-3.5 inline mr-1" />
              列表
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 rounded-r-md">
              <Target className="h-3.5 w-3.5 inline mr-1" />
              组织
            </button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  GROUPED LIST (Issues pattern)                                */}
      {/* ============================================================ */}
      <Section title="分组列表（问题模式）">
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-t-md">
            <StatusIcon status="in_progress" />
            <span className="text-sm font-medium">进行中</span>
            <span className="text-xs text-muted-foreground ml-1">2</span>
          </div>
          <div className="border border-border rounded-b-md">
            <EntityRow
              leading={<PriorityIcon priority="high" />}
              identifier="PAP-101"
              title="构建智能体心跳系统"
              onClick={() => {}}
            />
            <EntityRow
              leading={<PriorityIcon priority="medium" />}
              identifier="PAP-102"
              title="添加成本追踪仪表板"
              onClick={() => {}}
            />
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COMMENT THREAD PATTERN                                       */}
      {/* ============================================================ */}
      <Section title="评论主题模式">
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-sm font-semibold">评论 (2)</h3>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">智能体</span>
                <span className="text-xs text-muted-foreground">Jan 15, 2025</span>
              </div>
              <p className="text-sm">已开始处理身份验证模块。需要配置 API 密钥。</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">人类</span>
                <span className="text-xs text-muted-foreground">Jan 16, 2025</span>
              </div>
              <p className="text-sm">API 密钥已添加到保管库。请继续。</p>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea placeholder="留下评论..." rows={3} />
            <Button size="sm">评论</Button>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COST TABLE PATTERN                                           */}
      {/* ============================================================ */}
      <Section title="成本表格模式">
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-accent/20">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">模型</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">令牌数</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">费用</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-sonnet-4-20250514</td>
                <td className="px-3 py-2 font-mono">1.2M</td>
                <td className="px-3 py-2 font-mono">$18.00</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-haiku-4-20250506</td>
                <td className="px-3 py-2 font-mono">500k</td>
                <td className="px-3 py-2 font-mono">$1.25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">总计</td>
                <td className="px-3 py-2 font-mono">1.7M</td>
                <td className="px-3 py-2 font-mono font-medium">$19.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SKELETONS                                                    */}
      {/* ============================================================ */}
      <Section title="骨架屏">
        <SubSection title="单独">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-20 w-full" />
          </div>
        </SubSection>

        <SubSection title="页面骨架屏（列表）">
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="list" />
          </div>
        </SubSection>

        <SubSection title="页面骨架屏（详情）">
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="detail" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  SEPARATOR                                                    */}
      {/* ============================================================ */}
      <Section title="分隔线">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">水平</p>
          <Separator />
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm">左</span>
            <Separator orientation="vertical" />
            <span className="text-sm">右</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  ICON REFERENCE                                               */}
      {/* ============================================================ */}
      <Section title="常用图标 (Lucide)">
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {[
            ["Inbox", Inbox],
            ["ListTodo", ListTodo],
            ["CircleDot", CircleDot],
            ["Hexagon", Hexagon],
            ["Target", Target],
            ["LayoutDashboard", LayoutDashboard],
            ["Bot", Bot],
            ["DollarSign", DollarSign],
            ["History", History],
            ["Search", Search],
            ["Plus", Plus],
            ["Trash2", Trash2],
            ["Settings", Settings],
            ["User", User],
            ["Mail", Mail],
            ["Upload", Upload],
            ["Zap", Zap],
          ].map(([name, Icon]) => {
            const LucideIcon = Icon as React.FC<{ className?: string }>;
            return (
              <div key={name as string} className="flex flex-col items-center gap-1.5 p-2">
                <LucideIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono">{name as string}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  KEYBOARD SHORTCUTS                                           */}
      {/* ============================================================ */}
      <Section title="键盘快捷键">
        <div className="border border-border rounded-md divide-y divide-border text-sm">
          {[
            ["Cmd+K / Ctrl+K", "打开命令面板"],
            ["C", "新建问题（输入框外）"],
            ["[", "切换侧边栏"],
            ["]", "切换属性面板"],

            ["Cmd+Enter / Ctrl+Enter", "提交 Markdown 评论"],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded border border-border">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
