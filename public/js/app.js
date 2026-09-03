const telaIntro = document.getElementById("tela-intro");
const telaUrna = document.getElementById("tela-urna");

function mostrarUrna() {
  telaIntro.classList.remove("ativa");
  telaUrna.hidden = false;
  requestAnimationFrame(() => {
    telaUrna.classList.add("ativa");
  });
}

telaIntro.addEventListener("click", mostrarUrna, { once: true });
telaIntro.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      mostrarUrna();
    }
  },
  { once: true }
);

telaIntro.setAttribute("tabindex", "0");
