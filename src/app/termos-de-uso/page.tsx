import Link from "next/link";

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-7 text-white flex items-center justify-center bg-[#064384] rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[18px]">diversity_3</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-[#064384]">RESPONSA</span>
            </Link>
            <Link href="/login" className="text-sm font-bold text-[#064384] hover:underline">Acessar plataforma</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-8 sm:p-12">
          <div className="mb-8">
            <span className="text-xs font-bold text-[#FF8323] uppercase tracking-widest">Documentos Legais</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#064384] mt-2 mb-3">Termos de Uso</h1>
            <p className="text-slate-500 font-medium text-sm">Última atualização: 1º de janeiro de 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">1. Aceitação dos Termos</h2>
              <p className="leading-relaxed">
                Ao acessar e utilizar a plataforma RESPONSA, você concorda em cumprir e estar sujeito aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">2. Descrição do Serviço</h2>
              <p className="leading-relaxed">
                A RESPONSA é uma plataforma SaaS (Software como Serviço) destinada a consultores e profissionais de gestão de pessoas. Oferecemos ferramentas para diagnóstico comportamental, análise de perfis DISC, avaliação de clima organizacional, gestão de projetos de consultoria e geração de relatórios profissionais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">3. Cadastro e Conta de Usuário</h2>
              <p className="leading-relaxed">Para utilizar a plataforma, é necessário:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Ser maior de 18 anos;</li>
                <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                <li>Manter a confidencialidade de suas credenciais de acesso;</li>
                <li>Notificar imediatamente qualquer uso não autorizado da sua conta.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">4. Uso Aceitável</h2>
              <p className="leading-relaxed">Você concorda em utilizar a plataforma somente para fins lícitos e de acordo com estes termos. É expressamente proibido:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Usar a plataforma para fins ilegais ou não autorizados;</li>
                <li>Transmitir vírus ou código malicioso;</li>
                <li>Coletar dados de outros usuários sem consentimento;</li>
                <li>Tentar acessar sistemas ou redes não autorizadas;</li>
                <li>Reproduzir, duplicar ou vender qualquer parte do serviço sem permissão expressa.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">5. Propriedade Intelectual</h2>
              <p className="leading-relaxed">
                Todo o conteúdo da plataforma RESPONSA, incluindo mas não limitado a textos, gráficos, logotipos, ícones, imagens, software e metodologias, é propriedade exclusiva da RESPONSA e está protegido por leis de direitos autorais e propriedade intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">6. Dados dos Clientes</h2>
              <p className="leading-relaxed">
                Os dados inseridos na plataforma pelos consultores (dados das empresas atendidas, resultados de avaliações, relatórios) permanecem de propriedade do consultor. A RESPONSA não utilizará esses dados para fins comerciais ou de marketing sem consentimento expresso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">7. Planos e Pagamentos</h2>
              <p className="leading-relaxed">
                A RESPONSA oferece planos de assinatura mensal ou anual. Os valores e condições de cada plano são disponibilizados na página de preços. O não pagamento de faturas vencidas pode resultar na suspensão temporária ou cancelamento definitivo da conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">8. Limitação de Responsabilidade</h2>
              <p className="leading-relaxed">
                A RESPONSA não garante que a plataforma estará disponível ininterruptamente e não se responsabiliza por danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou impossibilidade de uso do serviço. As ferramentas de diagnóstico são de suporte à tomada de decisão e não substituem o julgamento profissional do consultor.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">9. Rescisão</h2>
              <p className="leading-relaxed">
                A RESPONSA reserva-se o direito de encerrar ou suspender o acesso de qualquer usuário que violar estes Termos de Uso, sem aviso prévio. O usuário pode cancelar sua assinatura a qualquer momento através das configurações da conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">10. Alterações nos Termos</h2>
              <p className="leading-relaxed">
                A RESPONSA pode modificar estes termos a qualquer momento. As alterações serão comunicadas por e-mail e/ou notificação na plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">11. Lei Aplicável</h2>
              <p className="leading-relaxed">
                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa será submetida ao foro da comarca de domicílio do usuário.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">12. Contato</h2>
              <p className="leading-relaxed">
                Em caso de dúvidas sobre estes Termos de Uso, entre em contato através da plataforma ou pelo e-mail de suporte disponível na sua área de usuário.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
        <Link href="/" className="hover:text-[#064384] transition-colors">← Voltar para a página inicial</Link>
        <span className="mx-3">·</span>
        <Link href="/privacidade" className="hover:text-[#064384] transition-colors">Política de Privacidade</Link>
      </footer>
    </div>
  );
}
