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

  return (
    <>
      <AdminCustomersPanel
        refreshKey={refreshKey}
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
        onSaved={() => setRefreshKey((key) => key + 1)}
      />
    </>
  );
}
