"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TodosDisparosPage() {
  const router = useRouter();
  const [disparos, setDisparos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conexoesById, setConexoesById] = useState({}); // cache id -> conexão

  // Modal / popup
  const [selectedDisparo, setSelectedDisparo] = useState(null);
  const [pausing, setPausing] = useState(false);

  // mapa de atendentes (id -> nome exibido) — mantido em sincronia com form.js
  const atendenteMap = {
    "6130429a380edb00129c7c05": "Kelvin (adm@frutosdoacai.com)",
    "6751df556184e5001acd5873": "Lorrayne (atendimento@frutosdoacai.com)",
    "67472a610c315c001a4e9f2e": "Iara (comercial-09@frutosdoacai.com)",
    "629611e213b3740019256b63": "Rayssa (comercial-05@frutosdoacai.com)",
    "61330051bef59f00203e9bbe": "Pamella (comercial-01@frutosdoacai.com)",
  };

  async function LogOut() {
    await deleteCookie("auth_token");
    router.push("/login");
  }

  // busca uma conexão por id (POST /webhook/conexoes/id com body { id })
  async function fetchConexaoById(id) {
    try {
      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/conexoes/id",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      if (!res.ok) return null;
      const d = await res.json();
      return d && typeof d === "object" ? d : null;
    } catch (err) {
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          "https://frutosdoacai.up.railway.app/webhook/disparos"
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!mounted) return;

        const items = Array.isArray(data) ? data.slice() : [];
        items.sort((a, b) => {
          const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        setDisparos(items);

        // coletar whatsapp_ids únicos e buscar nomes
        const ids = Array.from(
          new Set(
            items
              .map((it) => it.whatsapp_id)
              .filter((v) => v !== undefined && v !== null && v !== "")
          )
        );

        if (ids.length > 0) {
          const map = {};
          await Promise.all(
            ids.map(async (id) => {
              const conn = await fetchConexaoById(id);
              map[String(id)] = conn; // pode ser null
            })
          );
          if (mounted) setConexoesById((prev) => ({ ...prev, ...map }));
        }
      } catch (err) {
        console.error("Erro ao buscar disparos:", err);
        if (mounted) setError("Não foi possível carregar os disparos.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // quando abrir o popup, garante que temos a conexão para o whatsapp_id (se faltar)
  useEffect(() => {
    let mounted = true;
    async function ensure(id) {
      if (!id) return;
      if (conexoesById[String(id)] !== undefined) return; // já buscado
      const conn = await fetchConexaoById(id);
      if (!mounted) return;
      setConexoesById((prev) => ({ ...prev, [String(id)]: conn }));
    }

    if (selectedDisparo && selectedDisparo.whatsapp_id) {
      ensure(selectedDisparo.whatsapp_id);
    }

    return () => {
      mounted = false;
    };
  }, [selectedDisparo]);

  function formatDate(value) {
    if (!value) return "—";
    try {
      const d = new Date(value);
      return d.toLocaleString("pt-BR", {
        timeZone: "America/Cuiaba",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return value;
    }
  }

  // mapeia status para cor: Ativo = amarelo, Pausado = vermelho, Finalizado = verde
  function getStatusColor(status) {
    if (!status) return "bg-gray-300";
    const s = String(status).toLowerCase();
    if (s === "ativo") return "bg-yellow-500";
    if (s === "pausado") return "bg-red-500";
    if (s === "finalizado") return "bg-green-500";
    return "bg-gray-300";
  }

  // envia evento de alteração de status para a API e atualiza localmente (toggle)
  async function pauseDisparo(id) {
    setPausing(true);
    try {
      const current = disparos.find((d) => d.id === id) || selectedDisparo;
      const curStatus = (current?.status || "").toString().toLowerCase();
      const newStatus = curStatus === "pausado" ? "Ativo" : "Pausado";

      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/disparo/status",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: newStatus }),
        }
      );

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Erro no servidor");
      }

      setSelectedDisparo((prev) =>
        prev && prev.id === id ? { ...prev, status: newStatus } : prev
      );
      setDisparos((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );

      alert(`Disparo atualizado para: ${newStatus}`);
    } catch (err) {
      console.error("Erro ao alterar status do disparo:", err);
      alert(
        "Falha ao alterar status do disparo. Veja console para mais detalhes."
      );
    } finally {
      setPausing(false);
    }
  }

  return (
    <main className="min-h-screen items-center content-start bg-slate-100 p-6">
      <div className="absolute top-6 left-6 gap-2 w-full flex items-center justify-start">
        <div className="w-12 h-12 rounded-xl bg-fuchsia-700 relative">
          <Image
            className="rounded-xl"
            alt="Logo"
            src="/Logo.png"
            fill
            priority
          />
        </div>

        <Link
          href="/"
          className="w-32 p-1 pl-2 pr-2 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Criar disparos
        </Link>

        <Link
          href="/disparos"
          className="text-center w-36 p-1 rounded-xl  bg-fuchsia-900 text-white font-semibold hover:opacity-50 cursor-pointer"
        >
          Disparos
        </Link>

        <Link
          href="/conexoes"
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Conexões
        </Link>

        <Link
          href="/templates"
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Templates
        </Link>

        <Link
          href="/atendentes"
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Atendentes
        </Link>

        <a
          target="_blank"
          href="https://app.chakrahq.com/chats"
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Conversas
        </a>
      </div>

      <button
        onClick={LogOut}
        className="absolute top-6 right-6 w-36 p-1 rounded-xl bg-none border border-red-300 text-red-700 font-medium hover:opacity-50 cursor-pointer"
      >
        Desconectar
      </button>

      <section className="max-w-7xl mx-auto mt-28">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            Disparos (Clique para visualizar)
          </h1>
          <p className="text-sm text-gray-500">
            Total: <span className="font-medium">{disparos.length}</span>
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Carregando...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : disparos.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Nenhum disparo encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left divide-y divide-gray-200">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Criado em
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Funil
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Etapa
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Template
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Momento de envio
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Filtro de envio
                    </th>
                    <th className="px-5 py-3 text-sm font-medium text-gray-600">
                      Total enviados
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {disparos.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedDisparo(d)}
                    >
                      <td className="px-5 py-3">
                        <span
                          title={d.status ?? "—"}
                          className={`inline-block w-3 h-3 rounded-full ${getStatusColor(
                            d.status
                          )}`}
                        />
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {formatDate(d.created_at)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {d.funil?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {d.etapa?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {d.template?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {d.agendamento
                          ? formatDate(d.agendamento)
                          : "Enviado imediatamente"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {Array.isArray(d.selected_atendentes) &&
                        d.selected_atendentes.length > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-800">
                              {d.selected_atendentes.length} selecionado(s)
                            </span>
                            <span className="text-xs text-gray-500">
                              {d.selected_atendentes
                                .map((id) => atendenteMap[id] ?? id)
                                .join(" • ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700">
                            {d.quantidade
                              ? `${d.enviados ?? 0}/${d.quantidade}`
                              : "—"}
                          </span>
                          {d.quantidade && (
                            <div className="group relative inline-block">
                              <svg
                                className="w-4 h-4 text-gray-500 cursor-help hover:text-gray-700 transition-colors"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg pointer-events-none transition-opacity z-50 min-w-max">
                                Atualizado em alguns minutos
                                <div className="absolute top-full right-2 w-2 h-2 bg-slate-800" />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Modal detalhado */}
      {selectedDisparo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay com blur */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedDisparo(null)}
          />

          <div className="relative max-w-3xl w-[95%] max-h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden z-60 flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Disparo #{selectedDisparo.id}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Criado: {formatDate(selectedDisparo.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDisparo(null)}
                    className="text-gray-500 hover:text-gray-800"
                    aria-label="Fechar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <strong>Funil</strong>
                  <div className="text-slate-800">
                    {selectedDisparo.funil?.name ?? "—"}
                  </div>
                </div>

                <div>
                  <strong>Etapa</strong>
                  <div className="text-slate-800">
                    {selectedDisparo.etapa?.name ?? "—"}
                  </div>
                </div>

                <div>
                  <strong>Agendamento</strong>
                  <div className="text-slate-800">
                    {selectedDisparo.agendamento
                      ? formatDate(selectedDisparo.agendamento)
                      : "Enviado imediatamente"}
                  </div>
                </div>

                <div>
                  <strong>Limite máximo de envios</strong>
                  <div className="text-slate-800">
                    {Number(selectedDisparo.quantidade) === 0
                      ? "Todos"
                      : selectedDisparo.quantidade}
                  </div>
                </div>

                <div>
                  <strong>Limites máximo de contatos</strong>
                  <div className="text-slate-800">
                    {selectedDisparo.limites ?? "—"}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <strong>Modo de Limite</strong>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedDisparo.modo_limite === "individual" ? (
                      <>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Limite Individual por Atendente
                        </span>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Limite Geral
                      </span>
                    )}
                  </div>

                  {/* Mostrar limites individuais se modo for individual */}
                  {selectedDisparo.modo_limite === "individual" &&
                    selectedDisparo.limites_individuais &&
                    Object.keys(selectedDisparo.limites_individuais).length >
                      0 && (
                      <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-purple-800">
                            Limites Configurados por Atendente
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(
                            selectedDisparo.limites_individuais
                          ).map(([atendenteId, limite]) => {
                            const atendenteNome =
                              atendenteMap[atendenteId] || atendenteId;
                            const leadsDisponiveis =
                              selectedDisparo.atendente_counts?.[atendenteId] ||
                              0;
                            const isAllLeads = Number(limite) === 0;

                            return (
                              <div
                                key={atendenteId}
                                className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-200"
                              >
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-800">
                                    {atendenteNome}
                                  </span>
                                  {selectedDisparo.atendente_counts?.[
                                    atendenteId
                                  ] !== undefined && (
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({leadsDisponiveis} disponíveis)
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isAllLeads ? (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                      ✓ Todos ({leadsDisponiveis})
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                      {limite} leads
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-purple-200 flex items-center justify-between">
                          <span className="text-xs font-medium text-purple-800">
                            Total configurado:
                          </span>
                          <span className="text-sm font-bold text-purple-900">
                            {(() => {
                              let total = 0;
                              Object.entries(
                                selectedDisparo.limites_individuais
                              ).forEach(([id, limite]) => {
                                const numLimite = Number(limite);
                                const maxDisponivel = Number(
                                  selectedDisparo.atendente_counts?.[id] || 0
                                );
                                total +=
                                  numLimite === 0 ? maxDisponivel : numLimite;
                              });
                              return total;
                            })()}{" "}
                            leads
                          </span>
                        </div>
                      </div>
                    )}

                  {/* Mostrar atendentes selecionados se modo for geral */}
                  {selectedDisparo.modo_limite === "geral" &&
                    Array.isArray(selectedDisparo.selected_atendentes) &&
                    selectedDisparo.selected_atendentes.length > 0 && (
                      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-blue-800">
                            Atendentes Selecionados
                          </span>
                        </div>
                        <div className="space-y-2">
                          {selectedDisparo.selected_atendentes.map(
                            (atendenteId) => {
                              const atendenteNome =
                                atendenteMap[atendenteId] || atendenteId;
                              const leadsDisponiveis =
                                selectedDisparo.atendente_counts?.[
                                  atendenteId
                                ] || 0;

                              return (
                                <div
                                  key={atendenteId}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-blue-200"
                                >
                                  <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-800">
                                      {atendenteNome}
                                    </span>
                                  </div>
                                  {selectedDisparo.atendente_counts?.[
                                    atendenteId
                                  ] !== undefined && (
                                    <span className="text-xs text-gray-500">
                                      {leadsDisponiveis} leads disponíveis
                                    </span>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="text-xs text-blue-700">
                            <svg
                              className="w-4 h-4 inline-block mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            A quantidade a ser enviada de{" "}
                            <strong>{selectedDisparo.quantidade}</strong> leads
                            será distribuída entre os atendentes selecionados
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {/* Fracionamento */}
                {selectedDisparo.fracionamento?.ativo && (
                  <div className="md:col-span-2">
                    <strong className="flex items-center gap-2 mb-3">
                      <svg
                        className="w-5 h-5 text-violet-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Fracionamento Inteligente
                    </strong>
                    <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-2 border-violet-200 rounded-2xl p-5 shadow-md">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          ATIVO
                        </span>
                        <span className="text-xs text-gray-600 font-medium">
                          Disparo configurado em lotes
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Leads por Lote */}
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-purple-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-purple-100 p-1.5 rounded-lg">
                              <svg
                                className="w-4 h-4 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              Leads por Lote
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-purple-700">
                            {selectedDisparo.fracionamento.leads_por_lote}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Por envio
                          </p>
                        </div>

                        {/* Pausa Configurada */}
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-fuchsia-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-fuchsia-100 p-1.5 rounded-lg">
                              <svg
                                className="w-4 h-4 text-fuchsia-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-700">
                              Pausa entre Lotes
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-fuchsia-700">
                            {(() => {
                              const totalSegundos =
                                selectedDisparo.fracionamento.pausa_segundos;
                              const horas = Math.floor(totalSegundos / 3600);
                              const minutos = Math.floor(
                                (totalSegundos % 3600) / 60
                              );
                              const segundos = totalSegundos % 60;
                              const parts = [];
                              if (horas > 0) parts.push(`${horas}h`);
                              if (minutos > 0) parts.push(`${minutos}min`);
                              if (segundos > 0) parts.push(`${segundos}s`);
                              return parts.join(" ") || "0s";
                            })()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Intervalo
                          </p>
                        </div>

                        {/* Total de Lotes */}
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-emerald-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-100 p-1.5 rounded-lg">
                              <svg
                                className="w-4 h-4 text-emerald-600"
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
                            <span className="text-xs font-semibold text-gray-700">
                              Total de Lotes
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-emerald-700">
                            {selectedDisparo.quantidade &&
                            selectedDisparo.fracionamento.leads_por_lote
                              ? Math.ceil(
                                  selectedDisparo.quantidade /
                                    selectedDisparo.fracionamento.leads_por_lote
                                )
                              : "—"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Estimado</p>
                        </div>
                      </div>

                      {/* Estimativa de Tempo Total */}
                      {selectedDisparo.quantidade &&
                        selectedDisparo.fracionamento.leads_por_lote && (
                          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                            <svg
                              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <div className="flex-1">
                              <p className="text-xs font-bold text-amber-900 mb-0.5">
                                Tempo Total Estimado
                              </p>
                              <p className="text-sm font-semibold text-amber-800">
                                {(() => {
                                  const numLotes = Math.ceil(
                                    selectedDisparo.quantidade /
                                      selectedDisparo.fracionamento
                                        .leads_por_lote
                                  );
                                  const tempoTotalSegundos =
                                    (numLotes - 1) *
                                    selectedDisparo.fracionamento
                                      .pausa_segundos;
                                  const horas = Math.floor(
                                    tempoTotalSegundos / 3600
                                  );
                                  const minutos = Math.floor(
                                    (tempoTotalSegundos % 3600) / 60
                                  );
                                  const segundos = tempoTotalSegundos % 60;
                                  const parts = [];
                                  if (horas > 0) parts.push(`${horas}h`);
                                  if (minutos > 0) parts.push(`${minutos}min`);
                                  if (segundos > 0) parts.push(`${segundos}s`);
                                  return parts.join(" ") || "Instantâneo";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )}

                {/* Tempo Estimado quando NÃO há Fracionamento */}
                {!selectedDisparo.fracionamento?.ativo &&
                  selectedDisparo.quantidade && (
                    <div className="md:col-span-2">
                      <strong>Tempo Estimado de Envio</strong>
                      <div className="mt-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <svg
                          className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-blue-900 mb-1">
                            Envio Direto (Sem Fracionamento)
                          </p>
                          <p className="text-lg font-semibold text-blue-800">
                            {(() => {
                              // Estimativa: 5 segundos por lead
                              const tempoTotalSegundos =
                                selectedDisparo.quantidade * 5;
                              const horas = Math.floor(
                                tempoTotalSegundos / 3600
                              );
                              const minutos = Math.floor(
                                (tempoTotalSegundos % 3600) / 60
                              );
                              const segundos = tempoTotalSegundos % 60;
                              const parts = [];
                              if (horas > 0) parts.push(`${horas}h`);
                              if (minutos > 0) parts.push(`${minutos}min`);
                              if (segundos > 0) parts.push(`${segundos}s`);
                              return parts.join(" ") || "Instantâneo";
                            })()}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            ⚡ Estimativa baseada em ~5 segundos por lead
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                <div>
                  <strong>Total enviados</strong>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-700">
                      {selectedDisparo.enviados ?? 0}
                    </span>
                    <div className="group relative inline-block">
                      <svg
                        className="w-5 h-5 text-gray-500 cursor-help hover:text-gray-700 transition-colors"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg pointer-events-none transition-opacity z-50 min-w-max">
                        Os valores são atualizados em alguns minutos, e não
                        instantaneamente
                        <div className="absolute top-full right-2 w-2 h-2 bg-slate-800" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <strong>Status</strong>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${getStatusColor(
                        selectedDisparo.status
                      )}`}
                    />
                    <div className="text-slate-800">
                      {selectedDisparo.status ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <strong>Template</strong>
                  <div className="text-slate-800 mb-3">
                    {selectedDisparo.template?.name ?? "—"}
                  </div>
                  {selectedDisparo.template && (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                      {/* Header do WhatsApp */}
                      <div className="bg-[#075e54] px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                            👤
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              Pré-visualização do Template
                            </p>
                            <p className="text-gray-200 text-xs">online</p>
                          </div>
                        </div>
                      </div>

                      {/* Área de mensagens */}
                      <div
                        className="p-4 min-h-[300px] flex items-start"
                        style={{
                          backgroundImage:
                            "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwTDQwIDQwTTQwIDBMMCA0MCIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')",
                          backgroundColor: "#efeae2",
                        }}
                      >
                        <div className="w-full">
                          <div className="bg-white rounded-lg rounded-tl-none shadow-md">
                            {/* Header Preview */}
                            {(() => {
                              const headerComp =
                                selectedDisparo.template.components?.find(
                                  (c) => c.type === "HEADER"
                                );
                              if (
                                headerComp?.format === "TEXT" &&
                                headerComp.text
                              ) {
                                return (
                                  <div className="px-3 pt-3 pb-1">
                                    <p className="font-bold text-base text-gray-900">
                                      {headerComp.text}
                                    </p>
                                  </div>
                                );
                              }
                              if (headerComp?.format === "IMAGE") {
                                const imageUrl =
                                  headerComp.example?.header_handle?.[0];
                                if (imageUrl && imageUrl.startsWith("http")) {
                                  return (
                                    <img
                                      src={imageUrl}
                                      alt="Header"
                                      className="w-full rounded-t-lg max-h-48 object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  );
                                } else {
                                  return (
                                    <div className="bg-gray-200 w-full h-32 rounded-t-lg flex items-center justify-center">
                                      <span className="text-gray-500 text-sm">
                                        🖼️ Imagem do Cabeçalho
                                      </span>
                                    </div>
                                  );
                                }
                              }
                              return null;
                            })()}

                            {/* Body Preview */}
                            {(() => {
                              const bodyComp =
                                selectedDisparo.template.components?.find(
                                  (c) => c.type === "BODY"
                                );
                              if (bodyComp?.text) {
                                const exemplo =
                                  bodyComp.example?.body_text_named_params?.[0]
                                    ?.example || "Cliente";
                                return (
                                  <div className="px-3 py-3">
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                      {bodyComp.text.replace(
                                        /\{\{nome\}\}/g,
                                        exemplo
                                      )}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Footer Preview */}
                            {(() => {
                              const footerComp =
                                selectedDisparo.template.components?.find(
                                  (c) => c.type === "FOOTER"
                                );
                              if (footerComp?.text) {
                                return (
                                  <div className="px-3 pb-2">
                                    <p className="text-xs text-gray-500">
                                      {footerComp.text}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Buttons Preview */}
                            {(() => {
                              const buttonsComp =
                                selectedDisparo.template.components?.find(
                                  (c) => c.type === "BUTTONS"
                                );
                              if (buttonsComp?.buttons?.length > 0) {
                                return (
                                  <div className="border-t border-gray-200">
                                    {buttonsComp.buttons.map((botao, idx) => (
                                      <div
                                        key={idx}
                                        className="px-3 py-2.5 text-center border-b border-gray-200 last:border-0 hover:bg-gray-50 cursor-pointer transition"
                                      >
                                        <p className="text-sm text-blue-600 font-medium">
                                          {botao.type === "PHONE_NUMBER" &&
                                            "📞 "}
                                          {botao.type === "URL" && "🔗 "}
                                          {botao.text}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          <div className="text-right mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date().toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-end gap-3">
                {/* aviso apenas quando o disparo estiver pausado */}
                {(selectedDisparo?.status || "").toString().toLowerCase() ===
                  "ativo" && (
                  <div className="flex-1">
                    <div className="hidden sm:flex items-center gap-3">
                      <div className="inline-flex items-start gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs leading-tight">
                        <svg
                          className="w-4 h-4 text-slate-500 flex-shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M9 2a7 7 0 100 14A7 7 0 009 2zM8.25 6.5a1 1 0 112 0v1.75a1 1 0 11-2 0V6.5zM9 11a1 1 0 100 2 1 1 0 000-2z" />
                        </svg>
                        <div className="text-slate-700">
                          <div className="font-medium text-xs">Observação</div>
                          <div className="text-slate-500 text-xs">
                            Os contatos que já estão na fila receberam as
                            mensagens mesmo se você pausar agora. Não se
                            preocupe — a fila contém poucos contatos.
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* versão compacta para mobile */}
                    <div className="sm:hidden text-xs text-slate-500">
                      Os contatos na fila já receberam — pausar não retroage.
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setSelectedDisparo(null)}
                  className="px-4 py-2 bg-gray-100 rounded-xl font-medium text-base text-gray-700 hover:opacity-50"
                >
                  Fechar
                </button>

                {selectedDisparo.status?.toString().toLowerCase() !==
                  "finalizado" && (
                  <button
                    onClick={() => pauseDisparo(selectedDisparo.id)}
                    disabled={pausing}
                    className={`px-4 py-2 font-medium rounded-xl cursor-pointer text-base hover:opacity-90 ${
                      (selectedDisparo.status || "")
                        .toString()
                        .toLowerCase() === "pausado"
                        ? "bg-green-600 text-white"
                        : "bg-red-500 text-black"
                    }`}
                  >
                    {pausing
                      ? (selectedDisparo.status || "")
                          .toString()
                          .toLowerCase() === "pausado"
                        ? "Despausando..."
                        : "Pausando..."
                      : (selectedDisparo.status || "")
                          .toString()
                          .toLowerCase() === "pausado"
                      ? "Despausar disparo"
                      : "Pausar disparo"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
