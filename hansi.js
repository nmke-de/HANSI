
const Q = (id) => document.getElementById(id);

window.addEventListener("load", () => {
	Q("hitpoints").addEventListener("input", updateHitpoints);
});

let updateHitpoints = (ev) => {
	Q("hitpoints-in-digits").innerHTML = ev.target.value;
};
