#!/usr/bin/env python3
import re

# Ler o arquivo
with open('app/form.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Encontrar e remover a seção antiga de Fracionamento
# Procurar por "/* Fracionamento de Disparo */" até "/* Inputs de Limite Individual por Atendente */"
pattern_remove = r'(\s*{/\* Fracionamento de Disparo \*/}.*?(?={/\* Inputs de Limite Individual por Atendente \*/}))'
content = re.sub(pattern_remove, '\n', content, flags=re.DOTALL)

# 2. Adicionar fracionamento no payload
# Encontrar "hasName: Boolean(hasName)," e adicionar depois
old_payload = r'(hasName: Boolean\(hasName\),)\s*\n(\s*)(};)'
new_payload = r'''\1
\2fracionamento: fracionamentoAtivo ? {
\2  ativo: true,
\2  leads_por_lote: Number(leadsPorLote),
\2  pausa_segundos: (Number(pausaHoras || 0) * 3600) + (Number(pausaMinutos || 0) * 60) + Number(pausaSegundos || 0),
\2} : {
\2  ativo: false,
\2},
\2\3'''

content = re.sub(old_payload, new_payload, content)

# 3. Adicionar nova seção de fracionamento após quantidade de leads no modo geral
# Procurar pelo final da seção de quantidade de leads modo geral
insert_after = r'(funil\?\.value && etapas\.length !== 0 && modoLimite === "geral" &&[^}]*</div>\s*\n\s*</div>\s*\n\s*\}\)}'

new_fracionamento_section = r'''

          {/* Fracionamento de Disparo */}
          {funil?.value &&
            etapas.length !== 0 &&
            selectedAtendentes.length > 0 &&
            limites > 0 && (
              <div className="grid w-full gap-4 bg-gradient-to-br from-purple-50 to-fuchsia-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-2.5 rounded-xl shadow-md">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <label className="block font-bold text-lg text-gray-800">
                        Fracionamento de Disparo
                      </label>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Divida o envio em lotes menores com pausas entre eles
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFracionamentoAtivo(!fracionamentoAtivo);
                      if (fracionamentoAtivo) {
                        setLeadsPorLote("");
                        setPausaHoras("");
                        setPausaMinutos("");
                        setPausaSegundos("");
                      }
                    }}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-2 shadow-md ${
                      fracionamentoAtivo
                        ? "bg-gradient-to-r from-purple-500 to-fuchsia-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
                        fracionamentoAtivo ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {fracionamentoAtivo && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Leads por Lote */}
                    <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                        Leads por Lote
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={limites}
                        value={leadsPorLote}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === "" ||
                            (Number(val) > 0 && Number(val) <= limites)
                          ) {
                            setLeadsPorLote(val);
                          }
                        }}
                        placeholder="Ex: 50"
                        className="w-full border-2 border-purple-200 p-3 rounded-lg text-black font-semibold text-center text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      />
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Máximo: {limites} leads
                      </p>
                    </div>

                    {/* Tempo de Pausa */}
                    <div className="bg-white p-4 rounded-xl border border-fuchsia-200 shadow-sm">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
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
                        Tempo de Pausa
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={pausaHoras}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (Number(val) >= 0 && Number(val) <= 23)) {
                                setPausaHoras(val);
                              }
                            }}
                            placeholder="0"
                            className="w-full border-2 border-fuchsia-200 p-3 rounded-lg text-black font-semibold text-center text-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition"
                          />
                          <p className="text-xs text-gray-500 mt-1 text-center">Horas</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={pausaMinutos}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
                                setPausaMinutos(val);
                              }
                            }}
                            placeholder="0"
                            className="w-full border-2 border-fuchsia-200 p-3 rounded-lg text-black font-semibold text-center text-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition"
                          />
                          <p className="text-xs text-gray-500 mt-1 text-center">Minutos</p>
                        </div>
                        <div>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={pausaSegundos}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "" || (Number(val) >= 0 && Number(val) <= 59)) {
                                setPausaSegundos(val);
                              }
                            }}
                            placeholder="0"
                            className="w-full border-2 border-fuchsia-200 p-3 rounded-lg text-black font-semibold text-center text-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition"
                          />
                          <p className="text-xs text-gray-500 mt-1 text-center">Segundos</p>
                        </div>
                      </div>
                    </div>

                    {/* Preview do Fracionamento */}
                    {leadsPorLote && ((pausaHoras && Number(pausaHoras) > 0) || (pausaMinutos && Number(pausaMinutos) > 0) || (pausaSegundos && Number(pausaSegundos) > 0)) && (
                      <div className="bg-gradient-to-r from-purple-100 to-fuchsia-100 p-4 rounded-xl border border-purple-300">
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg">
                            <svg
                              className="w-5 h-5 text-purple-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-800 mb-2">
                              📊 Preview do Fracionamento
                            </h4>
                            <div className="space-y-1.5 text-sm">
                              <p className="text-gray-700">
                                <span className="font-semibold text-purple-700">
                                  {Math.ceil(
                                    (modoLimite === "geral"
                                      ? quantidade === "" || quantidade === "0" || quantidade === 0
                                        ? limites
                                        : Number(quantidade)
                                      : (() => {
                                          let total = 0;
                                          selectedAtendentes.forEach((id) => {
                                            const limite = Number(limitesIndividuais[id] || 0);
                                            const maxDisponivel = Number(atendenteCounts[id] || 0);
                                            total += limite === 0 ? maxDisponivel : limite;
                                          });
                                          return total;
                                        })()) / Number(leadsPorLote)
                                  )} lotes
                                </span>{" "}
                                de{" "}
                                <span className="font-semibold text-fuchsia-700">
                                  {leadsPorLote} leads
                                </span>{" "}
                                cada
                              </p>
                              <p className="text-gray-700">
                                ⏱️ Pausa de{" "}
                                <span className="font-semibold text-fuchsia-700">
                                  {(() => {
                                    const h = Number(pausaHoras || 0);
                                    const m = Number(pausaMinutos || 0);
                                    const s = Number(pausaSegundos || 0);
                                    const parts = [];
                                    if (h > 0) parts.push(`${h}h`);
                                    if (m > 0) parts.push(`${m}min`);
                                    if (s > 0) parts.push(`${s}s`);
                                    return parts.join(" ");
                                  })()}
                                </span>{" "}
                                entre lotes
                              </p>
                              <p className="text-gray-700">
                                ⏳ Tempo total estimado:{" "}
                                <span className="font-semibold text-purple-700">
                                  {(() => {
                                    const totalLeads = modoLimite === "geral"
                                      ? quantidade === "" || quantidade === "0" || quantidade === 0
                                        ? limites
                                        : Number(quantidade)
                                      : (() => {
                                          let total = 0;
                                          selectedAtendentes.forEach((id) => {
                                            const limite = Number(limitesIndividuais[id] || 0);
                                            const maxDisponivel = Number(atendenteCounts[id] || 0);
                                            total += limite === 0 ? maxDisponivel : limite;
                                          });
                                          return total;
                                        })();
                                    const numLotes = Math.ceil(totalLeads / Number(leadsPorLote));
                                    const pausaSegundosTotal = (Number(pausaHoras || 0) * 3600) + (Number(pausaMinutos || 0) * 60) + Number(pausaSegundos || 0);
                                    const tempoTotalSegundos = (numLotes - 1) * pausaSegundosTotal;
                                    const horas = Math.floor(tempoTotalSegundos / 3600);
                                    const minutos = Math.floor((tempoTotalSegundos % 3600) / 60);
                                    const segundos = tempoTotalSegundos % 60;
                                    const parts = [];
                                    if (horas > 0) parts.push(`${horas}h`);
                                    if (minutos > 0) parts.push(`${minutos}min`);
                                    if (segundos > 0) parts.push(`${segundos}s`);
                                    return parts.join(" ");
                                  })()}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-xs text-amber-800">
                        <strong>Atenção:</strong> O disparo será executado em
                        lotes com pausas automáticas. Certifique-se de que o
                        sistema permaneça ativo durante todo o processo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}'''

content = re.sub(insert_after, r'\1' + new_fracionamento_section, content)

# Salvar o arquivo
with open('app/form.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Arquivo atualizado com sucesso!")
