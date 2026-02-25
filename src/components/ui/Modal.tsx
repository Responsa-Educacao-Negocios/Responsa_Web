"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  children,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, []);

  // Garante que o portal só tente renderizar no lado do cliente (browser)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Trava o scroll do fundo
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Criamos o Portal para o final do body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* Overlay para fechar ao clicar fora (opcional) */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Caixa branca do Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
              {icon && (
                <span className="material-symbols-outlined text-accent">
                  {icon}
                </span>
              )}
              {title}
            </h3>
            {subtitle && (
              <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors focus:outline-none p-1 rounded-md hover:bg-red-50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body, // O destino do portal
  );
}
