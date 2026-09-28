"use client";

import { useState } from "react";
import { BANK_ACCOUNTS } from "@/lib/bank";
import { WhatsAppLinkButton } from "./WhatsAppButton";

export function BankDetails({ total }: { total: string }) {
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
          Transfiere <span className="font-bold">{total}</span>. Escríbenos por WhatsApp y te enviamos los datos de la
          cuenta.
        </p>
        <WhatsAppLinkButton
          message={`Hola, quiero hacer un pedido en Impreza por ${total}. ¿Me pasan los datos de la cuenta para transferir?`}
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
        Transfiere <span className="font-bold">{total}</span> a {BANK_ACCOUNTS.length === 1 ? "esta cuenta" : "una de estas cuentas"}:
      </p>
      {BANK_ACCOUNTS.map((a) => (
        <div key={a.numero} className="rounded-brand border border-black/10 bg-paper-soft p-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
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
            <dt className="text-ink-muted">Moneda</dt>
            <dd className="font-medium text-ink">{a.moneda}</dd>
          </dl>
        </div>
      ))}
    </div>
  );
}

function CopyValue({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (v: string) => void }) {
  return (
    <dd className="flex min-w-0 flex-wrap items-center gap-2 font-mono font-semibold text-ink">
      <span className="break-all">{value}</span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="rounded border border-black/15 px-2 py-0.5 font-sans text-xs font-semibold hover:border-ink"
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </dd>
  );
}
