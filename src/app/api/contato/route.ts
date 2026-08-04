import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const DESTINATARIO = "wallisonbranquinho@hotmail.com";

export async function POST(request: NextRequest) {
  try {
    const { nome, email, empresa, cargo, telefone, mensagem } =
      await request.json();

    if (!nome || !email || !telefone) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes." },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada.");
      return NextResponse.json(
        { error: "Serviço de e-mail não configurado." },
        { status: 500 },
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: "Responsa <contato@responsaedu.com.br>",
      to: DESTINATARIO,
      replyTo: email,
      subject: `Nova solicitação de acesso — ${nome}`,
      html: `
        <h2>Nova solicitação de acesso à plataforma</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Empresa/Consultoria:</strong> ${empresa || "-"}</p>
        <p><strong>Cargo:</strong> ${cargo || "-"}</p>
        <p><strong>WhatsApp/Telefone:</strong> ${telefone}</p>
        <p><strong>Como pretende usar a plataforma:</strong><br/>${mensagem || "-"}</p>
      `,
    });

    if (error) {
      console.error("Erro ao enviar e-mail via Resend:", error);
      return NextResponse.json(
        { error: "Falha ao enviar e-mail." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar solicitação de contato:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
