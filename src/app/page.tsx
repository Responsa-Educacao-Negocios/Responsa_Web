import Link from "next/link";

export default function Home() {
  return (
    <div className="hero-bg min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* HEADER */}
      <header className="w-full border-b border-[#e7ebf3] bg-surface-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="size-7 sm:size-8 text-white flex items-center justify-center bg-primary rounded-lg shrink-0">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">diversity_3</span>
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-primary">RESPONSA</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#sobre-nos" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Sobre Nós</a>
              <a href="#recursos" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">Recursos</a>
            </nav>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                href="/login"
                className="flex items-center justify-center px-4 sm:px-5 py-2 rounded-lg bg-secondary text-white text-sm font-bold hover:bg-orange-600 transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex flex-col">
        {/* HERO SECTION */}
        <section className="relative pt-10 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1280px] mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="flex flex-col gap-5 sm:gap-6 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 w-fit mx-auto lg:mx-0">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">Nova Versão 2.0</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-primary leading-[1.15] sm:leading-[1.1]">
                  Bem-vindo ao <br className="hidden sm:block" />
                  <span className="text-primary"> RESPONSA</span>
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 px-2 sm:px-0">
                  A sua central estratégica para diagnóstico e gestão de talentos. Transforme dados em decisões que impulsionam o capital humano.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4 justify-center lg:justify-start w-full sm:w-auto">
                  <Link
                    href="/login"
                    className="flex items-center justify-center w-full sm:w-auto h-14 sm:h-12 px-8 rounded-xl bg-secondary text-white text-base font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 active:scale-95"
                  >
                    Começar Agora
                    <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
                  </Link>
                  <a
                    href="#recursos"
                    className="flex items-center justify-center w-full sm:w-auto h-14 sm:h-12 px-8 rounded-xl bg-white border border-slate-200 text-primary text-base font-bold hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Explorar Recursos
                  </a>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-6 text-sm text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                    <span>Teste Grátis 14 dias</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-green-500">check_circle</span>
                    <span>Sem cartão de crédito</span>
                  </div>
                </div>
              </div>

              {/* HERO IMAGE */}
              <div className="relative w-full max-w-lg mx-auto lg:max-w-none flex items-center justify-center mt-8 lg:mt-0">
                <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-10 w-48 h-48 sm:w-72 sm:h-72 bg-orange-400/10 rounded-full blur-3xl"></div>
                <div className="relative w-full aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-white">
                  <img
                    alt="Equipe colaborando em ambiente moderno de trabalho"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4kfZoXHfdq0lL3ABaboBhewKDyYSXZJHBF7beiQBT5t5uCZlrgECnofKFotgo6g-ptkfJgZQJ3K1LQ2NopNTrFMZDRM2I_66IKvZQcolHaoqrQru8QQ42JCbjl1ZpiOL7u3vhSTC8izRS1YvxfPcJmBHy9n6Tfwq2weTgVi8ng9UMtN4B3aZw0BH3zp2U8oQsqrDy5BYR86w5C11FlDAun8Bls9SdCQ-Hb3_-kLxDXLOx1Tv5DbD-5fZ_ZK61g0-pxkAi6KUxXK1X"
                  />
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-3 sm:p-4 bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-gray-100 shadow-lg flex items-center gap-3 sm:gap-4">
                    <div className="bg-orange-50 p-2 sm:p-3 rounded-full text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[18px] sm:text-[24px]">trending_up</span>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-primary leading-tight">Produtividade da Equipe</p>
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5">+24% este mês</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECURSOS SECTION */}
        <section id="recursos" className="py-16 sm:py-24 bg-white border-y border-slate-100 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1280px] mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Recursos</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary mb-4 tracking-tight">
                Por que os líderes de RH escolhem a RESPONSA?
              </h2>
              <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                Nossa plataforma integra as ferramentas essenciais para modernizar a sua gestão de pessoas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-100 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">analytics</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Diagnóstico Preciso</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Identifique gaps de competência com dados reais e relatórios detalhados que eliminam a adivinhação.
                </p>
              </div>

              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-900/5 transition-all duration-300">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-orange-100 text-secondary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">sentiment_satisfied</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Gestão de Clima</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Monitore o pulso da organização em tempo real e crie um ambiente de trabalho mais engajado e produtivo.
                </p>
              </div>

              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">psychology</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Análise DISC</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Entenda profundamente o perfil comportamental dos seus colaboradores para montar times de alta performance.
                </p>
              </div>

              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">groups</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Gestão de Pessoas</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Diagnostique e desenvolva as competências de liderança e gestão de pessoas com metodologias validadas.
                </p>
              </div>

              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-green-200 hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">description</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Relatórios Profissionais</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Gere relatórios em PDF prontos para apresentar aos clientes, com design profissional e dados precisos.
                </p>
              </div>

              <div className="group p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-900/5 transition-all duration-300">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px] sm:text-[28px]">health_and_safety</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-primary mb-3">Compliance NR-1</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Avaliação completa de riscos psicossociais conforme a NR-1, com plano de ação estruturado.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE NÓS SECTION */}
        <section id="sobre-nos" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-[1280px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block text-xs font-bold text-secondary uppercase tracking-widest mb-3">Sobre Nós</span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary mb-6 tracking-tight">
                  Transformamos dados em desenvolvimento humano
                </h2>
                <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed mb-6">
                  A RESPONSA nasceu da necessidade de consultores de RH de terem uma plataforma centralizada, eficiente e profissional para aplicar diagnósticos organizacionais.
                </p>
                <p className="text-slate-600 font-medium leading-relaxed mb-8">
                  Somos uma plataforma SaaS voltada para consultores e profissionais de gestão de pessoas que precisam de ferramentas robustas para diagnosticar competências, analisar perfis comportamentais e gerar relatórios executivos com qualidade.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-black text-primary mb-1">10+</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Ferramentas disponíveis</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-black text-secondary mb-1">100%</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Relatórios em PDF</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-black text-teal-600 mb-1">DISC</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Metodologia validada</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="text-3xl font-black text-purple-600 mb-1">NR-1</div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Compliance garantido</div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {[
                  { icon: "target", title: "Missão", text: "Capacitar consultores de RH com ferramentas digitais que transformam diagnósticos organizacionais em planos de ação concretos e mensuráveis." },
                  { icon: "visibility", title: "Visão", text: "Ser a plataforma de referência em diagnóstico de talentos para consultores independentes e consultorias de RH no Brasil." },
                  { icon: "favorite", title: "Valores", text: "Precisão técnica, facilidade de uso, confidencialidade dos dados e resultados que geram impacto real nas organizações." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-primary">
          <div className="max-w-[1280px] mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
              Pronto para transformar sua consultoria?
            </h2>
            <p className="text-blue-100 text-lg font-medium mb-8 max-w-2xl mx-auto">
              Comece gratuitamente por 14 dias e experimente todas as ferramentas sem precisar de cartão de crédito.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/solicitar-acesso"
                className="flex items-center justify-center h-14 px-8 rounded-xl bg-secondary text-white text-base font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 active:scale-95"
              >
                Solicitar Acesso Gratuito
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center h-14 px-8 rounded-xl bg-white/10 border border-white/20 text-white text-base font-bold hover:bg-white/20 transition-all active:scale-95"
              >
                Já tenho uma conta
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-10 sm:py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
            <div className="flex items-center gap-2">
              <div className="size-6 text-white flex items-center justify-center bg-primary rounded shrink-0">
                <span className="material-symbols-outlined text-[16px]">diversity_3</span>
              </div>
              <span className="text-lg font-bold text-primary tracking-tight">RESPONSA</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <a href="#sobre-nos" className="text-sm font-medium text-slate-500 hover:text-secondary transition-colors">Sobre Nós</a>
              <a href="#recursos" className="text-sm font-medium text-slate-500 hover:text-secondary transition-colors">Recursos</a>
              <Link href="/termos-de-uso" className="text-sm font-medium text-slate-500 hover:text-secondary transition-colors">Termos de Uso</Link>
              <Link href="/privacidade" className="text-sm font-medium text-slate-500 hover:text-secondary transition-colors">Privacidade</Link>
              <Link href="/solicitar-acesso" className="text-sm font-medium text-slate-500 hover:text-secondary transition-colors">Contato</Link>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-400 text-center md:text-right">
              © {new Date().getFullYear()} RESPONSA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
