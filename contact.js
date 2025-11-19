document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("fName").value.trim();
    const contact = document.getElementById("fContact").value.trim();
    const topic = document.getElementById("fTopic").value;
    const msg = document.getElementById("fMsg").value.trim();

    if (!name || !contact || !topic) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    // --- routing nach Bereich ---
    let recipient = "mail@lebensanker-kaiserslautern.de"; // fallback

    switch (topic) {
      case "ambulant":
        recipient = "ambulant@lebensanker-kaiserslautern.de";
        break;
      case "tagespflege":
        recipient = "tagespflege@lebensanker-kaiserslautern.de";
        break;
      case "beratung":
        recipient = "info@lebensanker-kaiserslautern.de";
        break;
      // case "psy": später, wenn активируешь
    }

    // отправляем данные на PHP-скрипт
    fetch("send-mail.php", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: JSON.stringify({
        to: recipient,
        name,
        contact,
        topic,
        message: msg
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) {
          alert("Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.");
          form.reset();
        } else {
          alert("Leider ist ein Fehler beim Senden aufgetreten.");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Leider ist ein Fehler beim Senden aufgetreten.");
      });
  });
});
