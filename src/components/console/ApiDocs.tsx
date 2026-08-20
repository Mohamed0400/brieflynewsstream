"use client";

import Link from "next/link";
import { KeyboardEvent, useMemo, useState } from "react";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import {
  apiDocExampleTabs,
  apiDocGroups,
  findApiDocEndpoint,
  findApiDocGroup,
  type ApiDocExampleTab,
  type ApiEndpoint,
} from "@/lib/api-docs";
import { toast } from "@/lib/toast";

function exampleSource(endpoint: ApiEndpoint, tab: ApiDocExampleTab) {
  if (tab === "curl") return endpoint.curl;
  if (tab === "fetch") return endpoint.fetch;
  return endpoint.response;
}

export function ApiDocs() {
  const { copy } = useConsoleCopy();
  const text = copy.apiDocs;
  const authLabels = {
    none: text.authNone,
    "api-key": text.authKey,
    admin: text.authAdmin,
  } as const;

  async function copyExample(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(text.copied);
    } catch {
      toast.error(text.copyFailed, text.copyFailedHint);
    }
  }
  const [groupId, setGroupId] = useState(apiDocGroups[0].id);
  const [endpointId, setEndpointId] = useState(apiDocGroups[0].endpoints[0].id);
  const [exampleTab, setExampleTab] = useState<ApiDocExampleTab>("curl");

  const group = useMemo(() => findApiDocGroup(groupId), [groupId]);
  const endpoint = useMemo(
    () => findApiDocEndpoint(groupId, endpointId),
    [groupId, endpointId],
  );
  const example = exampleSource(endpoint, exampleTab);
  const parameters = endpoint.query ?? endpoint.body ?? [];
  const parameterKind = endpoint.body ? text.jsonBody : text.queryParams;

  function selectGroup(nextGroupId: string) {
    const next = findApiDocGroup(nextGroupId);
    setGroupId(next.id);
    setEndpointId(next.endpoints[0].id);
    setExampleTab("curl");
  }

  function selectEndpoint(nextEndpointId: string) {
    setEndpointId(nextEndpointId);
    setExampleTab("curl");
  }

  function onGroupKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = apiDocGroups.findIndex((item) => item.id === groupId);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      selectGroup(apiDocGroups[(index + 1) % apiDocGroups.length].id);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      selectGroup(apiDocGroups[(index - 1 + apiDocGroups.length) % apiDocGroups.length].id);
    }
  }

  return (
    <div className="api-docs">
      <header className="console-page-header">
        <p className="console-kicker">{text.kicker}</p>
        <h1>{text.heading}</h1>
        <p className="console-page-description">
          {text.description}
        </p>
      </header>

      <div className="api-docs-layout">
        <aside className="api-docs-sidebar">
          <div
            className="api-docs-group-tabs"
            role="tablist"
            aria-label={text.sectionsAria}
            onKeyDown={onGroupKeyDown}
          >
            {apiDocGroups.map((item) => {
              const labels = text.groups[item.id as keyof typeof text.groups];
              const selected = item.id === groupId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`api-group-${item.id}`}
                  aria-label={labels.label}
                  aria-selected={selected}
                  aria-controls="api-docs-panel"
                  tabIndex={selected ? 0 : -1}
                  className="api-docs-group-tab"
                  onClick={() => selectGroup(item.id)}
                >
                  <span>{labels.label}</span>
                  <small aria-hidden="true">{labels.hint}</small>
                </button>
              );
            })}
          </div>

          <div className="api-docs-endpoint-nav" aria-label={text.endpointsAria(text.groups[group.id as keyof typeof text.groups].label)}>
            <label className="api-docs-endpoint-select-wrap" htmlFor="api-docs-endpoint-select">
              <span>{text.endpoint}</span>
              <select
                id="api-docs-endpoint-select"
                className="console-input"
                dir="ltr"
                value={endpoint.id}
                onChange={(event) => selectEndpoint(event.target.value)}
              >
                {group.endpoints.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.method} {item.path}
                  </option>
                ))}
              </select>
            </label>
            <div className="api-docs-endpoint-list">
              {group.endpoints.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="api-docs-endpoint-link"
                  data-active={item.id === endpoint.id ? "true" : "false"}
                  aria-current={item.id === endpoint.id ? "true" : undefined}
                  onClick={() => selectEndpoint(item.id)}
                >
                  <span data-method={item.method}>{item.method}</span>
                  <code>{item.path.replace("/api/v1", "")}</code>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section
          className="api-docs-panel"
          id="api-docs-panel"
          role="tabpanel"
          aria-labelledby={`api-group-${group.id}`}
        >
          <div className="api-docs-heading">
            <div>
              <p className="api-docs-path" dir="ltr">
                <span data-method={endpoint.method}>{endpoint.method}</span>
                <code>{endpoint.path}</code>
              </p>
              <h2>{endpoint.title}</h2>
              <p>{endpoint.summary}</p>
            </div>
            <div className="api-docs-heading-actions">
              <span className="api-docs-auth-chip">{authLabels[endpoint.auth]}</span>
              {endpoint.explorerHref ? (
                <Link href={endpoint.explorerHref} className="console-secondary-button">
                  {text.tryExplorer}
                </Link>
              ) : null}
            </div>
          </div>

          <div className="api-docs-example">
            <div className="api-docs-example-bar">
              <div className="explorer-view-tabs" role="tablist" aria-label={text.exampleAria}>
                {apiDocExampleTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={exampleTab === tab}
                    id={`api-example-${tab}`}
                    aria-controls="api-example-panel"
                    onClick={() => setExampleTab(tab)}
                  >
                    {tab === "curl" ? text.curl : tab === "fetch" ? text.fetch : text.response}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="console-secondary-button"
                onClick={() => void copyExample(example)}
              >
                {text.copy}
              </button>
            </div>
            <pre
              id="api-example-panel"
              role="tabpanel"
              aria-labelledby={`api-example-${exampleTab}`}
              className="console-code-block api-docs-code"
              dir="ltr"
            >
              <code>{example}</code>
            </pre>
          </div>

          {parameters.length ? (
            <div className="api-docs-params">
              <h3>{parameterKind}</h3>
              <ul>
                {parameters.map((param) => (
                  <li key={param.name}>
                    <div>
                      <code>{param.name}</code>
                      {param.required ? <strong>{text.required}</strong> : <span>{text.optional}</span>}
                    </div>
                    <small>{param.type}</small>
                    <p>{param.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="api-docs-empty-params">{text.noParams}</p>
          )}

          {endpoint.errors.length ? (
            <div className="api-docs-errors">
              <h3>{text.errors}</h3>
              <ul>
                {endpoint.errors.map((error) => (
                  <li key={`${error.status}-${error.code}`}>
                    <code>{error.status}</code>
                    <strong>{error.code}</strong>
                    <p>{error.meaning}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
