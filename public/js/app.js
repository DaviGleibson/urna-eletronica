const telaIntro = document.getElementById("tela-intro");
const telaUrna = document.getElementById("tela-urna");
const imgUrna = document.getElementById("img-urna");
const urnaMapa = document.getElementById("urna-mapa");
const telaCandidato = document.getElementById("tela-candidato");
const telaDigitacao = document.getElementById("tela-digitacao");
const telaCargo = document.getElementById("tela-cargo");
const telaDigitos = document.getElementById("tela-digitos");

const CANDIDATOS = [
  {
    numero: "1303",
    cargo: "Deputada Federal",
    tela: "imagens/rosa-chapa.png",
  },
  {
    numero: "130",
    cargo: "Senador",
    tela: "imagens/humberto-chapa.png",
  },
  {
    numero: "13",
    cargo: "Presidente",
    tela: "imagens/lula-chapa.png",
  },
];

const TELA_INICIO = "imagens/justica.png";
const somBotao = new Audio("audio/botao-normal.mp3");
const somFinalizar = new Audio("audio/finalizar.mp3");

somBotao.preload = "auto";
somFinalizar.preload = "auto";

let indiceCandidato = 0;
let digitado = "";

if (new URLSearchParams(location.search).has("debug")) {
  document.body.classList.add("debug");
}

function estaNaHorizontal() {
  return window.innerWidth >= window.innerHeight;
}

function atualizarOrientacao() {
  document.body.classList.toggle("retrato", !estaNaHorizontal());
}

async function travarHorizontal() {
  try {
    await screen.orientation?.lock?.("landscape");
  } catch (_) {
    /* Alguns navegadores só travam em tela cheia ou app instalado. */
  }
}

function alinharMapa() {
  if (!imgUrna.naturalWidth) {
    return;
  }

  const caixa = imgUrna.parentElement;
  const escala = Math.min(
    caixa.clientWidth / imgUrna.naturalWidth,
    caixa.clientHeight / imgUrna.naturalHeight
  );
  const largura = imgUrna.naturalWidth * escala;
  const altura = imgUrna.naturalHeight * escala;

  urnaMapa.style.width = `${largura}px`;
  urnaMapa.style.height = `${altura}px`;
  urnaMapa.style.left = `${(caixa.clientWidth - largura) / 2}px`;
  urnaMapa.style.top = `${(caixa.clientHeight - altura) / 2}px`;
}

function candidatoAtual() {
  return CANDIDATOS[indiceCandidato];
}

function atualizarTela() {
  const atual = candidatoAtual();

  if (digitado === atual.numero) {
    telaDigitacao.hidden = true;
    telaCandidato.src = atual.tela;
    telaCandidato.hidden = false;
    return;
  }

  telaCandidato.src = TELA_INICIO;
  telaCandidato.hidden = digitado.length > 0;
  telaDigitacao.hidden = digitado.length === 0;
  telaCargo.textContent = atual.cargo;
  telaDigitos.textContent = digitado;
}

function piscarTecla(tecla) {
  tecla.classList.add("pressionada");
  window.setTimeout(() => {
    tecla.classList.remove("pressionada");
  }, 280);
}

function tocarSom(audio) {
  audio.pause();
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function entrarDigito(digito) {
  const atual = candidatoAtual();
  if (digitado.length >= atual.numero.length) {
    return;
  }

  digitado += digito;
  tocarSom(somBotao);
  atualizarTela();
}

function corrige() {
  digitado = "";
  indiceCandidato = 0;
  atualizarTela();
}

function confirma() {
  const atual = candidatoAtual();
  if (digitado !== atual.numero) {
    return;
  }

  const ultimoCandidato = indiceCandidato === CANDIDATOS.length - 1;

  if (ultimoCandidato) {
    tocarSom(somFinalizar);
    return;
  }

  tocarSom(somBotao);
  indiceCandidato += 1;
  digitado = "";
  atualizarTela();
}

function mostrarUrna() {
  if (!estaNaHorizontal() || telaUrna.classList.contains("ativa")) {
    return;
  }

  telaIntro.classList.remove("ativa");
  telaUrna.hidden = false;
  requestAnimationFrame(() => {
    telaUrna.classList.add("ativa");
    alinharMapa();
  });
}

atualizarOrientacao();
atualizarTela();
window.addEventListener("resize", () => {
  atualizarOrientacao();
  alinharMapa();
});
window.addEventListener("orientationchange", () => {
  atualizarOrientacao();
  alinharMapa();
});
imgUrna.addEventListener("load", alinharMapa);
document.addEventListener("click", travarHorizontal);
document.addEventListener("touchend", travarHorizontal, { passive: true });

telaIntro.addEventListener("click", mostrarUrna);
telaIntro.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" || evento.key === " ") {
    evento.preventDefault();
    mostrarUrna();
  }
});
telaIntro.setAttribute("tabindex", "0");

document.querySelectorAll(".tecla").forEach((tecla) => {
  tecla.addEventListener("pointerdown", (evento) => {
    evento.preventDefault();
    evento.stopPropagation();
    piscarTecla(tecla);

    if (tecla.dataset.digito) {
      entrarDigito(tecla.dataset.digito);
      return;
    }

    if (tecla.dataset.acao === "corrige") {
      corrige();
      return;
    }

    if (tecla.dataset.acao === "confirma") {
      confirma();
    }
  });
});
