/**
 * @fileoverview 插件 UI 插槽系统 — 动态加载、错误隔离和插件贡献的 UI 扩展渲染。
 *
 * 提供：
 * - `usePluginSlots(type, context?)` — React hook，用于发现和过滤指定插槽类型的插件 UI 贡献。
 * - `PluginSlotOutlet` — 内联渲染所有匹配的插槽，并为每个插件提供错误边界隔离。
 * - `PluginBridgeScope` — 包装每个插件的组件树，注入桥接 hook 所需的桥接上下文
 *   （`pluginId`、主机上下文）。
 *
 * 插件 UI 模块通过从主机静态文件服务器（`/_plugins/:pluginId/ui/:entryFile`）
 * 动态 ESM `import()` 加载。每个模块导出与清单中 `ui.slots[].exportName`
 * 对应的命名 React 组件。
 *
 * @see PLUGIN_SPEC.md §19 — UI 扩展模型
 * @see PLUGIN_SPEC.md §19.0.3 — 包服务
 */
import {
  Component,
  createElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
  type ComponentType,
} from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  PluginLauncherDeclaration,
  PluginUiSlotDeclaration,
  PluginUiSlotEntityType,
  PluginUiSlotType,
} from "@paperclipai/shared";
import { pluginsApi, type PluginUiContribution } from "@/api/plugins";
import { authApi } from "@/api/auth";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import {
  PluginBridgeContext,
  type PluginHostContext,
} from "./bridge";

export type PluginSlotContext = {
  companyId?: string | null;
  companyPrefix?: string | null;
  projectId?: string | null;
  entityId?: string | null;
  entityType?: PluginUiSlotEntityType | null;
  /** 嵌套插槽的父实体 ID（例如任务中的评论注释）。 */
  parentEntityId?: string | null;
  projectRef?: string | null;
};

export type ResolvedPluginSlot = PluginUiSlotDeclaration & {
  pluginId: string;
  pluginKey: string;
  pluginDisplayName: string;
  pluginVersion: string;
};

type PluginSlotComponentProps = {
  slot: ResolvedPluginSlot;
  context: PluginSlotContext;
};

export type RegisteredPluginComponent =
  | {
    kind: "react";
    component: ComponentType<PluginSlotComponentProps>;
  }
  | {
    kind: "web-component";
    tagName: string;
  };

type SlotFilters = {
  slotTypes: PluginUiSlotType[];
  entityType?: PluginUiSlotEntityType | null;
  companyId?: string | null;
  enabled?: boolean;
};

type UsePluginSlotsResult = {
  slots: ResolvedPluginSlot[];
  isLoading: boolean;
  errorMessage: string | null;
};

/**
 * 主机页面加载的插件 UI 导出的内存注册表。
 * 键为 `${pluginKey}:${exportName}`，与清单插槽声明匹配。
 */
const registry = new Map<string, RegisteredPluginComponent>();

function buildRegistryKey(pluginKey: string, exportName: string): string {
  return `${pluginKey}:${exportName}`;
}

function requiresEntityType(slotType: PluginUiSlotType): boolean {
  return slotType === "detailTab" || slotType === "taskDetailView" || slotType === "contextMenuItem" || slotType === "commentAnnotation" || slotType === "commentContextMenuItem" || slotType === "projectSidebarItem" || slotType === "toolbarButton";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "未知错误";
}

/**
 * 为插件 UI 插槽注册一个 React 组件导出。
 */
export function registerPluginReactComponent(
  pluginKey: string,
  exportName: string,
  component: ComponentType<PluginSlotComponentProps>,
): void {
  registry.set(buildRegistryKey(pluginKey, exportName), {
    kind: "react",
    component,
  });
}

/**
 * 为插件 UI 插槽注册一个自定义元素标签。
 */
export function registerPluginWebComponent(
  pluginKey: string,
  exportName: string,
  tagName: string,
): void {
  registry.set(buildRegistryKey(pluginKey, exportName), {
    kind: "web-component",
    tagName,
  });
}

function resolveRegisteredComponent(slot: ResolvedPluginSlot): RegisteredPluginComponent | null {
  return registry.get(buildRegistryKey(slot.pluginKey, slot.exportName)) ?? null;
}

export function resolveRegisteredPluginComponent(
  pluginKey: string,
  exportName: string,
): RegisteredPluginComponent | null {
  return registry.get(buildRegistryKey(pluginKey, exportName)) ?? null;
}

// ---------------------------------------------------------------------------
// 插件模块动态导入加载器
// ---------------------------------------------------------------------------

type PluginLoadState = "idle" | "loading" | "loaded" | "error";

/**
 * 按贡献缓存键跟踪每个插件 UI 模块的加载状态。
 *
 * 插件模块加载后，其所有命名导出会被检查并注册到组件 `registry` 中，
 * 以便 `resolveRegisteredComponent` 在插槽渲染时能够找到它们。
 */
const pluginLoadStates = new Map<string, PluginLoadState>();

/**
 * Promise 缓存，防止同一插件的并发重复导入。
 */
const inflightImports = new Map<string, Promise<void>>();

/**
 * 构建插件 UI 入口模块的完整 URL。
 *
 * 服务器在 `/_plugins/:pluginId/ui/*` 提供插件 UI 包。
 * 贡献中的 `uiEntryFile`（通常为 `"index.js"`）被追加以形成完整的导入路径。
 */
function buildPluginModuleKey(contribution: PluginUiContribution): string {
  const cacheHint = contribution.updatedAt ?? contribution.version ?? "0";
  return `${contribution.pluginId}:${cacheHint}`;
}

function buildPluginUiUrl(contribution: PluginUiContribution): string {
  const cacheHint = encodeURIComponent(contribution.updatedAt ?? contribution.version ?? "0");
  return `/_plugins/${encodeURIComponent(contribution.pluginId)}/ui/${contribution.uiEntryFile}?v=${cacheHint}`;
}

/**
 * 导入带有裸说明符重写的插件 UI 入口模块。
 *
 * 插件包使用 `external: ["@paperclipai/plugin-sdk/ui", "react", "react-dom"]` 构建，
 * 因此其 ESM 输出包含如下裸说明符导入：
 *
 * ```js
 * import { usePluginData } from "@paperclipai/plugin-sdk/ui";
 * import React from "react";
 * ```
 *
 * 浏览器无法在没有导入映射的情况下解析裸说明符。我们不使用导入映射的时序约束，
 * 而是：
 * 1. 获取模块源文本
 * 2. 将裸说明符导入重写为 blob URL，从主机的全局桥接注册表
 *    （`globalThis.__paperclipPluginBridge__`）重新导出
 * 3. 通过 blob URL 导入重写后的模块
 *
 * 此方法兼容所有现代浏览器，并避免了导入映射的排序问题。
 */
const shimBlobUrls: Record<string, string> = {};

function applyJsxRuntimeKey(
  props: Record<string, unknown> | null | undefined,
  key: string | number | undefined,
): Record<string, unknown> {
  if (key === undefined) return props ?? {};
  return { ...(props ?? {}), key };
}

function getShimBlobUrl(specifier: "react" | "react-dom" | "react-dom/client" | "react/jsx-runtime" | "sdk-ui"): string {
  if (shimBlobUrls[specifier]) return shimBlobUrls[specifier];

  let source: string;
  switch (specifier) {
    case "react":
      source = `
        const R = globalThis.__paperclipPluginBridge__?.react;
        export default R;
        const { useState, useEffect, useCallback, useMemo, useRef, useContext,
          createContext, createElement, Fragment, Component, forwardRef,
          memo, lazy, Suspense, StrictMode, cloneElement, Children,
          isValidElement, createRef } = R;
        export { useState, useEffect, useCallback, useMemo, useRef, useContext,
          createContext, createElement, Fragment, Component, forwardRef,
          memo, lazy, Suspense, StrictMode, cloneElement, Children,
          isValidElement, createRef };
      `;
      break;
    case "react/jsx-runtime":
      source = `
        const R = globalThis.__paperclipPluginBridge__?.react;
        const withKey = ${applyJsxRuntimeKey.toString()};
        export const jsx = (type, props, key) => R.createElement(type, withKey(props, key));
        export const jsxs = (type, props, key) => R.createElement(type, withKey(props, key));
        export const Fragment = R.Fragment;
      `;
      break;
    case "react-dom":
    case "react-dom/client":
      source = `
        const RD = globalThis.__paperclipPluginBridge__?.reactDom;
        export default RD;
        const { createRoot, hydrateRoot, createPortal, flushSync } = RD ?? {};
        export { createRoot, hydrateRoot, createPortal, flushSync };
      `;
      break;
    case "sdk-ui":
      source = `
        const SDK = globalThis.__paperclipPluginBridge__?.sdkUi ?? {};
        const { usePluginData, usePluginAction, useHostContext, usePluginStream, usePluginToast } = SDK;
        export { usePluginData, usePluginAction, useHostContext, usePluginStream, usePluginToast };
      `;
      break;
  }

  const blob = new Blob([source], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  shimBlobUrls[specifier] = url;
  return url;
}

/**
 * 将 ESM 源字符串中的裸说明符导入重写为 blob URL。
 *
 * 处理 esbuild/rollup 生成的标准导入模式：
 * - `import { ... } from "react";`
 * - `import React from "react";`
 * - `import * as React from "react";`
 * - `import { ... } from "@paperclipai/plugin-sdk/ui";`
 *
 * 也处理重导出：
 * - `export { ... } from "react";`
 */
function rewriteBareSpecifiers(source: string): string {
  // 构建裸说明符到 blob URL 的映射。
  const rewrites: Record<string, string> = {
    '"@paperclipai/plugin-sdk/ui"': `"${getShimBlobUrl("sdk-ui")}"`,
    "'@paperclipai/plugin-sdk/ui'": `'${getShimBlobUrl("sdk-ui")}'`,
    '"@paperclipai/plugin-sdk/ui/hooks"': `"${getShimBlobUrl("sdk-ui")}"`,
    "'@paperclipai/plugin-sdk/ui/hooks'": `'${getShimBlobUrl("sdk-ui")}'`,
    '"react/jsx-runtime"': `"${getShimBlobUrl("react/jsx-runtime")}"`,
    "'react/jsx-runtime'": `'${getShimBlobUrl("react/jsx-runtime")}'`,
    '"react-dom/client"': `"${getShimBlobUrl("react-dom/client")}"`,
    "'react-dom/client'": `'${getShimBlobUrl("react-dom/client")}'`,
    '"react-dom"': `"${getShimBlobUrl("react-dom")}"`,
    "'react-dom'": `'${getShimBlobUrl("react-dom")}'`,
    '"react"': `"${getShimBlobUrl("react")}"`,
    "'react'": `'${getShimBlobUrl("react")}'`,
  };

  let result = source;
  for (const [from, to] of Object.entries(rewrites)) {
    // 仅在 import/export from 上下文中重写，不在任意字符串中重写。
    // 正则匹配 `from "..."` 或 `from '...'` 模式。
    result = result.replaceAll(` from ${from}`, ` from ${to}`);
    // 也处理 `import "..."`（副作用导入）
    result = result.replaceAll(`import ${from}`, `import ${to}`);
  }

  return result;
}

/**
 * 获取、重写并导入插件 UI 模块。
 *
 * @param url - 插件 UI 入口模块的 URL
 * @returns 模块的导出
 */
async function importPluginModule(url: string): Promise<Record<string, unknown>> {
  // 检查桥接注册表是否可用。如果不可用，回退到直接导入
  //（裸说明符会失败但不会导致加载器崩溃）。
  if (!globalThis.__paperclipPluginBridge__) {
    console.warn("[plugin-loader] 桥接注册表未初始化，回退到直接导入");
    return import(/* @vite-ignore */ url);
  }

  // 获取模块源文本
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`获取插件模块失败：${response.status} ${response.statusText}`);
  }

  const source = await response.text();

  // 将裸说明符导入重写为 blob URL
  const rewritten = rewriteBareSpecifiers(source);

  // 从重写后的源创建 blob URL 并导入
  const blob = new Blob([rewritten], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const mod = await import(/* @vite-ignore */ blobUrl);
    return mod;
  } finally {
    // 导入后清理 blob URL（模块已加载）
    URL.revokeObjectURL(blobUrl);
  }
}

/**
 * Dynamically import a plugin's UI entry module and register all named
 * exports that look like React components (functions or classes) into the
 * component registry.
 *
 * This replaces the previous approach where plugin bundles had to
 * self-register via `window.paperclipPlugins.registerReactComponent()`.
 * Now the host is responsible for importing the module and binding
 * exports to the correct `pluginKey:exportName` registry keys.
 *
 * Plugin modules are loaded with bare-specifier rewriting so that imports
 * of `@paperclipai/plugin-sdk/ui`, `react`, and `react-dom` resolve to the
 * host-provided implementations via the bridge registry.
 *
 * Web-component registrations still work: if the module has a named export
 * that matches an `exportName` declared in a slot AND that export is a
 * string (the custom element tag name), it's registered as a web component.
 */
async function loadPluginModule(contribution: PluginUiContribution): Promise<void> {
  const { pluginId, pluginKey, slots, launchers } = contribution;
  const moduleKey = buildPluginModuleKey(contribution);

  // Already loaded or loading — return early.
  const state = pluginLoadStates.get(moduleKey);
  if (state === "loaded" || state === "loading") {
    // If currently loading, wait for the inflight promise.
    const inflight = inflightImports.get(pluginId);
    if (inflight) await inflight;
    return;
  }

  // If another import for this plugin ID is currently in progress, wait for it.
  const running = inflightImports.get(pluginId);
  if (running) {
    await running;
    const recheckedState = pluginLoadStates.get(moduleKey);
    if (recheckedState === "loaded") {
      return;
    }
  }

  pluginLoadStates.set(moduleKey, "loading");

  const url = buildPluginUiUrl(contribution);

  const importPromise = (async () => {
    try {
      // Dynamic ESM import of the plugin's UI entry module with
      // bare-specifier rewriting for host-provided dependencies.
      const mod: Record<string, unknown> = await importPluginModule(url);

      // Collect the set of export names declared across all UI contributions so
      // we only register what the manifest advertises (ignore extra exports).
      const declaredExports = new Set<string>();
      for (const slot of slots) {
        declaredExports.add(slot.exportName);
      }
      for (const launcher of launchers) {
        if (launcher.exportName) {
          declaredExports.add(launcher.exportName);
        }
        if (isLauncherComponentTarget(launcher)) {
          declaredExports.add(launcher.action.target);
        }
      }

      for (const exportName of declaredExports) {
        const exported = mod[exportName];
        if (exported === undefined) {
          console.warn(
            `Plugin "${pluginKey}" declares slot export "${exportName}" but the module does not export it.`,
          );
          continue;
        }

        if (typeof exported === "function") {
          // React component (function component or class component).
          registerPluginReactComponent(
            pluginKey,
            exportName,
            exported as ComponentType<PluginSlotComponentProps>,
          );
        } else if (typeof exported === "string") {
          // Web component tag name.
          registerPluginWebComponent(pluginKey, exportName, exported);
        } else {
          console.warn(
            `Plugin "${pluginKey}" export "${exportName}" is neither a function nor a string tag name — skipping.`,
          );
        }
      }

      pluginLoadStates.set(moduleKey, "loaded");
    } catch (err) {
      pluginLoadStates.set(moduleKey, "error");
      console.error(`Failed to load UI module for plugin "${pluginKey}"`, err);
    } finally {
      inflightImports.delete(pluginId);
    }
  })();

  inflightImports.set(pluginId, importPromise);
  await importPromise;
}

function isLauncherComponentTarget(launcher: PluginLauncherDeclaration): boolean {
  return launcher.action.type === "openModal"
    || launcher.action.type === "openDrawer"
    || launcher.action.type === "openPopover";
}

/**
 * Load UI modules for a set of plugin contributions.
 *
 * Returns a promise that resolves once all modules have been loaded (or
 * failed). Plugins that are already loaded are skipped.
 */
async function ensurePluginModulesLoaded(contributions: PluginUiContribution[]): Promise<void> {
  await Promise.all(
    contributions.map((c) => loadPluginModule(c)),
  );
}

export async function ensurePluginContributionLoaded(
  contribution: PluginUiContribution,
): Promise<void> {
  await loadPluginModule(contribution);
}

/**
 * Returns the aggregate load state across a set of plugin contributions.
 * - If any plugin is still loading → "loading"
 * - If all are loaded (or no contributions) → "loaded"
 * - If all finished but some errored → "loaded" (errors are logged, not fatal)
 */
function aggregateLoadState(contributions: PluginUiContribution[]): "loading" | "loaded" {
  for (const c of contributions) {
    const state = pluginLoadStates.get(buildPluginModuleKey(c));
    if (state === "loading" || state === "idle" || state === undefined) {
      return "loading";
    }
  }
  return "loaded";
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

/**
 * Trigger dynamic loading of plugin UI modules when contributions change.
 *
 * This hook is intentionally decoupled from usePluginSlots so that callers
 * who consume slots via `usePluginSlots()` automatically get module loading
 * without extra wiring.
 */
function usePluginModuleLoader(contributions: PluginUiContribution[] | undefined) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!contributions || contributions.length === 0) return;

    // Filter to contributions that haven't been loaded yet.
    const unloaded = contributions.filter((c) => {
      const state = pluginLoadStates.get(buildPluginModuleKey(c));
      return state !== "loaded" && state !== "loading";
    });

    if (unloaded.length === 0) return;

    let cancelled = false;
    void ensurePluginModulesLoaded(unloaded).then(() => {
      // Re-render so the slot mount can resolve the newly-registered components.
      if (!cancelled) setTick((t) => t + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [contributions]);
}

/**
 * Resolves and sorts slots across all ready plugin contributions.
 *
 * Filtering rules:
 * - `slotTypes` must match one of the caller-requested host slot types.
 * - Entity-scoped slot types (`detailTab`, `taskDetailView`, `contextMenuItem`)
 *   require `entityType` and must include it in `slot.entityTypes`.
 *
 * Automatically triggers dynamic import of plugin UI modules for any
 * newly-discovered contributions. Components render once loading completes.
 */
export function usePluginSlots(filters: SlotFilters): UsePluginSlotsResult {
  const queryEnabled = filters.enabled ?? true;
  const { data, isLoading: isQueryLoading, error } = useQuery({
    queryKey: queryKeys.plugins.uiContributions,
    queryFn: () => pluginsApi.listUiContributions(),
    enabled: queryEnabled,
  });

  // Kick off dynamic imports for any new plugin contributions.
  usePluginModuleLoader(data);

  const slotTypesKey = useMemo(() => [...filters.slotTypes].sort().join("|"), [filters.slotTypes]);

  const slots = useMemo(() => {
    const allowedTypes = new Set(slotTypesKey.split("|").filter(Boolean) as PluginUiSlotType[]);
    const rows: ResolvedPluginSlot[] = [];
    for (const contribution of data ?? []) {
      for (const slot of contribution.slots) {
        if (!allowedTypes.has(slot.type)) continue;
        if (requiresEntityType(slot.type)) {
          if (!filters.entityType) continue;
          if (!slot.entityTypes?.includes(filters.entityType)) continue;
        }
        rows.push({
          ...slot,
          pluginId: contribution.pluginId,
          pluginKey: contribution.pluginKey,
          pluginDisplayName: contribution.displayName,
          pluginVersion: contribution.version,
        });
      }
    }
    rows.sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      const pluginCmp = a.pluginDisplayName.localeCompare(b.pluginDisplayName);
      if (pluginCmp !== 0) return pluginCmp;
      return a.displayName.localeCompare(b.displayName);
    });
    return rows;
  }, [data, filters.entityType, slotTypesKey]);

  // Consider loading until both query and module imports are done.
  const modulesLoaded = data ? aggregateLoadState(data) === "loaded" : true;
  const isLoading = queryEnabled && (isQueryLoading || !modulesLoaded);

  return {
    slots,
    isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
  };
}

type PluginSlotErrorBoundaryProps = {
  slot: ResolvedPluginSlot;
  className?: string;
  children: ReactNode;
};

type PluginSlotErrorBoundaryState = {
  hasError: boolean;
};

class PluginSlotErrorBoundary extends Component<PluginSlotErrorBoundaryProps, PluginSlotErrorBoundaryState> {
  override state: PluginSlotErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PluginSlotErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    // Keep plugin failures isolated while preserving actionable diagnostics.
    console.error("Plugin slot render failed", {
      pluginKey: this.props.slot.pluginKey,
      slotId: this.props.slot.id,
      error,
      info: info.componentStack,
    });
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className={cn("rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive", this.props.className)}>
          {this.props.slot.pluginDisplayName}: failed to render
        </div>
      );
    }
    return this.props.children;
  }
}

function PluginWebComponentMount({
  tagName,
  slot,
  context,
  className,
}: {
  tagName: string;
  slot: ResolvedPluginSlot;
  context: PluginSlotContext;
  className?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Bridge manifest slot/context metadata onto the custom element instance.
    const el = ref.current as HTMLElement & {
      pluginSlot?: ResolvedPluginSlot;
      pluginContext?: PluginSlotContext;
    };
    el.pluginSlot = slot;
    el.pluginContext = context;
  }, [context, slot]);

  return createElement(tagName, { ref, className });
}

type PluginSlotMountProps = {
  slot: ResolvedPluginSlot;
  context: PluginSlotContext;
  className?: string;
  missingBehavior?: "hidden" | "placeholder";
};

/**
 * Maps the slot's `PluginSlotContext` to a `PluginHostContext` for the bridge.
 *
 * The bridge hooks need the full host context shape; the slot context carries
 * the subset available from the rendering location.
 */
function slotContextToHostContext(
  pluginSlotContext: PluginSlotContext,
  userId: string | null,
): PluginHostContext {
  return {
    companyId: pluginSlotContext.companyId ?? null,
    companyPrefix: pluginSlotContext.companyPrefix ?? null,
    projectId: pluginSlotContext.projectId ?? (pluginSlotContext.entityType === "project" ? pluginSlotContext.entityId ?? null : null),
    entityId: pluginSlotContext.entityId ?? null,
    entityType: pluginSlotContext.entityType ?? null,
    parentEntityId: pluginSlotContext.parentEntityId ?? null,
    userId,
    renderEnvironment: null,
  };
}

/**
 * Wrapper component that sets the active bridge context around plugin renders.
 *
 * This ensures that `usePluginData()`, `usePluginAction()`, and `useHostContext()`
 * have access to the current plugin ID and host context during the render phase.
 */
function PluginBridgeScope({
  pluginId,
  context,
  children,
}: {
  pluginId: string;
  context: PluginSlotContext;
  children: ReactNode;
}) {
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const userId = session?.user?.id ?? session?.session?.userId ?? null;
  const hostContext = useMemo(() => slotContextToHostContext(context, userId), [context, userId]);
  const value = useMemo(() => ({ pluginId, hostContext }), [pluginId, hostContext]);

  return (
    <PluginBridgeContext.Provider value={value}>
      {children}
    </PluginBridgeContext.Provider>
  );
}

export function PluginSlotMount({
  slot,
  context,
  className,
  missingBehavior = "hidden",
}: PluginSlotMountProps) {
  const [, forceRerender] = useState(0);
  const component = resolveRegisteredComponent(slot);

  useEffect(() => {
    if (component) return;
    const inflight = inflightImports.get(slot.pluginId);
    if (!inflight) return;

    let cancelled = false;
    void inflight.finally(() => {
      if (!cancelled) {
        forceRerender((tick) => tick + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [component, slot.pluginId]);

  if (!component) {
    if (missingBehavior === "hidden") return null;
    return (
      <div className={cn("rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground", className)}>
        {slot.pluginDisplayName}: {slot.displayName}
      </div>
    );
  }

  if (component.kind === "react") {
    const node = createElement(component.component, { slot, context });
    return (
      <PluginSlotErrorBoundary slot={slot} className={className}>
        <PluginBridgeScope pluginId={slot.pluginId} context={context}>
          {className ? <div className={className}>{node}</div> : node}
        </PluginBridgeScope>
      </PluginSlotErrorBoundary>
    );
  }

  return (
    <PluginSlotErrorBoundary slot={slot} className={className}>
      <PluginWebComponentMount
        tagName={component.tagName}
        slot={slot}
        context={context}
        className={className}
      />
    </PluginSlotErrorBoundary>
  );
}

type PluginSlotOutletProps = {
  slotTypes: PluginUiSlotType[];
  context: PluginSlotContext;
  entityType?: PluginUiSlotEntityType | null;
  className?: string;
  itemClassName?: string;
  errorClassName?: string;
  missingBehavior?: "hidden" | "placeholder";
};

export function PluginSlotOutlet({
  slotTypes,
  context,
  entityType,
  className,
  itemClassName,
  errorClassName,
  missingBehavior = "hidden",
}: PluginSlotOutletProps) {
  const { slots, errorMessage } = usePluginSlots({
    slotTypes,
    entityType,
    companyId: context.companyId,
  });

  if (errorMessage) {
    return (
      <div className={cn("rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive", errorClassName)}>
        Plugin extensions unavailable: {errorMessage}
      </div>
    );
  }

  if (slots.length === 0) return null;

  return (
    <div className={className}>
      {slots.map((slot) => (
        <PluginSlotMount
          key={`${slot.pluginKey}:${slot.id}`}
          slot={slot}
          context={context}
          className={itemClassName}
          missingBehavior={missingBehavior}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Test helpers — exported for use in test suites only.
// ---------------------------------------------------------------------------

/**
 * Reset the module loader state. Only use in tests.
 * @internal
 */
export function _resetPluginModuleLoader(): void {
  pluginLoadStates.clear();
  inflightImports.clear();
  registry.clear();
  if (typeof URL.revokeObjectURL === "function") {
    for (const url of Object.values(shimBlobUrls)) {
      URL.revokeObjectURL(url);
    }
  }
  for (const key of Object.keys(shimBlobUrls)) {
    delete shimBlobUrls[key];
  }
}

export const _applyJsxRuntimeKeyForTests = applyJsxRuntimeKey;
export const _rewriteBareSpecifiersForTests = rewriteBareSpecifiers;
