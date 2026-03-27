import { Database, Gauge, ReceiptText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SURFACES = [
  {
    title: "推理账本",
    description: "来自 cost_events 的请求级用量和计费运行记录。",
    icon: Database,
    points: ["token + 计费金额", "供应商、计费方、模型", "支持订阅和超额感知"],
    tone: "from-sky-500/12 via-sky-500/6 to-transparent",
  },
  {
    title: "财务账本",
    description: "非单次提示-响应对的账户级费用。",
    icon: ReceiptText,
    points: ["充值、退款、手续费", "Bedrock 预置或训练费用", "额度过期和调整"],
    tone: "from-amber-500/14 via-amber-500/6 to-transparent",
  },
  {
    title: "实时配额",
    description: "可实时阻断流量的供应商或计费方窗口。",
    icon: Gauge,
    points: ["供应商配额窗口", "计费方额度系统", "直接展示错误信息"],
    tone: "from-emerald-500/14 via-emerald-500/6 to-transparent",
  },
] as const;

export function AccountingModelCard() {
  return (
    <Card className="relative overflow-hidden border-border/70">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.1),transparent_32%)]" />
      <CardHeader className="relative px-5 pt-5 pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          计费模型
        </CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-6">
          Paperclip 现在将请求级推理用量与账户级财务事件分开管理。
          当计费方是 OpenRouter、Cloudflare、Bedrock 或其他中间商时，这能确保供应商报告的准确性。
        </CardDescription>
      </CardHeader>
      <CardContent className="relative grid gap-3 px-5 pb-5 md:grid-cols-3">
        {SURFACES.map((surface) => {
          const Icon = surface.icon;
          return (
            <div
              key={surface.title}
              className={`rounded-2xl border border-border/70 bg-gradient-to-br ${surface.tone} p-4 shadow-sm`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background/80">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{surface.title}</div>
                  <div className="text-xs text-muted-foreground">{surface.description}</div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {surface.points.map((point) => (
                  <div key={point}>{point}</div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
