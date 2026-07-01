import Link from "next/link";

export default function PrivacidadePage() {
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
            <h1 className="text-3xl sm:text-4xl font-black text-[#064384] mt-2 mb-3">Política de Privacidade</h1>
            <p className="text-slate-500 font-medium text-sm">Última atualização: 1º de janeiro de 2026</p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">1. Introdução</h2>
              <p className="leading-relaxed">
                A RESPONSA está comprometida com a proteção da privacidade e dos dados pessoais dos seus usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">2. Dados que Coletamos</h2>
              <p className="leading-relaxed">Coletamos os seguintes tipos de dados:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Dados de cadastro:</strong> nome completo, e-mail, cargo, empresa e telefone;</li>
                <li><strong>Dados de uso:</strong> páginas acessadas, ferramentas utilizadas, tempo de sessão;</li>
                <li><strong>Dados inseridos pelo consultor:</strong> informações sobre empresas clientes, resultados de avaliações e relatórios gerados;</li>
                <li><strong>Dados de pagamento:</strong> processados de forma segura por gateway de pagamento certificado PCI-DSS (não armazenamos dados de cartão).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">3. Como Utilizamos os Dados</h2>
              <p className="leading-relaxed">Utilizamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Prestar e aprimorar os serviços da plataforma;</li>
                <li>Processar pagamentos e gerenciar assinaturas;</li>
                <li>Enviar comunicações sobre atualizações e novidades (com possibilidade de opt-out);</li>
                <li>Garantir a segurança da plataforma e prevenir fraudes;</li>
                <li>Cumprir obrigações legais e regulatórias.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">4. Compartilhamento de Dados</h2>
              <p className="leading-relaxed">
                Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Podemos compartilhar dados apenas com:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e banco de dados (Supabase/AWS) com contratos de confidencialidade;</li>
                <li><strong>Gateway de pagamento:</strong> para processamento seguro de transações financeiras;</li>
                <li><strong>Autoridades competentes:</strong> quando exigido por lei ou ordem judicial.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">5. Segurança dos Dados</h2>
              <p className="leading-relaxed">
                Implementamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia em trânsito (TLS/HTTPS), autenticação segura, controle de acesso baseado em funções e backups regulares. Apesar de nossos esforços, nenhum sistema é 100% seguro.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">6. Retenção de Dados</h2>
              <p className="leading-relaxed">
                Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento da assinatura, os dados são retidos por 90 dias para fins de recuperação e, após este período, excluídos permanentemente, exceto onde a retenção seja exigida por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">7. Seus Direitos (LGPD)</h2>
              <p className="leading-relaxed">Conforme a LGPD, você tem direito a:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Confirmar a existência de tratamento dos seus dados;</li>
                <li>Acessar seus dados pessoais;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Portabilidade dos seus dados;</li>
                <li>Revogar o consentimento a qualquer momento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">8. Cookies</h2>
              <p className="leading-relaxed">
                Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento de terceiros para publicidade. Você pode configurar seu navegador para bloquear cookies, mas isso pode afetar o funcionamento da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">9. Dados de Menores</h2>
              <p className="leading-relaxed">
                A plataforma RESPONSA não é destinada a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se identificarmos dados de menores sem consentimento parental, excluiremos imediatamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">10. Alterações nesta Política</h2>
              <p className="leading-relaxed">
                Esta política pode ser atualizada periodicamente. Notificaremos sobre mudanças significativas por e-mail ou notificação na plataforma. Recomendamos revisar esta página regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-3">11. Contato e DPO</h2>
              <p className="leading-relaxed">
                Para exercer seus direitos, dúvidas ou solicitações relacionadas à privacidade, entre em contato através da plataforma. Respondemos solicitações em até 15 dias úteis.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
        <Link href="/" className="hover:text-[#064384] transition-colors">← Voltar para a página inicial</Link>
        <span className="mx-3">·</span>
        <Link href="/termos-de-uso" className="hover:text-[#064384] transition-colors">Termos de Uso</Link>
      </footer>
    </div>
  );
}
