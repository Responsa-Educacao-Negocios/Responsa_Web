import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📦 1. Dados recebidos no Backend:", body);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "❌ ERRO FATAL: Chaves do Supabase não encontradas no .env.local!",
      );
      return NextResponse.json(
        { error: "Erro de configuração no servidor (Chaves ausentes)." },
        { status: 500 },
      );
    }

    // Inicializa o admin bypassando o RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { email, password, nome, cd_empresa } = body;

    console.log("🔐 2. Criando usuário no Supabase Auth...");
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (authError) {
      console.error("❌ Erro no Auth:", authError.message);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    console.log("✅ Usuário criado com sucesso no Auth! ID:", userId);

    console.log("🗄️ 3. Inserindo vínculo na tabela USUARIOS_CLIENTE...");
    const { error: dbError } = await supabaseAdmin
      .from("USUARIOS_CLIENTE")
      .insert([
        {
          cd_auth_supabase: userId,
          cd_empresa: cd_empresa,
          nm_usuario: nome,
          ds_email: email,
        },
      ]);

    if (dbError) {
      console.error("❌ Erro no Banco de Dados:", dbError.message);
      // Apaga o usuário do Auth para não deixar dados "órfãos"
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    console.log("🚀 TUDO CERTO! Acesso gerado.");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Erro interno da API:", error);
    return NextResponse.json(
      { error: error.message || "Erro desconhecido" },
      { status: 500 },
    );
  }
}
