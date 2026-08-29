"use client";

import { useState } from "react";
import { AdminAccountsPanel } from "@/components/console/AdminAccountsPanel";
import {
  AdminCustomersPanel,
  type AdminCustomerSnapshot,
} from "@/components/console/AdminCustomersPanel";

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
        onEmailChange={(next) => {
          setEmail(next);
          if (account && next.trim().toLowerCase() !== account.email.toLowerCase()) {
            setAccount(null);
          }
        }}
        onInvoiceIdChange={setInvoiceId}
        onSaved={bumpRefresh}
      />
    </>
  );
}
