"use client";

import { useState } from "react";
import { AdminAccountsPanel } from "@/components/console/AdminAccountsPanel";
import { AdminCustomersPanel } from "@/components/console/AdminCustomersPanel";

export function AdminOperations() {
  const [email, setEmail] = useState("");
  return (
    <>
      <AdminCustomersPanel onSelectEmail={setEmail} />
      <AdminAccountsPanel email={email} onEmailChange={setEmail} />
    </>
  );
}
