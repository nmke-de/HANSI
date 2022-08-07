
const Q = (id) => document.getElementById(id);

window.addEventListener("load", () => {
	Q("hitpoints").addEventListener("input", updateHitpoints);
});

const updateHitpoints = (ev) => {
	Q("hitpoints-in-digits").innerHTML = ev.target.value;
};

const newCharacter = () => {
	// TODO do more than a demo here!
	let dialog = document.createElement("dialog");
	dialog.innerHTML = "<form method='dialog'><button>Ok</button></form>";
	Q("sheet").appendChild(dialog);
	dialog.show();
};
