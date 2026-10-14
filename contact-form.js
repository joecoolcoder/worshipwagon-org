// Shared contact form client for this website.
const form = document.querySelector(".contact-form[data-contact-site][data-contact-endpoint]");

if (form) {
  const status = document.createElement("p");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  form.append(status);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const previousLabel = button.textContent;
    button.disabled = true;
    button.textContent = "Sending…";
    status.textContent = "Please wait while your message is sent.";

    try {
      const fields = new URLSearchParams(new FormData(form));
      fields.set("site", form.dataset.contactSite);
      const response = await fetch(form.dataset.contactEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fields
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Message could not be sent.");
      form.reset();
      status.textContent = "Your message was sent. Thank you!";
    } catch (error) {
      status.textContent = error.message || "Message could not be sent. Please try again.";
    } finally {
      button.disabled = false;
      button.textContent = previousLabel;
      if (window.turnstile) window.turnstile.reset();
    }
  });
}
