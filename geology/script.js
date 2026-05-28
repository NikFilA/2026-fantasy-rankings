const slides = Array.from(document.querySelectorAll(".slide"));
const jumpButtons = Array.from(document.querySelectorAll(".jump-btn"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const slideStatus = document.getElementById("slideStatus");

let currentSlide = 0;

function renderSlide(index) {
  currentSlide = Math.max(0, Math.min(index, slides.length - 1));

  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
  });

  jumpButtons.forEach((btn, i) => {
    const isActive = i === currentSlide;
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });

  slideStatus.textContent = `Section ${currentSlide + 1} / ${slides.length}`;

  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === slides.length - 1;
}

prevBtn.addEventListener("click", () => {
  renderSlide(currentSlide - 1);
});

nextBtn.addEventListener("click", () => {
  renderSlide(currentSlide + 1);
});

jumpButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    renderSlide(Number(btn.dataset.target));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    renderSlide(currentSlide + 1);
  }
  if (event.key === "ArrowLeft") {
    renderSlide(currentSlide - 1);
  }
});

renderSlide(0);
