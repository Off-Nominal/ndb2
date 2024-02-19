document.addEventListener("DOMContentLoaded", function () {
    const seasonsSelect = document.getElementById("leaderboards-seasons-selector");
    if (seasonsSelect) {
        seasonsSelect.addEventListener("click", (e) => {
            seasonsSelect.children[0].classList.toggle("rounded-b-lg");
            seasonsSelect.children[1].classList.toggle("hidden");
        });
    }
    document.addEventListener("click", (e) => {
        if (seasonsSelect && !seasonsSelect.contains(e.target)) {
            seasonsSelect.children[0].classList.add("rounded-b-lg");
            seasonsSelect.children[1].classList.add("hidden");
        }
    });
});
//# sourceMappingURL=select.js.map