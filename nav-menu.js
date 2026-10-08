document.addEventListener("DOMContentLoaded", () => {
  const navigation = document.querySelector(".nav");

  if (!navigation) {
    return;
  }

  const dropdowns = [...navigation.querySelectorAll("details")];

  function closeDropdowns(except) {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== except) {
        dropdown.open = false;
      }
    });
  }

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        closeDropdowns(dropdown);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target)) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
    }
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest(".submenu a")) {
      closeDropdowns();
    }
  });
});
