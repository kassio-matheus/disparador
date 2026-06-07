"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCookie } from "cookies-next";

export default function AtendentesPage() {
  const router = useRouter();

  // Estados principais
  const [atendentes, setAtendentes] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConexoes, setLoadingConexoes] = useState(false);

  // Estados do formulário
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [atendenteId, setAtendenteId] = useState("");
  const [wabaIdSelecionado, setWabaIdSelecionado] = useState("");

  // Busca e filtros
  const [buscaAtendente, setBuscaAtendente] = useState("");

  // Notificações
  const [notificacao, setNotificacao] = useState(null);

  // Modal de detalhes
  const [atendenteSelecionado, setAtendenteSelecionado] = useState(null);

  // Modal de edição
  const [atendenteParaEditar, setAtendenteParaEditar] = useState(null);
  const [editando, setEditando] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAtendenteId, setEditAtendenteId] = useState("");
  const [editWabaId, setEditWabaId] = useState("");

  // Modal de exclusão
  const [atendenteParaExcluir, setAtendenteParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  async function LogOut() {
    await deleteCookie("auth_token");
    router.push("/login");
  }

  // Buscar conexões disponíveis
  useEffect(() => {
    async function fetchConexoes() {
      setLoadingConexoes(true);
      try {
        const res = await fetch(
          "https://frutosdoacai.up.railway.app/webhook/conexoes"
        );
        if (res.ok) {
          const data = await res.json();
          let list = Array.isArray(data) ? data : [];
          const oficiais = list.filter((c) => c.tipo === "Oficial");
          setConexoes(oficiais);
        }
      } catch (err) {
        console.error("Erro ao carregar conexões:", err);
      } finally {
        setLoadingConexoes(false);
      }
    }
    fetchConexoes();
    buscarAtendentes();
  }, []);

  // Buscar atendentes
  async function buscarAtendentes() {
    setLoading(true);
    try {
      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/atendentes"
      );
      if (res.ok) {
        const data = await res.json();
        setAtendentes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar atendentes:", err);
    } finally {
      setLoading(false);
    }
  }

  // Criar novo atendente
  async function handleSubmit(e) {
    e.preventDefault();

    if (!nome || !email || !atendenteId) {
      setNotificacao({
        tipo: "erro",
        titulo: "Campos obrigatórios",
        mensagem: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nome,
        email,
        atendente_id: atendenteId,
        waba_id: wabaIdSelecionado || null,
      };

      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/atendentes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const novoAtendente = await res.json();

        // Se houver waba_id, atualizar a conexão correspondente
        if (wabaIdSelecionado && novoAtendente.id) {
          try {
            await fetch(
              "https://frutosdoacai.up.railway.app/webhook/conexoes",
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  waba_id: wabaIdSelecionado,
                  atendente_id: novoAtendente.id,
                }),
              }
            );
          } catch (err) {
            console.error("Erro ao atualizar conexão:", err);
          }
        }

        setAtendentes((prev) => [novoAtendente, ...prev]);
        setMostrarFormulario(false);
        setNome("");
        setEmail("");
        setAtendenteId("");
        setWabaIdSelecionado("");
        setNotificacao({
          tipo: "sucesso",
          titulo: "Atendente criado",
          mensagem: `Atendente "${nome}" foi criado com sucesso!`,
        });
      } else {
        const error = await res.json();
        setNotificacao({
          tipo: "erro",
          titulo: "Erro ao criar atendente",
          mensagem: error.message || "Não foi possível criar o atendente.",
        });
      }
    } catch (err) {
      console.error("Erro ao criar atendente:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem: "Não foi possível criar o atendente. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Editar atendente
  async function handleEditarAtendente(e) {
    e.preventDefault();

    if (!editNome || !editEmail || !editAtendenteId) {
      setNotificacao({
        tipo: "erro",
        titulo: "Campos obrigatórios",
        mensagem: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    setEditando(true);
    try {
      const payload = {
        id: atendenteParaEditar.id,
        nome: editNome,
        email: editEmail,
        atendente_id: editAtendenteId,
        waba_id: editWabaId || null,
      };

      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/atendentes",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setNotificacao({
          tipo: "sucesso",
          titulo: "Atendente atualizado",
          mensagem: "Atendente atualizado com sucesso!",
        });

        setAtendenteParaEditar(null);
        setTimeout(() => buscarAtendentes(), 1000);
      } else {
        const error = await res.json();
        setNotificacao({
          tipo: "erro",
          titulo: "Erro ao atualizar",
          mensagem: error.message || "Não foi possível atualizar o atendente.",
        });
      }
    } catch (err) {
      console.error("Erro ao editar atendente:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem: "Não foi possível atualizar o atendente.",
      });
    } finally {
      setEditando(false);
    }
  }

  // Excluir atendente
  async function handleExcluirAtendente() {
    if (!atendenteParaExcluir) return;

    setExcluindo(true);
    try {
      const res = await fetch(
        "https://frutosdoacai.up.railway.app/webhook/atendentes",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: atendenteParaExcluir.id }),
        }
      );

      if (res.ok) {
        setNotificacao({
          tipo: "sucesso",
          titulo: "Atendente excluído",
          mensagem: "Atendente excluído com sucesso!",
        });

        setAtendenteParaExcluir(null);
        setTimeout(() => buscarAtendentes(), 1000);
      } else {
        const error = await res.json();
        setNotificacao({
          tipo: "erro",
          titulo: "Erro ao excluir",
          mensagem: error.message || "Não foi possível excluir o atendente.",
        });
      }
    } catch (err) {
      console.error("Erro ao excluir atendente:", err);
      setNotificacao({
        tipo: "erro",
        titulo: "Erro inesperado",
        mensagem: "Não foi possível excluir o atendente.",
      });
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="min-h-screen items-center content-center bg-slate-100">
      {/* Notificação */}
      {notificacao && (
        <div
          className="fixed top-6 right-6 z-50 max-w-md p-4 rounded-xl shadow-2xl border-2 animate-slide-in"
          style={{
            backgroundColor:
              notificacao.tipo === "sucesso"
                ? "#d4edda"
                : notificacao.tipo === "erro"
                ? "#f8d7da"
                : "#fff3cd",
            borderColor:
              notificacao.tipo === "sucesso"
                ? "#28a745"
                : notificacao.tipo === "erro"
                ? "#dc3545"
                : "#ffc107",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-800">
                {notificacao.titulo}
              </h3>
              <p className="text-gray-700 mt-1 whitespace-pre-line">
                {notificacao.mensagem}
              </p>
            </div>
            <button
              onClick={() => setNotificacao(null)}
              className="ml-4 text-gray-600 hover:text-gray-800 font-bold text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
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
          className="text-center w-36 p-1 rounded-xl bg-none border border-gray-300 text-gray-700 font-semibold hover:opacity-50 cursor-pointer"
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
          className="text-center w-36 p-1 rounded-xl bg-fuchsia-900 text-white font-semibold hover:opacity-50 cursor-pointer"
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
        {/* Header da Seção */}
        <div className="mb-8 bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-fuchsia-900">
                Gerenciar Atendentes
              </h1>
              <p className="text-gray-600 mt-2">
                Visualize e gerencie os atendentes do sistema
              </p>
            </div>

            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-6 py-3 bg-fuchsia-700 text-white font-semibold rounded-xl hover:bg-fuchsia-800 transition shadow-md"
            >
              {mostrarFormulario ? "✕ Cancelar" : "+ Novo Atendente"}
            </button>
          </div>

          {/* Busca */}
          <input
            type="text"
            placeholder="🔍 Buscar atendente por nome, email ou ID..."
            value={buscaAtendente}
            onChange={(e) => setBuscaAtendente(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        {/* Formulário de Criação */}
        {mostrarFormulario && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 bg-white p-8 rounded-2xl shadow-md"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Criar Novo Atendente
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: joao@frutosdoacai.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  required
                />
              </div>

              {/* ID do RD Station */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  ID do Atendente no RD Station{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={atendenteId}
                  onChange={(e) => setAtendenteId(e.target.value)}
                  placeholder="Ex: 6130429a380edb00129c7c05"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  required
                />
              </div>

              {/* Conexão WhatsApp */}
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Conexão WhatsApp (Opcional)
                </label>
                {loadingConexoes ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-400">
                    Carregando conexões...
                  </div>
                ) : (
                  <select
                    value={wabaIdSelecionado}
                    onChange={(e) => setWabaIdSelecionado(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="">Nenhuma conexão (sem WhatsApp)</option>
                    {conexoes.map((conexao) => (
                      <option key={conexao.id} value={conexao.waba_id}>
                        {conexao.nome} - {conexao.telefone}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Vincule o atendente a uma conexão WhatsApp Business. Uma mesma
                  conexão pode ter múltiplos atendentes.
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                  submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-fuchsia-700 hover:bg-fuchsia-800"
                }`}
              >
                {submitting ? "Criando..." : "Criar Atendente"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setNome("");
                  setEmail("");
                  setAtendenteId("");
                  setWabaIdSelecionado("");
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de Atendentes */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Atendentes Cadastrados ({atendentes.length})
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 mt-4">Carregando atendentes...</p>
            </div>
          ) : atendentes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">Nenhum atendente cadastrado</p>
              <p className="text-sm mt-2">
                Crie seu primeiro atendente clicando no botão acima
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {atendentes
                .filter((atendente) => {
                  if (!buscaAtendente) return true;
                  const searchLower = buscaAtendente.toLowerCase();
                  return (
                    atendente.nome?.toLowerCase().includes(searchLower) ||
                    atendente.email?.toLowerCase().includes(searchLower) ||
                    atendente.atendente_id?.toLowerCase().includes(searchLower)
                  );
                })
                .map((atendente) => {
                  // Buscar conexão vinculada
                  const conexaoVinculada = atendente.waba_id
                    ? conexoes.find((c) => c.waba_id === atendente.waba_id)
                    : null;

                  return (
                    <div
                      key={atendente.id}
                      className="p-5 border-2 border-gray-200 rounded-xl hover:border-fuchsia-500 hover:shadow-lg transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3
                            onClick={() => setAtendenteSelecionado(atendente)}
                            className="font-bold text-lg text-gray-800 cursor-pointer hover:text-fuchsia-600 transition"
                          >
                            {atendente.nome}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {atendente.email}
                          </p>
                        </div>

                        {/* Badge de status */}
                        <div>
                          {atendente.waba_id ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                              ✓ Conectado
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                              Sem conexão
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-gray-500 min-w-[80px]">
                            ID RD:
                          </span>
                          <span className="text-xs text-gray-700 break-all">
                            {atendente.atendente_id}
                          </span>
                        </div>

                        {conexaoVinculada && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs font-semibold text-green-800 mb-1">
                              📞 Conexão WhatsApp:
                            </p>
                            <p className="text-xs text-green-700">
                              {conexaoVinculada.nome}
                            </p>
                            <p className="text-xs text-green-600">
                              {conexaoVinculada.telefone}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAtendenteParaEditar(atendente);
                            setEditNome(atendente.nome);
                            setEditEmail(atendente.email);
                            setEditAtendenteId(atendente.atendente_id);
                            setEditWabaId(atendente.waba_id || "");
                          }}
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-200 transition"
                        >
                          ✏️ Editar
                        </button>

                        <button
                          onClick={() => setAtendenteParaExcluir(atendente)}
                          className="flex-1 px-3 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-200 transition"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </section>

      {/* Modal de Detalhes */}
      {atendenteSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAtendenteSelecionado(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {atendenteSelecionado.nome}
                  </h2>
                  {atendenteSelecionado.waba_id ? (
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      ✓ Conectado ao WhatsApp
                    </span>
                  ) : (
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-full">
                      Sem conexão WhatsApp
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setAtendenteSelecionado(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    Email
                  </p>
                  <p className="text-base text-gray-800">
                    {atendenteSelecionado.email}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-semibold text-gray-500 mb-1">
                    ID do Atendente (RD Station)
                  </p>
                  <p className="text-base text-gray-800 break-all">
                    {atendenteSelecionado.atendente_id}
                  </p>
                </div>

                {atendenteSelecionado.waba_id && (
                  <>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <p className="text-sm font-semibold text-green-700 mb-1">
                        WABA ID (WhatsApp Business Account)
                      </p>
                      <p className="text-base text-green-800 break-all">
                        {atendenteSelecionado.waba_id}
                      </p>
                    </div>

                    {conexoes.find(
                      (c) => c.waba_id === atendenteSelecionado.waba_id
                    ) && (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                        <p className="text-sm font-semibold text-green-800 mb-3">
                          📞 Conexão WhatsApp Vinculada
                        </p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs text-green-600">
                              Nome:
                            </span>
                            <p className="text-base text-green-800 font-medium">
                              {
                                conexoes.find(
                                  (c) =>
                                    c.waba_id === atendenteSelecionado.waba_id
                                ).nome
                              }
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-green-600">
                              Telefone:
                            </span>
                            <p className="text-base text-green-800 font-medium">
                              {
                                conexoes.find(
                                  (c) =>
                                    c.waba_id === atendenteSelecionado.waba_id
                                ).telefone
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {atendenteSelecionado.telefone && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-semibold text-gray-500 mb-1">
                      Telefone
                    </p>
                    <p className="text-base text-gray-800">
                      {atendenteSelecionado.telefone}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setAtendenteParaEditar(atendenteSelecionado);
                    setEditNome(atendenteSelecionado.nome);
                    setEditEmail(atendenteSelecionado.email);
                    setEditAtendenteId(atendenteSelecionado.atendente_id);
                    setEditWabaId(atendenteSelecionado.waba_id || "");
                    setAtendenteSelecionado(null);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  ✏️ Editar Atendente
                </button>

                <button
                  onClick={() => setAtendenteSelecionado(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-semibold"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {atendenteParaEditar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAtendenteParaEditar(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleEditarAtendente} className="p-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Editar Atendente
                </h2>

                <button
                  type="button"
                  onClick={() => setAtendenteParaEditar(null)}
                  className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    ID do Atendente (RD Station){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editAtendenteId}
                    onChange={(e) => setEditAtendenteId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Conexão WhatsApp (Opcional)
                  </label>
                  <select
                    value={editWabaId}
                    onChange={(e) => setEditWabaId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="">Nenhuma conexão</option>
                    {conexoes.map((conexao) => (
                      <option key={conexao.id} value={conexao.waba_id}>
                        {conexao.nome} - {conexao.telefone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={editando}
                  className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                    editando
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {editando ? "Salvando..." : "Salvar Alterações"}
                </button>

                <button
                  type="button"
                  onClick={() => setAtendenteParaEditar(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {atendenteParaExcluir && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setAtendenteParaExcluir(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Confirmar Exclusão
            </h2>

            <p className="text-gray-700 mb-2">
              Tem certeza que deseja excluir o atendente:
            </p>

            <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <p className="font-bold text-red-800">
                {atendenteParaExcluir.nome}
              </p>
              <p className="text-sm text-red-600">
                {atendenteParaExcluir.email}
              </p>
            </div>

            <p className="text-sm text-red-600 mb-6">
              ⚠️ Esta ação não pode ser desfeita!
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleExcluirAtendente}
                disabled={excluindo}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition ${
                  excluindo
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {excluindo ? "Excluindo..." : "Sim, Excluir"}
              </button>

              <button
                onClick={() => setAtendenteParaExcluir(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
