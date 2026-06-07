"use client";

import React from "react";

export default function ModeSelection({ onSelectSingle, onSelectMultiple }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden animate-fade-in">
        {/* Header com Gradiente */}
        <div className="relative bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 p-6 md:p-10 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Como deseja criar seus disparos?
                </h1>
                <p className="text-fuchsia-100 text-sm sm:text-base lg:text-lg mt-1">
                  Escolha o modo de criação que melhor se adapta à sua
                  necessidade
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Opções */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Opção Única */}
          <button
            onClick={onSelectSingle}
            className="group relative bg-gradient-to-br from-slate-50 to-slate-100 hover:from-white hover:to-slate-50 border-2 border-slate-200 hover:border-fuchsia-400 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] text-left"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg
                className="w-6 h-6 text-fuchsia-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Disparo Único
            </h3>

            <p className="text-slate-600 mb-4 leading-relaxed">
              Crie e envie um disparo por vez com configurações específicas.
            </p>

            <div className="space-y-2 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Configuração focada e simples</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Ideal para campanhas pontuais</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-green-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Envio imediato ou agendado</span>
              </div>
            </div>

            <div className="mt-6 text-fuchsia-600 font-semibold flex items-center gap-2 group-hover:gap-3 transition-all">
              <span>Criar disparo único</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>

          {/* Opção Múltipla */}
          <button
            onClick={onSelectMultiple}
            className="group relative bg-gradient-to-br from-fuchsia-50 to-purple-50 hover:from-fuchsia-100 hover:to-purple-100 border-2 border-fuchsia-300 hover:border-fuchsia-500 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] text-left ring-2 ring-fuchsia-200"
          >
            <div className="absolute top-4 right-4">
              <span className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                RECOMENDADO
              </span>
            </div>

            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z M4 7h16M4 11h16"
                />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-fuchsia-900 mb-3">
              Múltiplos Disparos
            </h3>

            <p className="text-purple-900 mb-4 leading-relaxed">
              Crie vários disparos de uma vez, reutilize configurações e envie
              em sequência.
            </p>

            <div className="space-y-2 text-sm text-purple-700">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-fuchsia-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Crie quantos disparos quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-fuchsia-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Duplique e reutilize configurações</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-fuchsia-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Envio sequencial com delay</span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-fuchsia-600 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Pré-visualização completa</span>
              </div>
            </div>

            <div className="mt-6 text-fuchsia-700 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
              <span>Criar múltiplos disparos</span>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer Info */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start gap-3">
            <svg
              className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-blue-900 font-semibold text-sm mb-1">
                💡 Dica
              </p>
              <p className="text-blue-700 text-sm">
                Escolha <strong>Múltiplos Disparos</strong> se você precisa
                enviar mensagens semelhantes para diferentes grupos ou em
                diferentes horários. Você economiza tempo e garante
                consistência!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
