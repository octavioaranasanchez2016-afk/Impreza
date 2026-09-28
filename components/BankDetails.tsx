"use client";

import { useState } from "react";
import { ACCOUNT_CURRENCY_LABEL, BANK_ACCOUNTS } from "@/lib/bank";
import { formatBoth, formatCordobas, formatInDollars } from "@/lib/currency";
import { WhatsAppLinkButton } from "./WhatsAppButton";

export function BankDetails({ totalCordobas }: { totalCordobas: number }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Sin permiso de portapapeles: el número sigue visible para copiarlo a mano.
    }
  }

  if (BANK_ACCOUNTS.length === 0) {
    return (
      <div className="rounded-brand border border-black/10 bg-paper-soft p-4 text-sm">
        <p className="text-ink">
          Transfiere <span className="font-bold">{formatBoth(totalCordobas)}</span>. Escríbenos por WhatsApp y te
          enviamos los datos de la cuenta.
        </p>
        <WhatsAppLinkButton
          message={`Hola, quiero hacer un pedido en Impreza por ${formatBoth(totalCordobas)}. ¿Me pasan los datos de la cuenta para transferir?`}
          className="mt-3 inline-block rounded-brand bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Pedir datos de la cuenta
        </WhatsAppLinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">
        {BANK_ACCOUNTS.length === 1
          ? "Transfiere a esta cuenta:"
          : "Transfiere a la cuenta que prefieras, en la moneda de esa cuenta:"}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {BANK_ACCOUNTS.map((a) => (
          <div key={a.numero} className="rounded-brand border border-black/10 bg-paper-soft p-4 text-sm">
            <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-black/10 pb-2">
              <span className="font-semibold text-ink">Cuenta en {ACCOUNT_CURRENCY_LABEL[a.currency].toLowerCase()}</span>
              <span className="text-lg font-bold text-ink">
                {a.currency === "USD" ? formatInDollars(totalCordobas) : formatCordobas(totalCordobas)}
              </span>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-ink-muted">Banco</dt>
              <dd className="font-medium text-ink">{a.banco}</dd>
              {a.titular && (
                <>
                  <dt className="text-ink-muted">Titular</dt>
                  <dd className="font-medium text-ink">{a.titular}</dd>
                </>
              )}
              <dt className="text-ink-muted">Cuenta</dt>
              <CopyValue value={a.numero} copied={copied === a.numero} onCopy={copy} />
              {a.iban && (
                <>
                  <dt className="text-ink-muted">IBAN</dt>
                  <CopyValue value={a.iban} copied={copied === a.iban} onCopy={copy} />
                </>
              )}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyValue({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (v: string) => void }) {
  return (
    <dd className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs font-semibold text-ink sm:text-sm">
      <span className="break-all">{value}</span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="rounded border border-black/15 bg-white px-2 py-0.5 font-sans text-xs font-semibold hover:border-ink"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </dd>
  );
}
