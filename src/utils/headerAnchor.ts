export const navigate = () => {
  if (location.hash) {
    const el = document.querySelector(decodeURIComponent(location.hash));
    if (el) {
      const rect = el.getBoundingClientRect();
      const y = window.scrollY + rect.top - 20;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  }
};
