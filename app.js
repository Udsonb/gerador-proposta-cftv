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

// ---------- Cálculo das respostas ----------
function calcularRespostas(custoCents, vendaCents) {
  const round = (n) => Math.round(n);

  return [
    {
      tag: "Resposta 1 · Preço de Venda (CAPEX)",
      titulo: "Capex:",
      bold1: "I. Valor para a Aquisição de Todos os Equipamentos e Softwares Licenciados para o sistema acima",
      meio: " (inclui garantia balcão de 12 meses dos equipamentos instalados em caso de defeitos de fábrica): ",
      valorCents: vendaCents,
      rodape: "*Conforme condições comerciais",
    },
    {
      tag: "Resposta 2 · Manutenção Mensal Opcional (OPEX Opcional)",
      titulo: "Opex Opcional:",
      bold1: "II. OPCIONAL » Valor Mensal para Manutenção Preventiva e Corretiva,",
      meio: " (Inclui limpeza, atualizações de Hardware e Software, Suporte Técnico, Manutenção Preventiva, Manutenção Corretiva, deslocamentos e visitas técnicas de acordo com SLA; Não incluso substituição de peças e acessórios): ",
      valorCents: round(vendaCents * 0.02 * 1.111),
      rodape: "*Este Valor deverá ser disponibilizado mensalmente pela Manutenção dos Equipamentos",
    },
    respostaLocacao(24, round(custoCents * 0.111111111)),
    respostaLocacao(36, round(custoCents * 0.092165899)),
    respostaLocacao(48, round(custoCents * 0.078740157)),
    respostaLocacao(60, round(custoCents * 0.071684588)),
  ];
}

function respostaLocacao(meses, valorCents) {
  return {
    tag: `Resposta · Locação ${meses} Meses (OPEX)`,
    titulo: "Opex:",
    bold1: `III. Valor Mensal (${meses} Meses) para Locação dos Novos Equipamentos, Licenças e para Manutenção Preventiva e Corretiva de todos os itens desta proposta,`,
    meio: " (Inclui Garantia Total do Sistema, Substituição de Peças, Atualizações de Hardware e Software, Suporte Técnico, Manutenção Preventiva e Corretiva): ",
    valorCents,
    rodape: "* Este Valor deverá ser disponibilizado mensalmente pela Locação dos Equipamentos",
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

// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", () => {
  const custoInput = document.getElementById("custo");
  const vendaInput = document.getElementById("venda");
  attachCurrencyMask(custoInput);
  attachCurrencyMask(vendaInput);

  document.getElementById("gerarBtn").addEventListener("click", () => {
    const custoCents = getCents(custoInput);
    const vendaCents = getCents(vendaInput);

    if (custoCents === 0 && vendaCents === 0) {
      alert("Informe pelo menos o preço de custo e o preço de venda.");
      return;
    }

    const respostas = calcularRespostas(custoCents, vendaCents);
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
