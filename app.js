// ---------- Formatação de moeda (máscara de input) ----------
function digitsToCents(str) {
  const digits = str.replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

function centsToBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function attachCurrencyMask(input) {
  input.addEventListener("input", () => {
    const cents = digitsToCents(input.value);
    input.value = cents === 0 ? "" : centsToBRL(cents);
  });
}

function getCents(input) {
  return digitsToCents(input.value);
}

// ---------- Número por extenso (Real brasileiro) ----------
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function threeDigitsToWords(num) {
  if (num === 0) return "";
  if (num === 100) return "cem";
  const c = Math.floor(num / 100);
  const r = num % 100;
  const parts = [];
  if (c > 0) parts.push(CENTENAS[c]);
  if (r > 0) {
    if (r < 10) parts.push(UNIDADES[r]);
    else if (r < 20) parts.push(DEZ_A_DEZENOVE[r - 10]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      parts.push(u === 0 ? DEZENAS[d] : `${DEZENAS[d]} e ${UNIDADES[u]}`);
    }
  }
  return parts.join(" e ");
}

const ESCALAS = [
  { valor: 1000000000000, singular: "trilhão", plural: "trilhões" },
  { valor: 1000000000, singular: "bilhão", plural: "bilhões" },
  { valor: 1000000, singular: "milhão", plural: "milhões" },
  { valor: 1000, singular: "mil", plural: "mil" },
];

function integerToWords(num) {
  if (num === 0) return "zero";
  let restante = num;
  const partes = [];

  for (const escala of ESCALAS) {
    const qtd = Math.floor(restante / escala.valor);
    if (qtd > 0) {
      if (escala.valor === 1000 && qtd === 1) {
        partes.push("mil");
      } else {
        const palavraEscala = qtd === 1 ? escala.singular : escala.plural;
        partes.push(`${threeDigitsToWords(qtd)} ${palavraEscala}`);
      }
      restante %= escala.valor;
    }
  }
  if (restante > 0) partes.push(threeDigitsToWords(restante));

  if (partes.length === 1) return partes[0];
  return partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1];
}

function valorPorExtenso(cents) {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;

  const partes = [];
  if (reais > 0) {
    partes.push(`${integerToWords(reais)} ${reais === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) {
    partes.push(`${integerToWords(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  if (partes.length === 0) return "zero reais";
  return partes.join(" e ");
}

function valorFormatado(cents) {
  return `${centsToBRL(cents)} (${valorPorExtenso(cents)})`;
}

// ---------- Textos dinâmicos conforme checkboxes ----------
function labelManutencao(preventiva, corretiva) {
  if (preventiva && corretiva) return "Manutenção Preventiva e Corretiva";
  if (preventiva) return "Manutenção Preventiva";
  return "Manutenção Corretiva";
}

function labelAtualizacao(software, capitalizado) {
  const prefixo = capitalizado ? "Atualizações" : "atualizações";
  return software ? `${prefixo} de Hardware e Software` : `${prefixo} de Hardware`;
}

function labelFornecimento(equipamentos, software) {
  if (equipamentos && software) return "dos Novos Equipamentos, Licenças";
  if (equipamentos) return "dos Novos Equipamentos";
  return "das Novas Licenças";
}

// ---------- Cálculo das respostas ----------
function calcularRespostas(custoCents, vendaCents, opts) {
  const round = (n) => Math.round(n);

  return [
    respostaCapex(vendaCents, opts),
    respostaManutencaoOpcional(round(vendaCents * 0.02 * 1.111), opts),
    respostaLocacao(24, round(custoCents * 0.111111111), opts),
    respostaLocacao(36, round(custoCents * 0.092165899), opts),
    respostaLocacao(48, round(custoCents * 0.078740157), opts),
    respostaLocacao(60, round(custoCents * 0.071684588), opts),
  ];
}

function respostaCapex(valorCents, opts) {
  const { servico, equipeDedicada, equipamentos, software } = opts;

  let bold1, meio;
  if (servico) {
    bold1 = `I. Valor para os Serviços de Instalação, Configuração e Implantação do sistema acima${equipeDedicada ? ", com Equipe Dedicada alocada no cliente" : ""}`;
    meio = " (inclui mão de obra especializada e acompanhamento técnico): ";
  } else {
    let alvo;
    if (equipamentos && software) alvo = "Todos os Equipamentos e Softwares Licenciados";
    else if (equipamentos) alvo = "Todos os Equipamentos";
    else alvo = "Todos os Softwares Licenciados";
    bold1 = `I. Valor para a Aquisição de ${alvo} para o sistema acima`;
    meio = " (inclui garantia balcão de 12 meses dos equipamentos instalados em caso de defeitos de fábrica): ";
  }

  return {
    tag: "Resposta 1 · Preço de Venda (CAPEX)",
    titulo: "Capex:",
    bold1,
    meio,
    valorCents,
    rodape: "*Conforme condições comerciais",
  };
}

function respostaManutencaoOpcional(valorCents, opts) {
  const { servico, software, pecas, preventiva, corretiva } = opts;

  const itens = [];
  if (!servico && pecas) itens.push("substituição de peças e acessórios");
  itens.push("limpeza");
  if (!servico) itens.push(labelAtualizacao(software));
  itens.push("Suporte Técnico");
  if (preventiva) itens.push("Manutenção Preventiva");
  if (corretiva) itens.push("Manutenção Corretiva");
  itens.push("deslocamentos e visitas técnicas de acordo com SLA");

  const naoIncluso = !servico && !pecas ? "; Não incluso substituição de peças e acessórios" : "";

  return {
    tag: "Resposta 2 · Manutenção Mensal Opcional (OPEX Opcional)",
    titulo: "Opex Opcional:",
    bold1: `II. OPCIONAL » Valor Mensal para ${labelManutencao(preventiva, corretiva)},`,
    meio: ` (Inclui ${itens.join(", ")}${naoIncluso}): `,
    valorCents,
    rodape: "*Este Valor deverá ser disponibilizado mensalmente pela Manutenção dos Equipamentos",
  };
}

function respostaLocacao(meses, valorCents, opts) {
  const { servico, equipeDedicada, equipamentos, software, pecas, preventiva, corretiva } = opts;
  const manutencao = labelManutencao(preventiva, corretiva);

  let bold1, itens, naoIncluso, rodape;

  if (servico) {
    bold1 = `III. Valor Mensal (${meses} Meses) para Prestação de Serviços de ${manutencao} de todos os itens desta proposta${equipeDedicada ? ", com Equipe Dedicada alocada no cliente" : ""},`;
    itens = ["Suporte Técnico", manutencao];
    naoIncluso = "";
    rodape = "* Este Valor deverá ser disponibilizado mensalmente pela Prestação dos Serviços";
  } else {
    bold1 = `III. Valor Mensal (${meses} Meses) para Locação ${labelFornecimento(equipamentos, software)} e para ${manutencao} de todos os itens desta proposta,`;
    itens = ["Garantia Total do Sistema"];
    if (pecas) itens.push("Substituição de Peças");
    itens.push(labelAtualizacao(software, true));
    itens.push("Suporte Técnico");
    itens.push(manutencao);
    naoIncluso = pecas ? "" : "; Não incluso Substituição de Peças";
    rodape = `* Este Valor deverá ser disponibilizado mensalmente pela Locação ${labelFornecimento(equipamentos, software)}`;
  }

  return {
    tag: `Resposta · Locação ${meses} Meses (OPEX)`,
    titulo: "Opex:",
    bold1,
    meio: ` (Inclui ${itens.join(", ")}${naoIncluso}): `,
    valorCents,
    rodape,
  };
}

// ---------- Renderização ----------
function buildHtmlBlock(r) {
  const valorTexto = valorFormatado(r.valorCents);
  return (
    `${r.titulo}<br>` +
    `<b>${r.bold1}</b>${r.meio}<br>` +
    `<b>${valorTexto}</b>.<br>` +
    `${r.rodape}`
  );
}

function buildPlainBlock(r) {
  const valorTexto = valorFormatado(r.valorCents);
  return (
    `${r.titulo}\n` +
    `${r.bold1}${r.meio}\n` +
    `${valorTexto}.\n` +
    `${r.rodape}`
  );
}

function renderResultados(respostas) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  container.style.display = "block";

  respostas.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "result-card";

    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = r.tag;

    const texto = document.createElement("div");
    texto.className = "result-text";
    texto.innerHTML = buildHtmlBlock(r);

    const footer = document.createElement("div");
    footer.className = "result-footer";

    const btn = document.createElement("button");
    btn.className = "btn btn-copy";
    btn.textContent = "Copiar";
    btn.addEventListener("click", () => copiarBloco(r, btn));

    footer.appendChild(btn);
    card.appendChild(tag);
    card.appendChild(texto);
    card.appendChild(footer);
    container.appendChild(card);
  });
}

function copyHtmlLegacy(html) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.contentEditable = "true";
  container.innerHTML = html;
  document.body.appendChild(container);

  const range = document.createRange();
  range.selectNodeContents(container);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }

  sel.removeAllRanges();
  document.body.removeChild(container);
  return ok;
}

async function copiarBloco(r, btn) {
  const html = buildHtmlBlock(r);
  const plain = buildPlainBlock(r);
  let ok = false;

  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    try {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plain], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      ok = true;
    } catch (e) {
      ok = false;
    }
  }

  if (!ok) {
    ok = copyHtmlLegacy(html);
  }

  if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(plain);
      ok = true;
    } catch (e) {
      ok = false;
    }
  }

  if (ok) {
    const original = btn.textContent;
    btn.textContent = "Copiado!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1500);
  } else {
    alert("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
  }
}

// ---------- Botão de instalar (PWA) ----------
let deferredInstallPrompt = null;
const installBtn = document.getElementById("installBtn");
const installHint = document.getElementById("installHint");

function appIsInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

if (!appIsInstalled()) {
  installBtn.hidden = false;
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
  installHint.hidden = true;
});

installBtn.addEventListener("click", async () => {
  if (deferredInstallPrompt) {
    installHint.hidden = true;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    promptEvent.prompt();
    await promptEvent.userChoice;
  } else {
    installHint.hidden = !installHint.hidden;
  }
});

// ---------- Checkboxes de escopo ----------
function setupParExclusivo(chkA, chkB, warning) {
  function showWarning() {
    warning.hidden = false;
    setTimeout(() => { warning.hidden = true; }, 3000);
  }

  chkA.addEventListener("change", () => {
    if (!chkA.checked && !chkB.checked) {
      chkA.checked = true;
      showWarning();
    }
  });

  chkB.addEventListener("change", () => {
    if (!chkB.checked && !chkA.checked) {
      chkB.checked = true;
      showWarning();
    }
  });
}

// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", () => {
  const custoInput = document.getElementById("custo");
  const vendaInput = document.getElementById("venda");
  attachCurrencyMask(custoInput);
  attachCurrencyMask(vendaInput);

  const chkEquipamentos = document.getElementById("chkEquipamentos");
  const chkSoftware = document.getElementById("chkSoftware");
  const chkPecas = document.getElementById("chkPecas");
  const chkPreventiva = document.getElementById("chkPreventiva");
  const chkCorretiva = document.getElementById("chkCorretiva");
  const chkServico = document.getElementById("chkServico");
  const chkEquipeDedicada = document.getElementById("chkEquipeDedicada");
  const materialCheckboxes = document.getElementById("materialCheckboxes");
  const equipeCheckboxes = document.getElementById("equipeCheckboxes");
  const checkboxWarning = document.getElementById("checkboxWarning");

  setupParExclusivo(chkPreventiva, chkCorretiva, checkboxWarning);
  setupParExclusivo(chkEquipamentos, chkSoftware, checkboxWarning);

  chkServico.addEventListener("change", () => {
    const modoServico = chkServico.checked;
    materialCheckboxes.hidden = modoServico;
    equipeCheckboxes.hidden = !modoServico;
  });

  document.getElementById("gerarBtn").addEventListener("click", () => {
    const custoCents = getCents(custoInput);
    const vendaCents = getCents(vendaInput);

    if (custoCents === 0 && vendaCents === 0) {
      alert("Informe pelo menos o preço de custo e o preço de venda.");
      return;
    }

    const opts = {
      servico: chkServico.checked,
      equipeDedicada: chkEquipeDedicada.checked,
      equipamentos: chkEquipamentos.checked,
      software: chkSoftware.checked,
      pecas: chkPecas.checked,
      preventiva: chkPreventiva.checked,
      corretiva: chkCorretiva.checked,
    };

    const respostas = calcularRespostas(custoCents, vendaCents, opts);
    renderResultados(respostas);
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});

    let refreshingAfterUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshingAfterUpdate) return;
      refreshingAfterUpdate = true;
      window.location.reload();
    });
  }
});
