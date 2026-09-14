import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mpPost } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  try {
    const { cdConsultor, email, plano } = await req.json();

    if (!cdConsultor || !email || !plano) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const valor = plano === "ANUAL" ? 970.0 : 97.0;
    const frequencyType = plano === "ANUAL" ? "years" : "months";

    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() + 14); // 14 dias trial

    const preapproval = await mpPost("/preapproval", {
      reason: `RESPONSA — Plano ${plano === "ANUAL" ? "Anual" : "Mensal"}`,
      external_reference: String(cdConsultor),
      payer_email: email,
      back_url: "https://responsaedu.com.br/assinatura",
      auto_recurring: {
        frequency: 1,
        frequency_type: frequencyType,
        transaction_amount: valor,
        currency_id: "BRL",
        start_date: dataInicio.toISOString(),
      },
      status: "pending",
    });

    if (!preapproval.id) {
      return NextResponse.json(
        { error: "Erro ao criar assinatura no Mercado Pago.", detalhe: preapproval },
        { status: 500 },
      );
    }

    const { error: dbError } = await supabaseAdmin
      .from("ASSINATURAS")
      .upsert(
        {
          cd_consultor: cdConsultor,
          cd_mp_preapproval_id: preapproval.id,
          ds_payer_email: email,
          tp_status: "TRIAL",
          ds_plano: plano,
          vl_plano: valor,
          dt_trial_fim: dataInicio.toISOString().split("T")[0],
          dt_vencimento: dataInicio.toISOString().split("T")[0],
        },
        { onConflict: "cd_consultor" },
      );

    if (dbError) {
      console.error("Erro ao salvar assinatura:", dbError);
      return NextResponse.json({ error: "Erro ao registrar assinatura." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cdMpPreapprovalId: preapproval.id,
      initPoint: preapproval.init_point,
      status: "TRIAL",
    });
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
