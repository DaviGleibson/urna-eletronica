const telaIntro = document.getElementById("tela-intro");
const telaUrna = document.getElementById("tela-urna");
const imgUrna = document.getElementById("img-urna");
const urnaMapa = document.getElementById("urna-mapa");
const telaCandidato = document.getElementById("tela-candidato");
const telaCandidatoHtml = document.getElementById("tela-candidato-html");
const telaDigitacao = document.getElementById("tela-digitacao");
const telaCargo = document.getElementById("tela-cargo");
const telaDigitos = document.getElementById("tela-digitos");
const chapaCargo = document.getElementById("chapa-cargo");
const chapaNumero = document.getElementById("chapa-numero");
const chapaNome = document.getElementById("chapa-nome");
const chapaFoto = document.getElementById("chapa-foto");

const SENADORES = [
  {
    numero: "130",
    nome: "Humberto Costa",
    tela: "imagens/humberto-chapa.png",
  },
  {
    numero: "123",
    nome: "Marília Arraes",
    foto: "imagens/marilia-arraes-123.jpg",
  },
  {
    numero: "180",
    nome: "Paulo Rubem",
    foto: "imagens/paulo-rubem-180.jpg",
  },
];

const RACAS = [
  {
    id: "federal",
    cargo: "Deputada Federal",
    candidatos: [
      {
        numero: "1303",
        nome: "Rosa Amorim",
        tela: "imagens/rosa-chapa.png",
      },
    ],
  },
  {
    id: "estadual",
    cargo: "Deputado Estadual",
    candidatos: [
      { numero: "13000", nome: "Dani Portela", foto: "imagens/dani-portela-13000.jpg" },
      { numero: "50000", nome: "Jô Cavalcanti", foto: "imagens/jo-cavalcanti-50000.jpg" },
      { numero: "13123", nome: "Doriel Barros", foto: "imagens/doriel-barros-13123.jpg" },
      { numero: "13113", nome: "João Paulo", foto: "imagens/joao-paulo-13113.jpg" },
      { numero: "13100", nome: "Professor Gilmar", foto: "imagens/professor-gilmar-13100.jpg" },
      { numero: "13013", nome: "Eugênia Lima", foto: "imagens/eugenia-lima-13013.jpg" },
      { numero: "40111", nome: "Bruno Marques", foto: "imagens/bruno-marques-40111.jpg" },
      { numero: "40140", nome: "Maria Arraes", foto: "imagens/maria-arraes-40140.jpg" },
      { numero: "55456", nome: "Anderson Luiz", foto: "imagens/anderson-luiz-55456.jpg" },
    ],
  },
  {
    id: "senador1",
    cargo: "Senador 1ª vaga",
    pool: "senadores",
  },
  {
    id: "senador2",
    cargo: "Senador 2ª vaga",
    pool: "senadores",
  },
  {
    id: "presidente",
    cargo: "Presidente",
    candidatos: [
      {
        numero: "13",
        nome: "Lula",
        tela: "imagens/lula-chapa.png?v=2",
      },
    ],
  },
];

const somBotao = new Audio("audio/botao-normal.mp3");
const somFinalizar = new Audio("audio/finalizar.mp3");
const musicaRosa = new Audio("audio/nossa-rosa.mp3");

somBotao.preload = "auto";
somFinalizar.preload = "auto";
musicaRosa.preload = "auto";
musicaRosa.loop = true;

let indiceRaca = 0;
let digitado = "";
let senadorEscolhido = null;
let voltandoParaAbertura = false;

if (new URLSearchParams(location.search).has("debug")) {
  document.body.classList.add("debug");
}

function estaNaHorizontal() {
  const tipo = String(screen.orientation?.type || "");
  if (tipo.startsWith("portrait")) {
    return false;
  }

  if (window.matchMedia("(orientation: portrait)").matches) {
    return false;
  }

  if (tipo.startsWith("landscape") || window.matchMedia("(orientation: landscape)").matches) {
    return true;
  }

  return window.innerWidth > window.innerHeight + 50;
}

function atualizarOrientacao() {
  const retrato = !estaNaHorizontal();
  document.documentElement.classList.toggle("retrato", retrato);
  document.body.classList.toggle("retrato", retrato);

  if (retrato && telaIntro.classList.contains("ativa")) {
    garantirMusicaAbertura();
  }
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

function racaAtual() {
  return RACAS[indiceRaca];
}

function candidatosDisponiveis() {
  const raca = racaAtual();

  if (raca.pool === "senadores") {
    if (raca.id === "senador2" && senadorEscolhido) {
      return SENADORES.filter((candidato) => candidato.numero !== senadorEscolhido);
    }
    return SENADORES.slice();
  }

  return raca.candidatos.slice();
}

function candidatoCompleto() {
  return candidatosDisponiveis().find((candidato) => candidato.numero === digitado) || null;
}

function digitosPermitidos() {
  const permitidos = new Set();

  for (const candidato of candidatosDisponiveis()) {
    if (
      candidato.numero.startsWith(digitado) &&
      candidato.numero.length > digitado.length
    ) {
      permitidos.add(candidato.numero.charAt(digitado.length));
    }
  }

  return permitidos;
}

function esconderCandidato() {
  telaCandidato.hidden = true;
  telaCandidato.removeAttribute("src");
  telaCandidato.alt = "";
  telaCandidatoHtml.hidden = true;
  chapaFoto.removeAttribute("src");
  chapaFoto.alt = "";
  chapaCargo.textContent = "";
  chapaNumero.textContent = "";
  chapaNome.textContent = "";
}

function mostrarCandidato(candidato) {
  const raca = racaAtual();

  if (candidato.tela) {
    telaCandidatoHtml.hidden = true;
    chapaFoto.removeAttribute("src");
    telaCandidato.src = candidato.tela;
    telaCandidato.alt = candidato.nome;
    telaCandidato.hidden = false;
    return;
  }

  telaCandidato.hidden = true;
  telaCandidato.removeAttribute("src");
  chapaCargo.textContent = raca.cargo;
  chapaNumero.textContent = candidato.numero;
  chapaNome.textContent = candidato.nome;
  chapaFoto.src = candidato.foto;
  chapaFoto.alt = candidato.nome;
  telaCandidatoHtml.hidden = false;
}

function atualizarTela() {
  const raca = racaAtual();
  const completo = candidatoCompleto();

  telaCargo.textContent = raca.cargo;
  telaDigitos.textContent = digitado;

  if (completo) {
    telaDigitacao.hidden = true;
    mostrarCandidato(completo);
    return;
  }

  esconderCandidato();
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

function entrarDigito(digito) {
  if (candidatoCompleto()) {
    return false;
  }

  if (!digitosPermitidos().has(digito)) {
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

function garantirMusicaAbertura() {
  if (!musicaRosa.paused) {
    return;
  }

  musicaRosa.play().catch(() => {});
}

function pararMusicaAbertura() {
  musicaRosa.pause();
  musicaRosa.currentTime = 0;
}

function reiniciarVotacao() {
  indiceRaca = 0;
  digitado = "";
  senadorEscolhido = null;
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
  const completo = candidatoCompleto();
  if (!completo) {
    return false;
  }

  const raca = racaAtual();
  const ultimo = indiceRaca === RACAS.length - 1;

  if (raca.id === "senador1") {
    senadorEscolhido = completo.numero;
  }

  if (ultimo) {
    confirmarFinal();
    return true;
  }

  tocarSom(somBotao);
  indiceRaca += 1;
  digitado = "";
  atualizarTela();
  return true;
}

function mostrarUrna() {
  if (!estaNaHorizontal()) {
    garantirMusicaAbertura();
    return;
  }

  if (telaUrna.classList.contains("ativa")) {
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

const avisoHorizontal = document.getElementById("aviso-horizontal");

avisoHorizontal.addEventListener("pointerdown", (evento) => {
  evento.preventDefault();
  evento.stopPropagation();
  garantirMusicaAbertura();
  travarHorizontal();
});

atualizarOrientacao();
atualizarTela();
window.addEventListener("resize", aoRedimensionar);
window.addEventListener("orientationchange", () => {
  window.setTimeout(aoRedimensionar, 150);
});
if (screen.orientation) {
  screen.orientation.addEventListener("change", aoRedimensionar);
}
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
