document.addEventListener("DOMContentLoaded", () => {
  const phrases = ["Ethical Hacker ", "Security Researcher ", "Bug Bounty Hunter "];
  const typingEl = document.getElementById("typing");

  let i = 0, j = 0, isDeleting = false;

  function type() {
    const current = phrases[i];
    typingEl.textContent = isDeleting
      ? current.substring(0, j--)
      : current.substring(0, j++);

    let delay = isDeleting ? 40 : 80;

    if (!isDeleting && j === current.length) {
      isDeleting = true;
      delay = 1500;
    } else if (isDeleting && j === 0) {
      isDeleting = false;
      i = (i + 1) % phrases.length;
      delay = 500;
    }

    setTimeout(type, delay);
  }

  type();
});
