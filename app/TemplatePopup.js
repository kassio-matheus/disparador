import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import Popup from "reactjs-popup";

export default function TemplatesPopup({
  templatePopup,
  setTemplatePopup,
  templates,
  nextCursor,
  loading,
  loader,
  setTemplate,
  atendentes,
}) {
  const [search, setSearch] = useState("");
  const [filteredTemplates, setFilteredTemplates] = useState(templates);

  // Atualiza a filtragem sempre que o usuário digita ou os templates mudam
  useEffect(() => {
    if (!search.trim()) {
      setFilteredTemplates(templates);
    } else {
      const lower = search.toLowerCase();
      setFilteredTemplates(
        templates.filter((item) => {
          const nameMatch = item.name?.toLowerCase().includes(lower);
          const body = item.components.find((i) => i.type === "BODY")?.text;
          const bodyMatch = body?.toLowerCase().includes(lower);
          const categoryMatch = item.category?.toLowerCase().includes(lower);
          return nameMatch || bodyMatch || categoryMatch;
        })
      );
    }
  }, [search, templates]);

  return (
    <Popup
      open={templatePopup}
      modal
      closeOnDocumentClick
      onClose={() => setTemplatePopup(false)}
      contentStyle={{
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
      }}
    >
      {(close) => (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
          onClick={close} // fecha ao clicar no fundo
        >
          <div
            className="rounded-2xl bg-white p-8 shadow-lg w-[60vh] max-h-[80vh] overflow-y-auto grid gap-2"
            onClick={(e) => e.stopPropagation()} // impede fechamento ao clicar na box
          >
            <h2 className="text-xl text-left font-semibold text-black">
              Templates do Whatsapp
            </h2>

            <p className="text-left text-gray-500">
              Selecione o template do whatsapp que você deseja enviar.
            </p>

            <Link
              href="/templates"
              className="text-center w-full p-2 bg-purple-100 border border-purple-200 text-black font-medium rounded-xl cursor-pointer hover:opacity-50"
            >
              + Criar novo template
            </Link>

            <input
              className="bg-gray-100 border border-gray-300 text-black pl-3 w-full h-10 rounded-xl focus:border-purple-800 outline-none"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <section className="grid gap-4 content-start w-full mt-4">
              {filteredTemplates.length > 0
                ? filteredTemplates.map((item) => {
                    // Atendentes disponíveis para este template
                    const availableAtendentes = item.atendente_ids || [
                      item.atendente_id,
                    ];
                    const atendenteNames = item.atendente_nomes || [
                      item.atendente_nome,
                    ];
                    const wabaIds = item.waba_ids || [item.waba_id];

                    // Verificar status por conexão
                    const conexoesComStatus = [];
                    if (item.waba_ids && item.atendente_nomes) {
                      const statuses = item.statuses || []; // Array de status por waba_id
                      item.waba_ids.forEach((waba_id, idx) => {
                        const atendente = atendentes.find(
                          (a) => a.waba_id === waba_id
                        );
                        if (atendente) {
                          conexoesComStatus.push({
                            waba_id,
                            nome: atendente.nome,
                            status: statuses[idx] || item.status || "APPROVED", // Usar status do array
                          });
                        }
                      });
                    } else if (item.waba_id) {
                      const atendente = atendentes.find(
                        (a) => a.waba_id === item.waba_id
                      );
                      if (atendente) {
                        conexoesComStatus.push({
                          waba_id: item.waba_id,
                          nome: atendente.nome,
                          status: item.status || "APPROVED",
                        });
                      }
                    }

                    return (
                      <div
                        key={item.id}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-fuchsia-500 hover:shadow-md transition cursor-pointer"
                        onClick={() => {
                          setTemplate(item);
                          setTemplatePopup(false);
                        }}
                      >
                        <div className="p-4 space-y-3">
                          {/* Cabeçalho */}
                          <div className="flex items-start justify-between">
                            <h1 className="text-black font-semibold text-lg flex-1">
                              {item.name}
                            </h1>
                            <span
                              className={`px-3 py-1 text-xs rounded-lg font-semibold whitespace-nowrap ${
                                item.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.status === "APPROVED"
                                ? "✓ Aprovado"
                                : item.status === "PENDING"
                                ? "⏳ Pendente"
                                : "✗ Rejeitado"}
                            </span>
                          </div>

                          {/* Preview estilo WhatsApp */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Header do WhatsApp */}
                            <div className="bg-[#075e54] px-3 py-2 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm">
                                👤
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-xs">
                                  Preview
                                </p>
                                <p className="text-gray-200 text-[10px]">
                                  online
                                </p>
                              </div>
                            </div>

                            {/* Mensagem */}
                            <div
                              className="p-3"
                              style={{
                                backgroundImage:
                                  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAwTDQwIDQwTTQwIDBMMCA0MCIgc3Ryb2tlPSIjZTBlMGUwIiBzdHJva2Utd2lkdGg9IjAuNSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')",
                                backgroundColor: "#efeae2",
                              }}
                            >
                              <div className="bg-white rounded-lg rounded-tl-none shadow-sm max-w-[90%]">
                                {/* Header do template */}
                                {(() => {
                                  const headerComp = item.components?.find(
                                    (c) => c.type === "HEADER"
                                  );
                                  if (
                                    headerComp?.format === "TEXT" &&
                                    headerComp.text
                                  ) {
                                    return (
                                      <div className="px-2 pt-2 pb-1">
                                        <p className="font-bold text-xs text-gray-900">
                                          {headerComp.text}
                                        </p>
                                      </div>
                                    );
                                  }
                                  if (headerComp?.format === "IMAGE") {
                                    return (
                                      <div className="bg-gray-200 w-full h-20 rounded-t-lg flex items-center justify-center">
                                        <span className="text-gray-500 text-[10px]">
                                          🖼️ Imagem
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Body */}
                                {(() => {
                                  const bodyComp = item.components?.find(
                                    (c) => c.type === "BODY"
                                  );
                                  if (bodyComp?.text) {
                                    return (
                                      <div className="px-2 py-2">
                                        <p className="text-[11px] text-gray-800 whitespace-pre-wrap leading-tight">
                                          {bodyComp.text
                                            .replace(/\{\{nome\}\}/g, "[Nome]")
                                            .slice(0, 120)}
                                          {bodyComp.text.length > 120 && "..."}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Footer */}
                                {(() => {
                                  const footerComp = item.components?.find(
                                    (c) => c.type === "FOOTER"
                                  );
                                  if (footerComp?.text) {
                                    return (
                                      <div className="px-2 pb-1">
                                        <p className="text-[9px] text-gray-500">
                                          {footerComp.text}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Buttons */}
                                {(() => {
                                  const buttonsComp = item.components?.find(
                                    (c) => c.type === "BUTTONS"
                                  );
                                  if (buttonsComp?.buttons?.length > 0) {
                                    return (
                                      <div className="border-t border-gray-200">
                                        {buttonsComp.buttons
                                          .slice(0, 2)
                                          .map((btn, idx) => (
                                            <div
                                              key={idx}
                                              className="px-2 py-1.5 text-center border-b border-gray-200 last:border-0"
                                            >
                                              <p className="text-[10px] text-blue-600 font-medium">
                                                {btn.type === "PHONE_NUMBER" &&
                                                  "📞 "}
                                                {btn.type === "URL" && "🔗 "}
                                                {btn.text}
                                              </p>
                                            </div>
                                          ))}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Timestamp */}
                                <div className="px-2 pb-1 flex justify-end">
                                  <span className="text-[8px] text-gray-500">
                                    {new Date().toLocaleTimeString("pt-BR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Categoria */}
                          <p className="text-gray-500 text-xs">
                            <span className="font-semibold">Categoria:</span>{" "}
                            {item.category}
                          </p>

                          {/* Mostrar atendentes/conexões com status */}
                          {conexoesComStatus.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs text-gray-600 font-semibold">
                                Disponível em:
                              </span>
                              <div className="grid grid-cols-1 gap-2">
                                {conexoesComStatus.map((conn, idx) => (
                                  <div
                                    key={idx}
                                    className={`px-3 py-2 rounded-lg border-l-4 flex items-center justify-between ${
                                      conn.status === "APPROVED"
                                        ? "bg-green-50 border-green-500"
                                        : conn.status === "PENDING"
                                        ? "bg-yellow-50 border-yellow-500"
                                        : "bg-red-50 border-red-500"
                                    }`}
                                  >
                                    <span
                                      className={`text-xs font-semibold ${
                                        conn.status === "APPROVED"
                                          ? "text-green-800"
                                          : conn.status === "PENDING"
                                          ? "text-yellow-800"
                                          : "text-red-800"
                                      }`}
                                    >
                                      {conn.nome}
                                    </span>
                                    <span
                                      className={`text-xs font-bold ${
                                        conn.status === "APPROVED"
                                          ? "text-green-700"
                                          : conn.status === "PENDING"
                                          ? "text-yellow-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {conn.status === "APPROVED"
                                        ? "✓ Aprovado"
                                        : conn.status === "PENDING"
                                        ? "⏳ Pendente"
                                        : "✗ Rejeitado"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                : !loading && (
                    <p className="text-gray-500 text-center mt-8">
                      Nenhum template encontrado 😕
                    </p>
                  )}
            </section>

            {loading && (
              <div className="text-center text-gray-500 mt-8">
                Carregando...
              </div>
            )}

            {!nextCursor && !loading && filteredTemplates.length > 0 && (
              <p className="text-center text-gray-400 mt-8">
                Você chegou ao fim 🎉
              </p>
            )}

            {/* Loader invisível no final para acionar o scroll infinito */}
            <div ref={loader} className="h-8" />
          </div>
        </div>
      )}
    </Popup>
  );
}
