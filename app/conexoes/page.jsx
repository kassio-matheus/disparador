"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Conexoes() {
  const router = useRouter();
  const API_URL = "https://frutosdoacai.up.railway.app/webhook/conexoes";

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    url: "",
    tipo: "Oficial",
    whatsapp_number_id: "",
    waba_id: "",
    business_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function LogOut() {
    await deleteCookie("auth_token");
    router.push("/login");
  }

  useEffect(() => {
    let mounted = true;

    async function fetchConexoes() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(API_URL);
        if (res.status === 500) {
          // backend pode retornar 500 quando o body está vazio
          if (!mounted) return;
          setConnections([]);
          setError(
            "Nenhuma conexão encontrada. Adicione uma nova conexão para começar."
          );
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!mounted) return;

        // Normalizar: API pode retornar um array ou um único objeto
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && typeof data === "object") {
          if (Array.isArray(data.conexoes)) list = data.conexoes;
          else if (Array.isArray(data.data)) list = data.data;
          else if (Object.keys(data).length === 0) list = [];
          else list = [data];
        } else {
          list = [];
        }

        // Ordenar do mais recente para o mais antigo por `created_at` (se disponível)
        list.sort((a, b) => {
          const da =
            Number(
              new Date(a?.created_at ?? a?.createdAt ?? a?.created ?? 0)
            ) || 0;
          const db =
            Number(
              new Date(b?.created_at ?? b?.createdAt ?? b?.created ?? 0)
            ) || 0;
          return db - da;
        });

        // Filtrar apenas conexões que NÃO têm atendente_id vinculado
        const conexoesSemAtendente = list.filter((conn) => !conn.atendente_id);

        setConnections(conexoesSemAtendente);
      } catch (err) {
        if (!mounted) return;
        setError(
          (err && err.message) ||
            "Erro ao carregar conexões. Verifique a API (pode estar vazia ou indisponível)."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchConexoes();
    return () => (mounted = false);
  }, []);

  // Usaremos os campos exatamente como no JSON: id, created_at, nome, telefone, url, tipo

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        nome: form.nome,
        telefone: form.telefone,
        url: form.url,
        tipo: form.tipo,
        categoria: form.categoria,
      };
      if (form.tipo === "Oficial") {
        // incluir whatsapp_number_id, waba_id e business_id para conexões oficiais
        if (form.whatsapp_number_id)
          body.whatsapp_number_id = form.whatsapp_number_id;
        if (form.waba_id) body.waba_id = form.waba_id;
        if (form.business_id) body.business_id = form.business_id;
      }
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      // Atualiza lista: concatena o novo item (assume que API retorna o recurso criado)
      setConnections((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({
        nome: "",
        telefone: "",
        url: "",
        tipo: "Não oficial",
        categoria: "Número atendente",
        whatsapp_number_id: "",
        waba_id: "",
        business_id: "",
      });
    } catch (err) {
      alert("Falha ao criar conexão: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    const confirmDel = window.confirm("Deseja excluir esta conexão?");
    if (!confirmDel) return;

    try {
      const res = await fetch(API_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConnections((prev) =>
        prev.filter((c) => String(c.id ?? c._id ?? "") !== String(id))
      );
    } catch (err) {
      alert("Falha ao excluir: " + (err.message || err));
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
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
        >
          Disparos
        </Link>

        <Link
          href="/disparos"
          className="text-center w-36 p-1 rounded-xl  bg-fuchsia-900 text-white font-semibold hover:opacity-50 cursor-pointer"
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

      <section className="max-w-6xl mx-auto mt-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800">
            Conexões Whatsapp
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500">
              Gerencie suas conexões ativas e desconecte quando necessário.
            </p>
            <a
              href="https://app.chakrahq.com/admin/plugins"
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:opacity-90"
            >
              Criar instância (Coexistência)
            </a>

            <button
              onClick={() => setShowForm(true)}
              className="cursor-pointer px-3 py-2 rounded-lg bg-fuchsia-900 text-white text-sm"
            >
              Nova conexão
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-700" />
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">Erro: {error}</div>
          ) : connections.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Nenhuma conexão encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn, idx) => {
                // Usar somente os campos do JSON: id, created_at, nome, telefone, url, tipo
                const id = conn.id ?? conn._id ?? idx;
                const nome = conn.nome ?? "";
                const telefone = conn.telefone ?? "";
                const url = conn.url ?? "";
                const tipo = (conn.tipo ?? "").toString();
                const whatsapp_number_id =
                  conn.whatsapp_number_id ?? conn.whatsappNumberId ?? "";
                const waba_id = conn.waba_id ?? conn.wabaID ?? "";
                const createdAt = conn.created_at ?? null;
                const isOficial = tipo === "Oficial";
                const categoria = conn.categoria ?? "atendente";

                return (
                  <article
                    key={id}
                    className="p-6 bg-gradient-to-br from-white to-fuchsia-50 rounded-xl border border-slate-100 shadow-sm overflow-hidden relative"
                  >
                    {/* botão de excluir movido para a área de ações */}
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 rounded-lg bg-fuchsia-700 flex items-center justify-center text-white text-xl font-bold">
                        {(nome || "?").slice(0, 1)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <h3
                              title={nome}
                              className="text-lg font-semibold text-slate-800 break-words leading-snug"
                            >
                              {nome}
                            </h3>
                            {createdAt && (
                              <p className="text-xs text-slate-500">
                                Criado em:{" "}
                                {new Date(createdAt).toLocaleString("pt-BR", {
                                  timeZone: "America/Cuiaba",
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mt-2">
                          Telefone:{" "}
                          <span className="font-medium text-slate-800 break-words">
                            {telefone}
                          </span>
                        </p>
                        {isOficial && (
                          <>
                            <p className="text-sm text-slate-600 mt-1">
                              Whatsapp Number ID:{" "}
                              <span className="font-medium text-slate-800 break-words">
                                {whatsapp_number_id || "—"}
                              </span>
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              WABA ID:{" "}
                              <span className="font-medium text-slate-800 break-words">
                                {waba_id || "—"}
                              </span>
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              Tipo:{" "}
                              <span className="font-medium text-slate-800">
                                {tipo || "Não informado"}
                              </span>
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              Categoria:{" "}
                              <span className="font-medium text-slate-800">
                                { categoria.charAt(0).toUpperCase() + categoria.slice(1) || "Não informado"}
                              </span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg bg-fuchsia-900 text-white font-medium hover:opacity-90"
                      >
                        Acessar conexão
                      </a>
                      {waba_id && (
                        <a
                          href={`https://business.facebook.com/latest/whatsapp_manager/insights?business_id=383816398355488&asset_id=${waba_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-lg bg-blue-600 text-white font-medium hover:opacity-90 flex items-center gap-2"
                          title="Ver Insights da Meta"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                          Relatórios
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(id)}
                        className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7m5 4v6m4-6v6M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
                          />
                        </svg>
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal/Form para nova conexão */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl p-6 w-11/12 max-w-lg shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-black">
                Adicionar nova conexão
              </h2>
            </div>

            <label className="block mb-2 text-sm text-slate-600">Nome</label>
            <input
              required
              value={form.nome}
              onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
              placeholder="Digite o nome da conexão"
            />

            <label className="block mb-2 text-sm text-slate-600">
              Telefone
            </label>
            <input
              required
              value={form.telefone}
              onChange={(e) =>
                setForm((s) => ({ ...s, telefone: e.target.value }))
              }
              className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
              placeholder="+55 65 9xxxx-xxxx"
            />

            <label className="block mb-2 text-sm text-slate-600">
              Tipo de conexão
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800"
            >
              <option>Não oficial</option>
              <option>Oficial</option>
            </select>

            <label className="block mb-2 text-sm text-slate-600">
              Categoria do Whatsapp
            </label>
            <select
              value={form.categoria}
              onChange={(e) => setForm((s) => ({ ...s, categoria: e.target.value }))}
              className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800"
            >
              <option>Número principal</option>
              <option>Número atendente</option>
            </select>

            {form.tipo === "Oficial" && (
              <>
                <label className="block mb-2 text-sm text-slate-600">
                  Whatsapp Number ID
                </label>
                <input
                  required
                  value={form.whatsapp_number_id}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      whatsapp_number_id: e.target.value,
                    }))
                  }
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
                  placeholder="ID do número do Whatsapp (ex: 1163646225183556)"
                />

                <label className="block mb-2 text-sm text-slate-600">
                  WABA ID
                </label>
                <input
                  required
                  value={form.waba_id}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      waba_id: e.target.value,
                    }))
                  }
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
                  placeholder="WhatsApp Business Account ID (ex: 103966842495940)"
                />

                <label className="block mb-2 text-sm text-slate-600">
                  Business ID
                </label>
                <input
                  value={form.business_id}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, business_id: e.target.value }))
                  }
                  className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
                  placeholder="ID do Business Manager (ex: 383816398355488)"
                />
              </>
            )}

            <label className="block mb-2 text-sm text-slate-600">
              Link de acesso a plataforma (url)
            </label>
            <input
              required
              value={form.url}
              onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
              className="w-full mb-4 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400"
              placeholder="https://app.chakrahq.com/..."
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cursor-pointer px-4 py-2 rounded-lg bg-slate-100 text-slate-700"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer px-4 py-2 rounded-lg bg-fuchsia-900 text-white"
              >
                {submitting ? "Enviando..." : "Adicionar conexão"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
