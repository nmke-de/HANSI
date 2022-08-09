
const Q = (id) => document.getElementById(id);
const C = (tagname) => document.createElement(tagname);
const A = (parent) => (child) => parent.appendChild(child);

// Global cache. TODO store this in WebStorage or similar.
let cache = {
	sheets: [],
	templates: [],
	selected: {
		sheet: 0
	}
};

window.addEventListener("load", () => {
	// Fetch templates
	[
		// TODO Currently hardcoded, pls change
		"empty.json",
		"new-east.json",
		"obstwatch.json"
	].forEach((filename, i) => {
		fetch("templates/" + filename).then(response => response.json()).then(text => cache.templates[i] = text);
	});
	Q("hitpoints").addEventListener("input", updateHitpoints);
});

const updateHitpoints = (ev) => {
	Q("hitpoints-in-digits").innerHTML = ev.target.value;
};

const codify = (input) => {
	return input.toLowerCase().replace(' ', '_').replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
};

const templateChooserNode = () => {
	let node = C("select");
	node.id = "template-chooser";
	cache.templates.forEach((template, i) => {
		let child = A(node)(C("option"));
		child.value = i;
		child.innerText = template.template + " template";
	});
	node.onclick = (ev) => {
		appendTemplateStats(Q("cc-stats"), cache.templates[ev.target.value]);
		appendTemplateSkills(Q("cc-skills"), cache.templates[ev.target.value]);
	};
	return node;
};

const nameNode = (name = undefined) => {
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

const textareaNode = (name, placeholder) => {
	let node = C("textarea");
	node.name = name;
	node.placeholder = placeholder;
	return node;
};

const fakeTableNode = (id, prefix = "") => {
	let node = C("div");
	node.class = "table " + id;
	node.id = prefix + id;
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

const slide50Node = (name, attribute = undefined, value = 0) => {
	/*
	<div class="tr $(codify attribute)">
		<label class="td" for="$(codify name)">$name</label>
		<input class="td" type="range" min="0" max="50" name="$(codify name)" value="$value">
	</div>
	*/
	if (!attribute) attribute = name;
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

const statAdderNode = () => {
	let node = C("div");
	node.class = "subnode";
	let child = A(node)(C("input"));
	child.type = "text";
	child.placeholder = "Wertname";
	let select = A(node)(C("select"));
	select.multiple = true;
	attributeNames.forEach(attr => {
		child = A(select)(C("option"));
		child.value = codify(attr);
		child.innerText = attr;
	});
	child = A(select)(C("option"));
	child.value = "";
	child.innerText = "XX";
	// TODO limit number of attributes that can be selected.
	return node;
};

const appendTemplateStats = (faketable, template) => {
	let refpoint = faketable.lastChild;
	while (!refpoint.previousSibling.isSameNode(faketable.firstChild)) faketable.removeChild(refpoint.previousSibling);
	template.stats.forEach(stat => faketable.insertBefore(slide50Node(stat.name, stat.base2 ? stat.base1 + " " + stat.base2 : stat.base1), refpoint));
};

const skillNode = (name, checked = false) => {
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
	child.id = codify(name);
	child.checked = checked; // Note to myself: Code might be faulty
	child = A(node)(C("label"));
	child.class = "td";
	child.for = codify(name);
	child.innerText = name;
	return node;
};

const skillAdderNode = () => {
	let node = C("input");
	node.class = "subnode";
	node.type = "text";
	node.placeholder = "Skillname";
	return node;
};

const appendTemplateSkills = (faketable, template) => {
	let refpoint = faketable.lastChild;
	while (!refpoint.previousSibling.isSameNode(faketable.firstChild)) faketable.removeChild(refpoint.previousSibling);
	template.skills.forEach(skill => faketable.insertBefore(skillNode(skill), refpoint));
};

const itemNode = (name = "", count = 0, description = "") => {
	// TODO define input-data names.
	let node = C("div");
	node.class = "tr";
	let child = A(node)(C("input"));
	child.class = "td";
	child.type = "number";
	child.min = 0;
	child.value = count;
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

const entryAdderNode = (faketable, nodegen, subnode = null) => {
	// TODO give more options
	let node = C("div");
	node.class = "append-button-div";
	if (subnode) A(node)(subnode);
	let child = A(node)(C("button"));
	child.class = "append-button";
	child.innerText = "+";
	child.type = "button";
	child.onclick = () => faketable.insertBefore(nodegen(subnode ? subnode : ""), faketable.lastChild);
	return node;
};

const characterSubmitterNode = () => {
	let node = C("div");
	node.class = "cc-submit";
	const close = (ev) => {
		if(ev.target.value == "confirm") {
			// TODO store new character
		}
		Q("sheet").removeChild(Q("dialog"));
	};
	let child = A(node)(C("button"));
	child.value = "cancel";
	child.innerText = "Abbrechen";
	child.onclick = close;
	child = A(node)(C("button"));
	child.value = "confirm";
	child.innerText = "Erstellen"
	child.onclick = close;
	return node;
};

const newCharacter = () => {
	// TODO do more than a demo here!
	let dialog = C("dialog");
	dialog.id = "dialog";
	A(dialog)(templateChooserNode());
	let form = A(dialog)(C("form"));
	form.method = "dialog";
	let ftprefix = "cc-"
	let _ = A(form);

	_(nameNode());
	let child = _(C("div"));
	A(child)(h2Node("Backstory"));
	A(child)(textareaNode("backstory", "Backstory"));
	child = _(fakeTableNode("attributes", ftprefix));
	A(child)(h2Node("Attribute"));
	attributeNames.forEach(attr => A(child)(slide50Node(attr)));
	child = _(fakeTableNode("stats", ftprefix));
	A(child)(h2Node("Werte"));
	A(child)(entryAdderNode(child, (subnode) => slide50Node(subnode.firstChild.value, subnode.lastChild.value), statAdderNode()));
	child = _(fakeTableNode("skills", ftprefix));
	A(child)(h2Node("Andere Skills"));
	A(child)(entryAdderNode(child, (subnode) => skillNode(subnode.value), skillAdderNode()));
	child = _(fakeTableNode("inventory", ftprefix));
	A(child)(h2Node("Inventar"));
	A(child)(entryAdderNode(child, itemNode));
	_(characterSubmitterNode());
	A(Q("sheet"))(dialog);
	dialog.show();
};
