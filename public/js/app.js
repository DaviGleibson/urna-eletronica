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

const somBotao = new Audio("audio/botao-normal.mp3");
const somFinalizar = new Audio("audio/finalizar.mp3");
const musicaRosa = new Audio("audio/nossa-rosa.mp3");

somBotao.preload = "auto";
somFinalizar.preload = "auto";
musicaRosa.preload = "auto";
musicaRosa.loop = true;

let indiceCandidato = 0;
let digitado = "";
let voltandoParaAbertura = false;

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

function aoRedimensionar() {
  atualizarOrientacao();
  alinharMapa();
}

function candidatoAtual() {
  return CANDIDATOS[indiceCandidato];
}

function atualizarTela() {
  const atual = candidatoAtual();
  telaCargo.textContent = atual.cargo;
  telaDigitos.textContent = digitado;

  if (digitado === atual.numero) {
    telaDigitacao.hidden = true;
    telaCandidato.src = atual.tela;
    telaCandidato.hidden = false;
    return;
  }

  telaCandidato.hidden = true;
  telaDigitacao.hidden = false;
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

function proximoDigitoEsperado() {
  const atual = candidatoAtual();
  return atual.numero.charAt(digitado.length);
}

function entrarDigito(digito) {
  const atual = candidatoAtual();
  if (digitado.length >= atual.numero.length) {
    return false;
  }

  if (digito !== proximoDigitoEsperado()) {
    return false;
  }

  digitado += digito;
  tocarSom(somBotao);
  atualizarTela();
  return true;
}

function tocarMusicaAbertura() {
  musicaRosa.currentTime = 0;
  musicaRosa.play().catch(() => {});
}

function pararMusicaAbertura() {
  musicaRosa.pause();
  musicaRosa.currentTime = 0;
}

function reiniciarVotacao() {
  indiceCandidato = 0;
  digitado = "";
  atualizarTela();
}

function voltarAbertura() {
  if (voltandoParaAbertura) {
    return;
  }

  voltandoParaAbertura = true;
  somFinalizar.pause();
  somFinalizar.currentTime = 0;
  reiniciarVotacao();
  telaUrna.classList.remove("ativa");
  telaUrna.hidden = true;
  telaIntro.hidden = false;
  telaIntro.classList.add("ativa");
  tocarMusicaAbertura();
}

function confirmarFinal() {
  voltandoParaAbertura = false;

  const irParaAbertura = () => {
    voltarAbertura();
  };

  somFinalizar.addEventListener("ended", irParaAbertura, { once: true });
  tocarSom(somFinalizar);
  window.setTimeout(irParaAbertura, 2500);
}

function corrige() {
  reiniciarVotacao();
}

function confirma() {
  const atual = candidatoAtual();
  if (digitado !== atual.numero) {
    return false;
  }

  const ultimoCandidato = indiceCandidato === CANDIDATOS.length - 1;

  if (ultimoCandidato) {
    confirmarFinal();
    return true;
  }

  tocarSom(somBotao);
  indiceCandidato += 1;
  digitado = "";
  atualizarTela();
  return true;
}

function mostrarUrna() {
  if (!estaNaHorizontal() || telaUrna.classList.contains("ativa")) {
    return;
  }

  pararMusicaAbertura();
  voltandoParaAbertura = false;
  reiniciarVotacao();
  telaIntro.classList.remove("ativa");
  telaUrna.hidden = false;
  requestAnimationFrame(() => {
    telaUrna.classList.add("ativa");
    alinharMapa();
  });
}

atualizarOrientacao();
atualizarTela();
window.addEventListener("resize", aoRedimensionar);
window.addEventListener("orientationchange", () => {
  window.setTimeout(aoRedimensionar, 150);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", aoRedimensionar);
}
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

    if (tecla.dataset.digito) {
      if (entrarDigito(tecla.dataset.digito)) {
        piscarTecla(tecla);
      }
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
