import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mpGet } from "@/lib/mercadopago";

const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

function assinaturaValida(req: NextRequest, dataId: string) {
  const xSignature = req.headers.get("x-signature") || "";
  const xRequestId = req.headers.get("x-request-id") || "";

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", MP_WEBHOOK_SECRET).update(manifest).digest("hex");

  return hmac === hash;
}

function mapStatus(mpStatus: string) {
  switch (mpStatus) {
    case "authorized":
      return "ATIVA";
    case "paused":
      return "PAUSADA";
    case "cancelled":
      return "CANCELADA";
    case "pending":
      return "TRIAL";
    default:
      return "TRIAL";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataId: string | undefined = body?.data?.id;
    const tipo: string | undefined = body?.type;

    if (!dataId || tipo !== "subscription_preapproval") {
      return NextResponse.json({ received: true });
    }

    if (!assinaturaValida(req, dataId)) {
      return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
    }

    const preapproval = await mpGet(`/preapproval/${dataId}`);

    if (!preapproval.id) {
      return NextResponse.json({ error: "Assinatura não encontrada no Mercado Pago." }, { status: 404 });
    }

    const { error: dbError } = await supabaseAdmin
      .from("ASSINATURAS")
      .update({
        tp_status: mapStatus(preapproval.status),
        dt_vencimento: preapproval.next_payment_date ?? undefined,
      })
      .eq("cd_mp_preapproval_id", preapproval.id);

    if (dbError) {
      console.error("Erro ao atualizar assinatura via webhook:", dbError);
      return NextResponse.json({ error: "Erro ao atualizar assinatura." }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Erro no webhook Mercado Pago:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
