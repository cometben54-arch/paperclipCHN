import { useState, useRef, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";

/* ---- 帮助文本，用于 (?) 提示气泡 ---- */
export const help: Record<string, string> = {
  name: "此智能体的显示名称。",
  title: "在组织架构图中显示的职位名称。",
  role: "组织角色。决定职位和能力。",
  reportsTo: "此智能体在组织层级中的上级。",
  capabilities: "描述此智能体的能力。显示在组织架构图中，并用于任务路由。",
  adapterType: "此智能体的运行方式：本地 CLI（Claude/Codex/OpenCode）、OpenClaw 网关、启动进程或通用 HTTP Webhook。",
  cwd: "已弃用的本地适配器旧版工作目录回退。现有智能体可能仍保留此值，但新配置应改用项目工作区。",
  promptTemplate: "每次心跳时发送。保持简短和动态。用于当前任务的上下文提示，而非大量静态指令。支持 {{ agent.id }}、{{ agent.name }}、{{ agent.role }} 等模板变量。",
  model: "覆盖适配器使用的默认模型。",
  thinkingEffort: "控制模型推理深度。支持的值因适配器/模型而异。",
  chrome: "通过传递 --chrome 启用 Claude 的 Chrome 集成。",
  dangerouslySkipPermissions: "在支持的情况下自动批准适配器权限提示，实现无人值守运行。",
  dangerouslyBypassSandbox: "不使用沙盒限制运行 Codex。文件系统/网络访问需要此选项。",
  search: "在运行期间启用 Codex 网页搜索功能。",
  workspaceStrategy: "Paperclip 为此智能体创建执行工作区的方式。保持 project_primary 用于常规 cwd 执行，或使用 git_worktree 进行事项级别的隔离检出。",
  workspaceBaseRef: "创建工作树分支时使用的基础 git 引用。留空则使用已解析的工作区引用或 HEAD。",
  workspaceBranchTemplate: "派生分支的命名模板。支持 {{issue.identifier}}、{{issue.title}}、{{agent.name}}、{{project.id}}、{{workspace.repoRef}} 和 {{slug}}。",
  worktreeParentDir: "创建派生工作树的目录。支持绝对路径、~前缀路径和仓库相对路径。",
  runtimeServicesJson: "可选的工作区运行时服务定义。用于共享应用服务器、工作进程或其他附加到工作区的长期运行的伴生进程。",
  maxTurnsPerRun: "每次心跳运行的最大智能体轮次（工具调用）数。",
  command: "要执行的命令（例如 node、python）。",
  localCommand: "覆盖适配器调用的 CLI 命令路径（例如 /usr/local/bin/claude、codex、opencode）。",
  args: "命令行参数，以逗号分隔。",
  extraArgs: "本地适配器的额外 CLI 参数，以逗号分隔。",
  envVars: "注入到适配器进程的环境变量。使用纯文本值或密钥引用。",
  bootstrapPrompt: "仅在 Paperclip 启动新会话时发送。用于不需要在每次心跳时重复的稳定设置指导。",
  payloadTemplateJson: "可选的 JSON，在 Paperclip 添加标准唤醒和工作区字段之前，合并到远程适配器请求载荷中。",
  webhookUrl: "智能体被调用时接收 POST 请求的 URL。",
  heartbeatInterval: "按定时器自动运行此智能体。适用于检查新工作等周期性任务。",
  intervalSec: "自动心跳调用之间的秒数。",
  timeoutSec: "运行被终止前的最大秒数。0 表示无超时。",
  graceSec: "发送中断信号后等待多少秒再强制终止进程。",
  wakeOnDemand: "允许通过分配、API 调用、UI 操作或自动化系统唤醒此智能体。",
  cooldownSec: "连续心跳运行之间的最小秒数。",
  maxConcurrentRuns: "此智能体可同时执行的最大心跳运行数。",
  budgetMonthlyCents: "月度支出限额（美分）。0 表示无限制。",
};

export const adapterLabels: Record<string, string> = {
  claude_local: "Claude（本地）",
  codex_local: "Codex（本地）",
  gemini_local: "Gemini CLI（本地）",
  opencode_local: "OpenCode（本地）",
  openclaw_gateway: "OpenClaw 网关",
  cursor: "Cursor（本地）",
  process: "进程",
  http: "HTTP",
};

export const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

/* ---- 基础组件 ---- */

export function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <HelpCircle className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      {children}
    </div>
  );
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <HintIcon text={hint} />}
      </div>
      <button
        data-slot="toggle"
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-green-600" : "bg-muted"
        )}
        onClick={() => onChange(!checked)}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

export function ToggleWithNumber({
  label,
  hint,
  checked,
  onCheckedChange,
  number,
  onNumberChange,
  numberLabel,
  numberHint,
  numberPrefix,
  showNumber,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  number: number;
  onNumberChange: (v: number) => void;
  numberLabel: string;
  numberHint?: string;
  numberPrefix?: string;
  showNumber: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {hint && <HintIcon text={hint} />}
        </div>
        <button
          data-slot="toggle"
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
            checked ? "bg-green-600" : "bg-muted"
          )}
          onClick={() => onCheckedChange(!checked)}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
              checked ? "translate-x-4.5" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
      {showNumber && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {numberPrefix && <span>{numberPrefix}</span>}
          <input
            type="number"
            className="w-16 rounded-md border border-border px-2 py-0.5 bg-transparent outline-none text-xs font-mono text-center"
            value={number}
            onChange={(e) => onNumberChange(Number(e.target.value))}
          />
          <span>{numberLabel}</span>
          {numberHint && <HintIcon text={numberHint} />}
        </div>
      )}
    </div>
  );
}

export function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  bordered,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(bordered && "border-t border-border")}>
      <button
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/30 transition-colors"
        onClick={onToggle}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {icon}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function AutoExpandTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={{ minHeight }}
    />
  );
}

/**
 * 管理内部草稿状态的文本输入框。
 * 在失焦时调用 `onCommit`（如果设置了 `immediate`，则在每次更改时也调用）。
 */
export function DraftInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      {...props}
    />
  );
}

/**
 * 带草稿状态和失焦提交的自动扩展文本域。
 */
export function DraftTextarea({
  value,
  onCommit,
  immediate,
  placeholder,
  minRows,
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  placeholder?: string;
  minRows?: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [draft, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      style={{ minHeight }}
    />
  );
}

/**
 * 带草稿状态和失焦提交的数字输入框。
 */
export function DraftNumberInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: number;
  onCommit: (v: number) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "type">) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      type="number"
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(Number(e.target.value) || 0);
      }}
      onBlur={() => {
        const num = Number(draft) || 0;
        if (num !== value) onCommit(num);
      }}
      {...props}
    />
  );
}

/**
 * "选择"按钮，打开一个对话框说明由于浏览器安全限制，
 * 用户必须手动输入路径。
 */
export function ChoosePathButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shrink-0"
        onClick={() => setOpen(true)}
      >
        选择
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>手动指定路径</DialogTitle>
            <DialogDescription>
              浏览器安全限制阻止应用通过文件选择器读取完整的本地路径。
              请复制绝对路径并粘贴到输入框中。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section className="space-y-1.5">
              <p className="font-medium">macOS (Finder)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>在 Finder 中找到文件夹。</li>
                <li>按住 <kbd>Option</kbd> 键并右键点击文件夹。</li>
                <li>点击"将&lt;文件夹名&gt;拷贝为路径名"。</li>
                <li>将结果粘贴到路径输入框中。</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                /Users/yourname/Documents/project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">Windows (文件资源管理器)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>在文件资源管理器中找到文件夹。</li>
                <li>按住 <kbd>Shift</kbd> 键并右键点击文件夹。</li>
                <li>点击"复制为路径"。</li>
                <li>将结果粘贴到路径输入框中。</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                C:\Users\yourname\Documents\project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">终端备选方案 (macOS/Linux)</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>运行 <code>cd /path/to/folder</code>。</li>
                <li>运行 <code>pwd</code>。</li>
                <li>复制输出结果并粘贴到路径输入框中。</li>
              </ol>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * 标签 + 输入框同行渲染（紧凑字段的内联布局）。
 */
export function InlineField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      <div className="w-24 ml-auto">{children}</div>
    </div>
  );
}
