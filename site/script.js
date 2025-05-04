// Мобильное меню
const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav-links");
const navLinks = document.querySelectorAll(".nav-links li");

burger.addEventListener("click", () => {
  // Переключение навигации
  nav.classList.toggle("nav-active");

  // Анимация ссылок
  navLinks.forEach((link, index) => {
    if (link.style.animation) {
      link.style.animation = "";
    } else {
      link.style.animation = `navLinkFade 0.5s ease forwards ${
        index / 7 + 0.3
      }s`;
    }
  });

  // Анимация бургера
  burger.classList.toggle("toggle");
});

// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// Обработка формы
const contactForm = document.getElementById("contactForm");
contactForm.addEventListener("submit", function (e) {
  e.preventDefault();
  alert("Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.");
  this.reset();
});

// Кнопка CTA
const ctaButton = document.getElementById("ctaButton");
ctaButton.addEventListener("click", () => {
  document.querySelector("#about").scrollIntoView({
    behavior: "smooth",
  });
});

// Анимация при загрузке
window.addEventListener("load", () => {
  const hero = document.querySelector(".hero");
  hero.style.opacity = "1";
  hero.style.transform = "translateY(0)";
});
