import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Configuração otimizada da fonte
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "RESPONSA - Bem-vindo",
  description:
    "A sua central estratégica para diagnóstico e gestão de talentos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${montserrat.variable} antialiased selection:bg-secondary selection:text-white flex flex-col min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
