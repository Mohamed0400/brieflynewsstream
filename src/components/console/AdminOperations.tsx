"use client";

import { useState } from "react";
import { AdminAccountsPanel } from "@/components/console/AdminAccountsPanel";
import {
  AdminCustomersPanel,
  type AdminCustomerSnapshot,
} from "@/components/console/AdminCustomersPanel";
import { AdminQuotaResetAllPanel, AdminQuotaResetButton } from "@/components/console/OpsQuotaReset";

export function AdminOperations() {
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState<AdminCustomerSnapshot | null>(null);
  const [invoiceId, setInvoiceId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  function bumpRefresh() {
    setRefreshKey((key) => key + 1);
  }

  return (
    <>
      <AdminCustomersPanel
        refreshKey={refreshKey}
        onRequestRefresh={bumpRefresh}
        onSelectCustomer={(customer) => {
          setEmail(customer.email);
          setAccount(customer);
        }}
        onSelectInvoice={setInvoiceId}
      />
      <AdminAccountsPanel
        email={email}
        account={account}
        invoiceId={invoiceId}
        onEmailChange={setEmail}
        onInvoiceIdChange={setInvoiceId}
        onSaved={bumpRefresh}
        quotaResetSlot={account ? (
          <AdminQuotaResetButton
            accountId={account.id}
            email={account.email}
            onDone={bumpRefresh}
          />
        ) : null}
      />
      <AdminQuotaResetAllPanel />
    </>
  );
}
