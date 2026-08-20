"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/components/console/ConfirmModal";
import { useConsoleCopy } from "@/components/console/ConsoleLang";
import { toast } from "@/lib/toast";

export type ConsoleApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastFour: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

type CopyOption = "key" | "header" | "curl" | "id";
type PendingAction = {
  type: "revoke" | "rotate";
  id: string;
  name: string;
} | null;

function maskedKey(key: Pick<ConsoleApiKey, "prefix" | "lastFour">) {
  return `${key.prefix}••••••••${key.lastFour}`;
}

async function copyText(value: string, success: string) {
  await navigator.clipboard.writeText(value);
  toast.success(success);
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3.3 2.3a1 1 0 0 1 1.4 0l17 17a1 1 0 1 1-1.4 1.4l-3.2-3.2A11.5 11.5 0 0 1 12 20C6 20 2.2 14.7 1.1 12.8a2 2 0 0 1 0-1.6A13.8 13.8 0 0 1 5.8 6.6L3.3 4.1a1 1 0 0 1 0-1.8ZM8.1 8.9A4.5 4.5 0 0 0 12 16.5c.5 0 1-.1 1.4-.2l-1.7-1.7a2.5 2.5 0 0 1-3.3-3.3L8.1 8.9Zm8.7 4.1-1.6-1.6a2.5 2.5 0 0 0-3.1-3.1L10.5 6.7A4.5 4.5 0 0 1 16.8 13ZM12 4c6 0 9.8 5.3 10.9 7.2a2 2 0 0 1 0 1.6c-.3.5-.8 1.3-1.5 2.2l-1.5-1.5c.9-1 1.5-1.9 1.8-2.5C20.4 8.8 17 6 12 6c-.7 0-1.4.1-2 .3L8.5 4.8C9.6 4.3 10.8 4 12 4Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5c5.4 0 9.3 4.6 10.6 6.7a1.5 1.5 0 0 1 0 1.6C21.3 15.4 17.4 20 12 20S2.7 15.4 1.4 13.3a1.5 1.5 0 0 1 0-1.6C2.7 9.6 6.6 5 12 5Zm0 2C7.8 7 4.7 10.3 3.4 12 4.7 13.7 7.8 17 12 17s7.3-3.3 8.6-5C19.3 10.3 16.2 7 12 7Zm0 2.5A2.5 2.5 0 1 1 12 14a2.5 2.5 0 0 1 0-4.5Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V7Zm3-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-8ZM4 6a1 1 0 0 1 1 1v11a3 3 0 0 0 3 3h8a1 1 0 1 1 0 2H8a5 5 0 0 1-5-5V7a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function CopyMenu({
  onSelect,
  copy,
}: {
  onSelect: (option: CopyOption) => void;
  copy: ReturnType<typeof useConsoleCopy>["copy"]["keys"];
}) {
  return (
    <div className="console-copy-menu" role="menu" aria-label={copy.copyOptions}>
      <button type="button" role="menuitem" onClick={() => onSelect("key")}>{copy.copyKey}</button>
      <button type="button" role="menuitem" onClick={() => onSelect("header")}>{copy.copyHeader}</button>
      <button type="button" role="menuitem" onClick={() => onSelect("curl")}>{copy.copyCurl}</button>
      <button type="button" role="menuitem" onClick={() => onSelect("id")}>{copy.copyId}</button>
    </div>
  );
}

export function ApiKeysPanel({ initialKeys }: { initialKeys: ConsoleApiKey[] }) {
  const { copy } = useConsoleCopy();
  const text = copy.keys;
  const [keys, setKeys] = useState(initialKeys);
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [copyMenu, setCopyMenu] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setCopyMenu(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setCopyMenu(null);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const issued = issuedId ? keys.find((key) => key.id === issuedId) : null;
  const issuedSecret = issuedId ? secrets[issuedId] : undefined;

  function storeSecret(id: string, value: string) {
    setIssuedId(id);
    setSecrets((current) => ({ ...current, [id]: value }));
    setVisible((current) => ({ ...current, [id]: true }));
  }

  function displayValue(key: ConsoleApiKey) {
    const secret = secrets[key.id];
    if (secret && visible[key.id]) return secret;
    return maskedKey(key);
  }

  function toggleVisibility(key: ConsoleApiKey) {
    if (!secrets[key.id]) {
      toast.warning(text.keyHidden, text.keyHiddenTitle);
      return;
    }
    setVisible((current) => ({ ...current, [key.id]: !current[key.id] }));
  }

  async function copyOption(key: ConsoleApiKey, option: CopyOption) {
    try {
      if (option === "id") {
        await copyText(key.id, text.copyIdDone);
        setCopyMenu(null);
        return;
      }
      const secret = secrets[key.id];
      if (!secret) {
        toast.warning(text.copyUnavailableHint, text.copyUnavailable);
        setCopyMenu(null);
        return;
      }
      if (option === "header") {
        await copyText(`X-API-Key: ${secret}`, text.headerCopied);
      } else if (option === "curl") {
        await copyText(
          `curl -H "X-API-Key: ${secret}" "${window.location.origin}/api/v1/market-news?lang=ar"`,
          text.curlCopied,
        );
      } else {
        await copyText(secret, text.keyCopied);
      }
      setCopyMenu(null);
    } catch (requestError) {
      toast.exception(requestError, text.copyFailed);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setCreating(true);
    try {
      const response = await fetch("/api/console/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: form.get("name") }),
      });
      const payload = await response.json().catch(() => ({})) as {
        key?: string;
        item?: ConsoleApiKey;
        message?: string;
      };
      if (!response.ok || !payload.key || !payload.item) {
        toast.error(payload.message || text.createFailed);
        return;
      }
      setKeys((current) => [payload.item!, ...current]);
      storeSecret(payload.item.id, payload.key);
      toast.success(text.createdToast);
      formElement.reset();
    } catch (requestError) {
      toast.exception(requestError, text.createFailed);
    } finally {
      setCreating(false);
    }
  }

  async function confirmPending() {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.type === "revoke") {
        const response = await fetch(`/api/console/keys/${pending.id}`, { method: "DELETE" });
        if (!response.ok) {
          toast.error(text.revokeFailed);
          return;
        }
        setKeys((current) => current.map((key) => (
          key.id === pending.id ? { ...key, revokedAt: new Date().toISOString() } : key
        )));
        setSecrets((current) => {
          const next = { ...current };
          delete next[pending.id];
          return next;
        });
        if (issuedId === pending.id) setIssuedId(null);
        toast.warning(text.revokedToast(pending.name));
        return;
      }

      const response = await fetch(`/api/console/keys/${pending.id}/rotate`, { method: "POST" });
      const payload = await response.json().catch(() => ({})) as {
        key?: string;
        item?: ConsoleApiKey;
        message?: string;
      };
      if (!response.ok || !payload.key || !payload.item) {
        toast.error(payload.message || text.rotateFailed);
        return;
      }
      setKeys((current) => current.map((key) => (key.id === pending.id ? payload.item! : key)));
      storeSecret(payload.item.id, payload.key);
      toast.success(text.rotatedToast(pending.name));
    } catch (requestError) {
      toast.exception(
        requestError,
        pending.type === "revoke" ? text.revokeFailed : text.rotateFailed,
      );
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6">
      <section className="console-panel" aria-labelledby="create-key-heading">
        <div className="console-panel-heading">
          <div>
            <h2 id="create-key-heading">{text.createHeading}</h2>
            <p>{text.createHint}</p>
          </div>
        </div>
        <form onSubmit={create} className="console-create-key-form">
          <div className="grid gap-2">
            <label htmlFor="key-name" className="console-label">{text.nameLabel}</label>
            <input
              id="key-name"
              name="name"
              type="text"
              maxLength={80}
              required
              autoComplete="off"
              dir="auto"
              className="console-input"
              placeholder={text.namePlaceholder}
            />
          </div>
          <button type="submit" disabled={creating} className="console-primary-button">
            {creating ? text.creating : text.create}
          </button>
        </form>
      </section>

      {issued && issuedSecret && (
        <section className="console-key-reveal" aria-labelledby="new-key-heading">
          <div>
            <h2 id="new-key-heading">{text.copyNew}</h2>
            <p>{text.copyNewHint}</p>
          </div>
          <div className="console-key-reveal-controls" ref={copyMenu === `issued:${issued.id}` ? menuRef : undefined}>
            <input
              readOnly
              type="text"
              dir="ltr"
              value={visible[issued.id] ? issuedSecret : maskedKey(issued)}
              aria-label={text.newKeyAria}
              className="console-key-value"
            />
            <button
              type="button"
              className="console-icon-button"
              aria-label={visible[issued.id] ? text.hideKey : text.showKey}
              onClick={() => toggleVisibility(issued)}
            >
              <EyeIcon open={Boolean(visible[issued.id])} />
            </button>
            <div className="console-copy-wrap">
              <button
                type="button"
                className="console-icon-button"
                aria-label={text.copyOptions}
                aria-expanded={copyMenu === `issued:${issued.id}`}
                onClick={() => setCopyMenu((current) => current === `issued:${issued.id}` ? null : `issued:${issued.id}`)}
              >
                <CopyIcon />
              </button>
              {copyMenu === `issued:${issued.id}` && (
                <CopyMenu copy={text} onSelect={(option) => void copyOption(issued, option)} />
              )}
            </div>
          </div>
        </section>
      )}

      <section className="console-panel" aria-labelledby="existing-keys-heading">
        <div className="console-panel-heading">
          <div>
            <h2 id="existing-keys-heading">{text.workspaceKeys}</h2>
            <p>{text.workspaceHint}</p>
          </div>
          <strong>{text.activeCount(keys.filter((key) => !key.revokedAt).length)}</strong>
        </div>
        {keys.length ? (
          <div className="console-key-list">
            {keys.map((key) => (
              <article key={key.id} className="console-key-row" data-revoked={key.revokedAt ? "true" : "false"}>
                <div className="console-key-identity">
                  <strong>{key.name}</strong>
                  <code>{displayValue(key)}</code>
                </div>
                <dl className="console-key-meta">
                  <div>
                    <dt>{text.created}</dt>
                    <dd>{new Date(key.createdAt).toLocaleDateString(copy.locale)}</dd>
                  </div>
                  <div>
                    <dt>{text.lastUsed}</dt>
                    <dd>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString(copy.locale) : text.never}</dd>
                  </div>
                  <div>
                    <dt>{text.status}</dt>
                    <dd>{key.revokedAt ? text.revoked : text.active}</dd>
                  </div>
                </dl>
                <div className="console-key-actions" ref={copyMenu === `row:${key.id}` ? menuRef : undefined}>
                  <button
                    type="button"
                    className="console-icon-button"
                    aria-label={visible[key.id] ? text.hideKey : text.showKey}
                    disabled={Boolean(key.revokedAt)}
                    onClick={() => toggleVisibility(key)}
                  >
                    <EyeIcon open={Boolean(visible[key.id] && secrets[key.id])} />
                  </button>
                  <div className="console-copy-wrap">
                    <button
                      type="button"
                      className="console-icon-button"
                      aria-label={`${text.copyOptions} ${key.name}`}
                      aria-expanded={copyMenu === `row:${key.id}`}
                      onClick={() => setCopyMenu((current) => current === `row:${key.id}` ? null : `row:${key.id}`)}
                    >
                      <CopyIcon />
                    </button>
                    {copyMenu === `row:${key.id}` && (
                      <CopyMenu copy={text} onSelect={(option) => void copyOption(key, option)} />
                    )}
                  </div>
                  <button
                    type="button"
                    className="console-secondary-button"
                    disabled={Boolean(key.revokedAt)}
                    onClick={() => setPending({ type: "rotate", id: key.id, name: key.name })}
                  >
                    {text.rotate}
                  </button>
                  <button
                    type="button"
                    className="console-danger-button"
                    disabled={Boolean(key.revokedAt)}
                    onClick={() => setPending({ type: "revoke", id: key.id, name: key.name })}
                  >
                    {key.revokedAt ? text.revoked : text.revoke}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="console-empty-state">
            <strong>{text.empty}</strong>
            <p>{text.emptyHint}</p>
          </div>
        )}
      </section>

      <ConfirmModal
        open={Boolean(pending)}
        lang={copy.lang}
        dir={copy.dir}
        title={pending ? (pending.type === "revoke" ? text.revokeTitle(pending.name) : text.rotateTitle(pending.name)) : ""}
        description={
          pending?.type === "revoke" ? text.revokeBody : text.rotateBody
        }
        confirmLabel={pending?.type === "revoke" ? text.revokeConfirm : text.rotateConfirm}
        cancelLabel={text.cancel}
        closeLabel={text.closeDialog}
        busyLabel={text.working}
        tone={pending?.type === "rotate" ? "primary" : "danger"}
        busy={busy}
        onCancel={() => {
          if (!busy) setPending(null);
        }}
        onConfirm={() => void confirmPending()}
      />
    </div>
  );
}
