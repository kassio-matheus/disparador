"use client";

import React from "react";

export default function DisparosPreview({
  disparos,
  onClose,
  onConfirm,
  envioSequencial,
  delayEnvio,
  atendenteMap,
  moverParaCima,
  moverParaBaixo,
}) {
  const calcularTempoDisparo = (disparo) => {
    const leads =
      disparo.modoLimite === "geral"
        ? Number(disparo.quantidade) || 0
        : Object.values(disparo.limitesIndividuais || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          );

    // Se leads for 0, usa o limite total disponível (caso comum no sistema)
    let totalLeads = leads;
    if (totalLeads === 0 && disparo.limites > 0) {
      totalLeads = disparo.limites;
    }

    const tempoProcessamento = totalLeads * 5; // 5 segundos por lead
    let tempoPausa = 0;

    if (disparo.fracionamentoAtivo && disparo.leadsPorLote > 0) {
      const leadsPorLote = Number(disparo.leadsPorLote);
      const numLotes = Math.ceil(totalLeads / leadsPorLote);
      if (numLotes > 1) {
        const pausaSegundos =
          Number(disparo.pausaDias || 0) * 86400 +
          Number(disparo.pausaHoras || 0) * 3600 +
          Number(disparo.pausaMinutos || 0) * 60 +
          Number(disparo.pausaSegundos || 0);
        tempoPausa = (numLotes - 1) * pausaSegundos;
      }
    }

    return tempoProcessamento + tempoPausa;
  };

  const calcularTempoTotal = () => {
    if (envioSequencial) {
      const tempoDisparos = disparos.reduce(
        (acc, d) => acc + calcularTempoDisparo(d),
        0
      );
      const tempoDelays = (disparos.length - 1) * delayEnvio;
      return tempoDisparos + tempoDelays;
    } else {
      // No modo paralelo, o tempo total é o tempo do disparo mais longo
      return Math.max(...disparos.map((d) => calcularTempoDisparo(d)), 0);
    }
  };

  const formatarTempo = (segundos) => {
    if (segundos < 60) return `${segundos}s`;
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    if (minutos < 60)
      return segs > 0 ? `${minutos}min ${segs}s` : `${minutos}min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}min ${segs}s`;
  };

  const calcularTotalLeads = () => {
    return disparos.reduce((total, disparo) => {
      if (disparo.modoLimite === "geral") {
        return total + (Number(disparo.quantidade) || 0);
      } else {
        return (
          total +
          Object.values(disparo.limitesIndividuais || {}).reduce(
            (sum, val) => sum + (Number(val) || 0),
            0
          )
        );
      }
    }, 0);
  };

  const calcularTotalAtendentes = () => {
    const atendentesUnicos = new Set();
    disparos.forEach((disparo) => {
      (disparo.selectedAtendentes || []).forEach((id) =>
        atendentesUnicos.add(id)
      );
    });
    return atendentesUnicos.size;
  };

  const contarDisparosAgendados = () => {
    return disparos.filter(
      (d) => d.momento?.value === "agendado" && d.agendamento
    ).length;
  };

  const contarDisparosImediatos = () => {
    return disparos.filter((d) => d.momento?.value === "agora").length;
  };

  const formatarHoraCuiaba = (date) => {
    return date.toLocaleTimeString("pt-BR", {
      timeZone: "America/Cuiaba",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const gerarCronograma = () => {
    const agora = new Date();
    let tempoAcumuladoSegundos = 0;

    return disparos.map((disparo, index) => {
      let dataInicio;

      if (envioSequencial) {
        // Modo Sequencial: Acumula tempos
        dataInicio = new Date(agora.getTime() + tempoAcumuladoSegundos * 1000);
      } else {
        // Modo Paralelo: Cada um no seu tempo (agora ou agendado)
        if (disparo.momento?.value === "agendado" && disparo.agendamento) {
          dataInicio = new Date(disparo.agendamento);
        } else {
          dataInicio = agora;
        }
      }

      const duracao = calcularTempoDisparo(disparo);
      const dataFim = new Date(dataInicio.getTime() + duracao * 1000);

      if (envioSequencial) {
        tempoAcumuladoSegundos += duracao + delayEnvio;
      }

      return {
        id: disparo.id || index,
        numero: index + 1,
        inicio: formatarHoraCuiaba(dataInicio),
        fim: formatarHoraCuiaba(dataFim),
        duracao,
        disparo,
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-2 sm:p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl max-w-7xl w-full h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden animate-fade-in border border-white/20">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-purple-600 via-purple-600 to-cyan-600 p-4 sm:p-6 lg:px-8 lg:py-7 text-white overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 sm:w-48 h-24 sm:h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md p-2 sm:p-3 rounded-xl shadow-inner border border-white/30">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 text-purple-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black">
                    Resumo do envio
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-xl transition-all border border-white/20 active:scale-95 group"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* Estatísticas Expandidas */}
          <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="bg-blue-500 p-1.5 sm:p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-blue-600 font-medium truncate">
                    Total de Disparos
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                    {disparos.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="bg-purple-500 p-1.5 sm:p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">
                    Total de Leads
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                    {calcularTotalLeads()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-50 border-2 border-purple-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="bg-purple-500 p-1.5 sm:p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-purple-600 font-medium truncate">
                    Atendentes
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900">
                    {calcularTotalAtendentes()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="bg-amber-500 p-1.5 sm:p-2 rounded-lg">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-amber-600 font-medium truncate">
                    Modo
                  </p>
                  <p className="text-base sm:text-xl font-bold text-amber-900">
                    {envioSequencial ? "Sequencial" : "Simultâneo"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais em Cards */}
          <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {!envioSequencial && (
              <>
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-500 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-indigo-600 font-medium">
                        Disparos Imediatos
                      </p>
                      <p className="text-2xl font-bold text-indigo-900">
                        {contarDisparosImediatos()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-xl p-4 transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-violet-500 p-2 rounded-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-violet-600 font-medium">
                        Disparos Agendados
                      </p>
                      <p className="text-2xl font-bold text-violet-900">
                        {contarDisparosAgendados()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div
              className={`bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-rose-200 rounded-xl p-4 transition-all hover:shadow-md ${
                envioSequencial ? "sm:col-span-2 lg:col-span-3" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-rose-500 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-rose-600 font-medium font-bold  tracking-wider">
                    Tempo Total Estimado (Processamento + Pausas)
                  </p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-900">
                    {formatarTempo(calcularTempoTotal())}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cronograma de Envios (Aparece para múltiplos disparos, independente do modo) */}
          {disparos.length >= 1 && (
            <div className="mb-8 bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Cronograma de Disparos
                    </h3>
                    <p className="text-xs text-slate-500 font-medium font-bold uppercase tracking-wider">
                      {envioSequencial
                        ? "Envio em Sequência (Um após o outro)"
                        : "Envio em Paralelo (Simultâneo conforme agendado)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                {/* Linha vertical tracejada */}
                <div className="absolute left-6 top-2 bottom-2 w-0.5 border-l-2 border-dashed border-slate-200"></div>

                <div className="space-y-6 relative">
                  {gerarCronograma().map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-6 group">
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg transition-transform group-hover:scale-110 ${
                            idx % 2 === 0
                              ? "bg-gradient-to-br from-indigo-500 to-blue-600"
                              : "bg-gradient-to-br from-fuchsia-500 to-purple-600"
                          }`}
                        >
                          {item.numero}
                        </div>
                      </div>

                      <div className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-4 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-2">
                              <span>Funil: {item.disparo.funil?.name}</span>
                              <span className="text-slate-400">|</span>
                              <span className="text-indigo-600 font-semibold">
                                {item.disparo.etapa?.name}
                              </span>
                            </p>
                            <p className="text-sm text-slate-500 mt-1 italic">
                              Template: {item.disparo.template?.name}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center">
                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                              <span className="text-xs text-slate-400 font-bold  block leading-none mb-1">
                                Início
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                {item.inicio}
                              </span>
                            </div>

                            <div className="text-slate-300">
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </div>

                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                              <span className="text-xs text-slate-400 font-bold  block leading-none mb-1">
                                Fim
                              </span>
                              <span className="text-sm font-bold text-slate-700">
                                {item.fim}
                              </span>
                            </div>

                            <div className="ml-2 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-black  tracking-tighter">
                              Duração: {formatarTempo(item.duracao)}
                            </div>
                          </div>
                        </div>

                        {envioSequencial && idx < disparos.length - 1 && (
                          <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50/50 -mx-4 px-4 py-2">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            PAUSA DE SEGURANÇA: {formatarTempo(delayEnvio)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Disparos */}
          <div className="space-y-4 lg:space-y-6">
            <div className="flex items-center gap-3 py-2 border-b-2 border-slate-100">
              <div className="bg-slate-800 p-2 rounded-xl">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">
                  Detalhamento da Fila
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {" "}
                  Passe o mouse sobre um card para reordenar{" "}
                </p>
              </div>
            </div>
            {disparos.map((disparo, index) => (
              <div
                key={disparo.id}
                className="group relative bg-gradient-to-br from-white to-slate-50/50 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300"
              >
                {/* Controles de Ordenação (Estética) */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                  <button
                    onClick={() => moverParaCima(index)}
                    disabled={index === 0}
                    className={`p-2 rounded-xl border-2 bg-white shadow-lg transition-all ${
                      index === 0
                        ? "text-slate-200 border-slate-100 cursor-not-allowed"
                        : "text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-90"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => moverParaBaixo(index)}
                    disabled={index === disparos.length - 1}
                    className={`p-2 rounded-xl border-2 bg-white shadow-lg transition-all ${
                      index === disparos.length - 1
                        ? "text-slate-200 border-slate-100 cursor-not-allowed"
                        : "text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 active:scale-90"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Número do Disparo com Efeito de Badge */}
                  <div className="relative flex-shrink-0">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-200 ring-4 ring-white">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    {/* Linha 1: Funil e Etapa */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                          </svg>
                          FUNIL
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {disparo.funil?.name || "Não selecionado"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          ETAPA
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {disparo.etapa?.name || "Não selecionada"}
                        </p>
                      </div>
                    </div>

                    {/* Linha 2: Momento e Template */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          MOMENTO
                        </p>
                        <div className="flex items-center gap-2">
                          {disparo.momento?.value === "agora" ? (
                            <>
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              <p className="text-sm font-semibold text-green-700">
                                Enviar Agora
                              </p>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <p className="text-xs font-semibold text-blue-700 truncate">
                                {disparo.agendamento
                                  ? new Date(
                                      disparo.agendamento
                                    ).toLocaleString("pt-BR", {
                                      dateStyle: "short",
                                      timeStyle: "short",
                                    })
                                  : "Agendado"}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          TEMPLATE
                        </p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {disparo.template?.name || "Não selecionado"}
                        </p>
                      </div>
                    </div>

                    {/* Linha 3: Atendentes */}
                    {disparo.selectedAtendentes &&
                      disparo.selectedAtendentes.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            ATENDENTES ({disparo.selectedAtendentes.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {disparo.selectedAtendentes
                              .slice(0, 4)
                              .map((atendenteId) => (
                                <span
                                  key={atendenteId}
                                  className="bg-fuchsia-100 text-fuchsia-700 text-xs font-semibold px-3 py-1 rounded-full border border-fuchsia-200"
                                >
                                  {atendenteMap[atendenteId]
                                    ?.split("(")[0]
                                    .trim() || "Atendente"}
                                </span>
                              ))}
                            {disparo.selectedAtendentes.length > 4 && (
                              <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">
                                +{disparo.selectedAtendentes.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Linha 4: Limites e Fracionamento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <p className="text-xs sm:text-sm text-blue-900">
                            <strong className="text-blue-700">Limite:</strong>{" "}
                            <span className="font-bold">
                              {disparo.modoLimite === "geral"
                                ? `${disparo.quantidade || 0} leads`
                                : `${Object.values(
                                    disparo.limitesIndividuais || {}
                                  ).reduce(
                                    (a, b) => a + (Number(b) || 0),
                                    0
                                  )} leads`}
                            </span>
                            <span className="text-xs ml-1">
                              (
                              {disparo.modoLimite === "geral"
                                ? "Geral"
                                : "Individual"}
                              )
                            </span>
                          </p>
                        </div>
                      </div>

                      {disparo.fracionamentoAtivo && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-xs sm:text-sm text-purple-900">
                              <strong className="text-purple-700">
                                Fracionamento:
                              </strong>{" "}
                              <span className="font-bold">
                                {disparo.leadsPorLote} leads/lote
                              </span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 p-6 sm:px-10 py-5 bg-white/80 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6">
            <div className="hidden lg:block"></div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="group px-6 py-4 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl transition-all border-2 border-slate-200 flex items-center justify-center gap-3 active:scale-95 shadow-sm"
              >
                <svg
                  className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="text-base  tracking-tight">
                  Voltar e Ajustar
                </span>
              </button>
              <button
                onClick={onConfirm}
                className="group px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-200 hover:shadow-purple-300 flex items-center justify-center gap-3 active:scale-95 scale-100"
              >
                <span className="text-base  tracking-tight">
                  Iniciar {disparos.length} Disparo
                  {disparos.length > 1 ? "s" : ""}
                </span>
                <svg
                  className="w-6 h-6 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
