
const Q = (id) => document.getElementById(id);
const C = (tagname) => document.createElement(tagname);
const A = (parent) => (child) => parent.appendChild(child);

window.addEventListener("load", () => {
	Q("hitpoints").addEventListener("input", updateHitpoints);
});

const updateHitpoints = (ev) => {
	Q("hitpoints-in-digits").innerHTML = ev.target.value;
};

const codify = (input) => {
	return input.toLowerCase().replace(' ', '_').replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
};

const nameNode = (name=undefined) => {
	let node = C("h1");
	node.class = "name";
	if (name) node.innerText = name;
	else {
		let child = A(node)(C("input"));
		child.type = "text";
		child.name = "name";
		child.placeholder = "Name";
	}
	return node;
};

const h2Node = (text) => {
	let node = C("h2");
	node.innerText = text;
	return node;
};

const fakeTableNode = (id) => {
	let node = C("div");
	node.class = "table " + id;
	return node;
};

const attributeNames = [
	"Bildung",
	"Charisma",
	"Geschick",
	"Intelligenz",
	"Stärke",
	"Glück"
];

const slide50Node = (name, attribute=undefined, value=0) => {
	/*
	<div class="tr $(codify attribute)">
		<label class="td" for="$(codify name)">$name</label>
		<input class="td" type="range" min="0" max="50" name="$(codify name)" value="$value">
	</div>
	*/
	if(!attribute) attribute = name;
	let node = C("div");
	node.class = "tr " + codify(attribute);
	let child = A(node)(C("label"));
	child.class = "td";
	child.for = codify(name);
	child.innerText = name;
	child = A(node)(C("input"));
	child.class = "td";
	child.name = codify(name);
	child.type = "range";
	child.min = 0;
	child.max = 50;
	child.value = value;
	return node;
};

const skillNode = (name, checked=false) => {
	/*
	<div class="tr">
		<input class="td" type="checkbox" name="$(codify name)" checked?>
		<label class="td" for="$(codify name)">$name</label>
	</div>
	*/
	let node = C("div");
	node.class = "tr";
	let child = A(node)(C("input"));
	child.class = "td";
	child.type = "checkbox";
	child.name = codify(name);
	child.checked = checked; // Not to myself: Code might be faulty
	child = A(node)(C("label"));
	child.class = "td";
	child.for = codify(name);
	child.innerText = name;
	return node;
};

const itemNode = (name="", description="") => {
	// TODO define input-data names.
	let node = C("div");
	node.class = "tr";
	let child = A(node)(C("input"));
	child.class = "td";
	child.type = "number";
	child.min = 0;
	child.value = 0;
	child.placeholder = "Anzahl";
	child = A(node)(C("input"));
	child.class = "td";
	child.type = "text";
	child.value = name;
	child.placeholder = "Gegenstandsname";
	child = A(node)(C("textarea"));
	child.class = "td";
	child.value = description;
	child.placeholder = "Beschreibung";
	return node;
};

const newCharacter = () => {
	// TODO do more than a demo here!
	let dialog = document.createElement("dialog");
	let form = A(dialog)(C("form"));
	form.method = "dialog";
	let _ = A(form);
	
	_(nameNode());
	_(h2Node("Backstory"));
	let child = _(C("textarea"));
	child.name = "backstory";
	child.placeholder = "Backstory";
	child = _(fakeTableNode("attributes"));
	A(child)(h2Node("Attributes"));
	attributeNames.forEach(attr => A(child)(slide50Node(attr)));
	child = _(fakeTableNode("stats"));
	A(child)(h2Node("Werte"));
	// TODO stat nodes
	child = _(fakeTableNode("skills"));
	A(child)(h2Node("Andere Skills"));
	// TODO skill nodes
	child = _(fakeTableNode("inventory"));
	A(child)(h2Node("Inventar"));
	// TODO inventory nodes
	Q("sheet").appendChild(dialog);
	dialog.show();
};
