import Link from "next/link";

export default function Home() {
  return (
    <div className="hero-bg min-h-screen flex flex-col w-full">
      {/* HEADER */}
      <header className="w-full border-b border-[#e7ebf3] bg-surface-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="size-8 text-white flex items-center justify-center bg-primary rounded-lg">
                <span className="material-symbols-outlined text-[24px]">
                  diversity_3
                </span>
              </div>
              <span className="text-xl font-medium tracking-tight text-primary">
                RESPONSA
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="hidden sm:block text-sm font-medium text-text-sub hover:text-primary transition-colors">
                Suporte
              </button>
              {/* BOTÃO LOGIN ATUALIZADO PARA LINK */}
              <Link
                href="/login"
                className="flex items-center justify-center px-5 py-2 rounded-md bg-secondary text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-sm hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
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
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pb-32 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="flex flex-col gap-6 max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 w-fit mx-auto lg:mx-0">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    Nova Versão 2.0
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-primary leading-[1.1]">
                  Bem-vindo ao <br />
                  <span className="text-primary font-bold">RESPONSA</span>
                </h1>

                <p className="text-lg sm:text-xl text-text-main font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                  A sua central estratégica para diagnóstico e gestão de
                  talentos. Transforme dados em decisões que impulsionam o
                  capital humano.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center lg:justify-start">
                  {/* BOTÃO COMEÇAR AGORA ATUALIZADO PARA LINK */}
                  <Link
                    href="/login"
                    className="flex items-center justify-center h-12 px-8 rounded-md bg-secondary text-white text-base font-medium hover:bg-orange-600 transition-all shadow-lg hover:shadow-secondary/25"
                  >
                    Começar Agora
                    <span className="material-symbols-outlined ml-2 text-[20px]">
                      arrow_forward
                    </span>
                  </Link>
                  <button className="flex items-center justify-center h-12 px-8 rounded-md bg-white border border-[#d0d7e7] text-primary text-base font-medium hover:bg-gray-50 transition-all">
                    Explorar Demonstração
                  </button>
                </div>

                <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-text-sub">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-green-600">
                      check_circle
                    </span>
                    <span>Teste Grátis 14 dias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[18px] text-green-600">
                      check_circle
                    </span>
                    <span>Sem cartão de crédito</span>
                  </div>
                </div>
              </div>

              {/* HERO IMAGE */}
              <div className="relative lg:h-auto flex items-center justify-center">
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl"></div>

                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-white/50 bg-white">
                  <img
                    alt="Diverse team collaborating in a modern office looking at data"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4kfZoXHfdq0lL3ABaboBhewKDyYSXZJHBF7beiQBT5t5uCZlrgECnofKFotgo6g-ptkfJgZQJ3K1LQ2NopNTrFMZDRM2I_66IKvZQcolHaoqrQru8QQ42JCbjl1ZpiOL7u3vhSTC8izRS1YvxfPcJmBHy9n6Tfwq2weTgVi8ng9UMtN4B3aZw0BH3zp2U8oQsqrDy5BYR86w5C11FlDAun8Bls9SdCQ-Hb3_-kLxDXLOx1Tv5DbD-5fZ_ZK61g0-pxkAi6KUxXK1X"
                  />
                  <div className="absolute bottom-6 left-6 right-6 p-4 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-100 shadow-lg hidden sm:flex items-center gap-4">
                    <div className="bg-orange-50 p-2 rounded-full text-secondary">
                      <span className="material-symbols-outlined">
                        trending_up
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-primary">
                        Produtividade da Equipe
                      </p>
                      <p className="text-xs text-text-sub">+24% este mês</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 bg-white border-y border-[#e7ebf3]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-medium text-primary mb-4">
                Por que os líderes de RH escolhem a RESPONSA?
              </h2>
              <p className="text-text-main max-w-2xl mx-auto font-normal">
                Nossa plataforma integra as ferramentas essenciais para
                modernizar a sua gestão de pessoas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-6 rounded-2xl bg-background-light border border-[#d0d7e7] hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    analytics
                  </span>
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  Diagnóstico Preciso
                </h3>
                <p className="text-sm text-text-main leading-relaxed font-normal">
                  Identifique gaps de competência com dados reais e relatórios
                  detalhados que eliminam a adivinhação.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-background-light border border-[#d0d7e7] hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-orange-100 text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    sentiment_satisfied
                  </span>
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  Gestão de Clima
                </h3>
                <p className="text-sm text-text-main leading-relaxed font-normal">
                  Monitore o pulso da organização em tempo real e crie um
                  ambiente de trabalho mais engajado e produtivo.
                </p>
              </div>

              <div className="group p-6 rounded-2xl bg-background-light border border-[#d0d7e7] hover:border-secondary/50 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">
                    psychology
                  </span>
                </div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  Análise DISC
                </h3>
                <p className="text-sm text-text-main leading-relaxed font-normal">
                  Entenda profundamente o perfil comportamental dos seus
                  colaboradores para montar times de alta performance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-surface-light border-t border-[#e7ebf3] py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-6 text-white flex items-center justify-center bg-primary rounded">
                <span className="material-symbols-outlined text-[18px]">
                  diversity_3
                </span>
              </div>
              <span className="text-lg font-medium text-primary">RESPONSA</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <Link
                className="text-sm text-text-sub hover:text-secondary transition-colors"
                href="#"
              >
                Sobre Nós
              </Link>
              <Link
                className="text-sm text-text-sub hover:text-secondary transition-colors"
                href="#"
              >
                Recursos
              </Link>
              <Link
                className="text-sm text-text-sub hover:text-secondary transition-colors"
                href="#"
              >
                Termos de Uso
              </Link>
              <Link
                className="text-sm text-text-sub hover:text-secondary transition-colors"
                href="#"
              >
                Privacidade
              </Link>
              <Link
                className="text-sm text-text-sub hover:text-secondary transition-colors"
                href="#"
              >
                Contato
              </Link>
            </div>
            <p className="text-sm text-text-sub">
              © 2026 RESPONSA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
