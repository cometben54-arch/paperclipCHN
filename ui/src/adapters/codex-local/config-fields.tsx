import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  ToggleField,
  DraftInput,
  help,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";
import { LocalWorkspaceRuntimeFields } from "../local-workspace-runtime-fields";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";
const instructionsFileHint =
  "Markdown 文件的绝对路径（例如 AGENTS.md），用于定义该智能体的行为。在运行时注入系统提示词中。注意：Codex 可能仍会自动应用工作区中仓库级别的 AGENTS.md 文件。";

export function CodexLocalConfigFields({
  mode,
  isCreate,
  adapterType,
  values,
  set,
  config,
  eff,
  mark,
  models,
  hideInstructionsFile,
}: AdapterConfigFieldsProps) {
  const bypassEnabled =
    config.dangerouslyBypassApprovalsAndSandbox === true || config.dangerouslyBypassSandbox === true;

  return (
    <>
      {!hideInstructionsFile && (
        <Field label="智能体指令文件" hint={instructionsFileHint}>
          <div className="flex items-center gap-2">
            <DraftInput
              value={
                isCreate
                  ? values!.instructionsFilePath ?? ""
                  : eff(
                      "adapterConfig",
                      "instructionsFilePath",
                      String(config.instructionsFilePath ?? ""),
                    )
              }
              onCommit={(v) =>
                isCreate
                  ? set!({ instructionsFilePath: v })
                  : mark("adapterConfig", "instructionsFilePath", v || undefined)
              }
              immediate
              className={inputClass}
              placeholder="/absolute/path/to/AGENTS.md"
            />
            <ChoosePathButton />
          </div>
        </Field>
      )}
      <ToggleField
        label="绕过沙盒"
        hint={help.dangerouslyBypassSandbox}
        checked={
          isCreate
            ? values!.dangerouslyBypassSandbox
            : eff(
                "adapterConfig",
                "dangerouslyBypassApprovalsAndSandbox",
                bypassEnabled,
              )
        }
        onChange={(v) =>
          isCreate
            ? set!({ dangerouslyBypassSandbox: v })
            : mark("adapterConfig", "dangerouslyBypassApprovalsAndSandbox", v)
        }
      />
      <ToggleField
        label="启用搜索"
        hint={help.search}
        checked={
          isCreate
            ? values!.search
            : eff("adapterConfig", "search", !!config.search)
        }
        onChange={(v) =>
          isCreate
            ? set!({ search: v })
            : mark("adapterConfig", "search", v)
        }
      />
      <LocalWorkspaceRuntimeFields
        isCreate={isCreate}
        values={values}
        set={set}
        config={config}
        mark={mark}
        eff={eff}
        mode={mode}
        adapterType={adapterType}
        models={models}
      />
    </>
  );
}
