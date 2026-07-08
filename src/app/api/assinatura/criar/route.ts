import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";
const ASAAS_BASE = process.env.ASAAS_ENV === "production"
  ? "https://api.asaas.com/api/v3"
  : "https://sandbox.asaas.com/api/v3";

async function asaasPost(path: string, body: object) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { cdConsultor, nome, email, cpfCnpj, plano } = await req.json();

    if (!cdConsultor || !nome || !email || !cpfCnpj || !plano) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const valor = plano === "ANUAL" ? 970.0 : 97.0;
    const ciclo = plano === "ANUAL" ? "YEARLY" : "MONTHLY";

    // 1. Criar cliente no Asaas
    const cliente = await asaasPost("/customers", {
      name: nome,
      email,
      cpfCnpj,
      notificationDisabled: false,
    });

    if (!cliente.id) {
      return NextResponse.json({ error: "Erro ao criar cliente no Asaas.", detalhe: cliente }, { status: 500 });
    }

    // 2. Criar assinatura no Asaas
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 14); // 14 dias trial
    const dtStr = dataVencimento.toISOString().split("T")[0];

    const assinatura = await asaasPost("/subscriptions", {
      customer: cliente.id,
      billingType: "BOLETO",
      value: valor,
      nextDueDate: dtStr,
      cycle: ciclo,
      description: `RESPONSA — Plano ${plano === "ANUAL" ? "Anual" : "Mensal"}`,
    });

    if (!assinatura.id) {
      return NextResponse.json({ error: "Erro ao criar assinatura no Asaas.", detalhe: assinatura }, { status: 500 });
    }

    // 3. Salvar no banco
    const { error: dbError } = await supabaseAdmin
      .from("ASSINATURAS")
      .upsert(
        {
          cd_consultor: cdConsultor,
          cd_asaas_customer: cliente.id,
          cd_asaas_subscription: assinatura.id,
          tp_status: "TRIAL",
          ds_plano: plano,
          vl_plano: valor,
          dt_trial_fim: dtStr,
          dt_vencimento: dtStr,
        },
        { onConflict: "cd_consultor" }
      );

    if (dbError) {
      console.error("Erro ao salvar assinatura:", dbError);
      return NextResponse.json({ error: "Erro ao registrar assinatura." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cdAsaasSubscription: assinatura.id,
      status: "TRIAL",
      dtVencimento: dtStr,
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
