
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


const ftprefix = "cc-";

window.addEventListener("load", () => {
	// Fetch templates
	[
		// TODO Currently hardcoded, pls change
		"empty.json",
		"new-east.json",
		"obstwatch.json",
		"GenreUndefined.json"
	].forEach((filename, i) => {
		fetch("templates/" + filename).then(response => response.json()).then(text => cache.templates[i] = text);
	});
	Q("hitpoints").addEventListener("input", updateHitpoints);
});

const updateHitpoints = (ev) => {
	Q("hitpoints-in-digits").innerHTML = ev.target.value;
};

const codify = (input) => {
	return input.toLowerCase().replace(/ /g, '_').replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
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
	node.className = "name";
	if (name) node.innerText = name;
	else {
		let child = A(node)(C("input"));
		child.id = ftprefix + "name";
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

const textareaNode = (name, placeholder, value = "") => {
	let node = C("textarea");
	node.name = name;
	node.id = name;
	node.placeholder = placeholder;
	node.value = value;
	return node;
};

const fakeTableNode = (id, prefix = "") => {
	let node = C("div");
	node.className = "table " + id;
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
	node.className = "tr " + codify(attribute);
	let child = A(node)(C("label"));
	child.className = "td";
	child.for = codify(name);
	child.innerText = name;
	child = A(node)(C("input"));
	child.className = "td";
	child.name = codify(name);
	child.id = ftprefix + codify(name);
	child.type = "range";
	child.min = 0;
	child.max = 50;
	child.value = value;
	return node;
};

const statAdderNode = () => {
	let node = C("div");
	node.className = "subnode";
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
	let node = C("label");
	node.className = "tr";
	let child = A(node)(C("span"));
	child.className = "td";
	child.innerText = name;
	child = A(node)(C("input"));
	child.className = "td";
	child.type = "checkbox";
	child.name = codify(name);
	child.id = codify(name);
	child.checked = checked; // Note to myself: Code might be faulty
	return node;
};

const skillAdderNode = () => {
	let node = C("input");
	node.className = "subnode";
	node.type = "text";
	node.placeholder = "Skillname";
	return node;
};

const appendTemplateSkills = (faketable, template) => {
	let refpoint = faketable.lastChild;
	while (!refpoint.previousSibling.isSameNode(faketable.firstChild)) faketable.removeChild(refpoint.previousSibling);
	template.skills.forEach(skill => faketable.insertBefore(skillNode(skill), refpoint));
};

const itemNode = (name = "", count = 1, description = "") => {
	// TODO define input-data names.
	let node = C("div");
	node.className = "tr";
	let child = A(node)(C("input"));
	child.className = "td";
	child.type = "number";
	child.min = 0;
	child.value = count;
	child.placeholder = "Anzahl";
	child = A(node)(C("input"));
	child.className = "td";
	child.type = "text";
	child.value = name;
	child.placeholder = "Gegenstandsname";
	child = A(node)(C("textarea"));
	child.className = "td";
	child.value = description;
	child.placeholder = "Beschreibung";
	return node;
};

const entryAdderNode = (faketable, nodegen, subnode = null) => {
	// TODO give more options
	let node = C("div");
	node.className = "append-button-div tr";
	if (subnode) A(node)(subnode).className = "td";
	let child = A(node)(C("button"));
	child.className = "append-button td";
	child.innerText = "+";
	child.type = "button";
	child.onclick = () => faketable.insertBefore(nodegen(subnode ? subnode : ""), faketable.lastChild);
	return node;
};

const characterSubmitterNode = () => {
	let node = C("div");
	node.className = ftprefix + "submit";
	const close = (ev) => {
		if(ev.target.value == "confirm") {
			let sheet = {
				name: Q(ftprefix + "name").value,
				backstory: Q(ftprefix + "backstory").value,
				hitpoints: 20,
				attributes: [],
				stats: [],
				skills: [],
				inventory: [],
				notes: ""
				// TODO store data here, also save default values
			};
			attributeNames.forEach(attr => sheet.attributes.push(parseInt(Q(ftprefix + codify(attr)).value)));
			let refnode = Q(ftprefix + "stats");
			let inode;
			for(inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sheet.stats.push({
				name: inode.firstChild.innerText,
				value: parseInt(inode.lastChild.value)
				// TODO add base stats
			});
			refnode = Q(ftprefix + "skills");
			for(inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sheet.skills.push({
				name: inode.firstChild.innerText,
				value: inode.lastChild.checked
			});
			refnode = Q(ftprefix + "inventory");
			for(inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sheet.inventory.push({
				count: parseInt(inode.firstChild.value),
				name: inode.firstChild.nextSibling.value,
				description: inode.lastChild.value
			});
			cache.sheets.push(sheet);
			cache.selected.sheet = cache.sheets.length - 1;
			fullUpdateSheet();
		}
		//Q("sheet").removeChild(Q("dialog"));
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
	let _ = A(form);

	_(nameNode());
	let child = _(C("div"));
	A(child)(h2Node("Backstory"));
	A(child)(textareaNode(ftprefix + "backstory", "Backstory"));
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
	Q("sheet").insertBefore(dialog, Q("sheet").firstChild);
	dialog.show();
};

const download = () => {
	let node = C("a");
	if (!cache.sheets[cache.selected.sheet]) return;
	node.href = "data:text/json;charset=utf-8," + encodeURI(JSON.stringify(cache.sheets[cache.selected.sheet]));
	node.download = codify(cache.sheets[cache.selected.sheet].name) + ".json";
	node.click();
}

const fullUpdateSheet = () => {
	const character = cache.sheets[cache.selected.sheet];
	if (!character) return;
	let sheet = Q("sheet");
	sheet.innerHTML = "";
	const _ = A(sheet);

	_(nameNode(character.name));
	let child = _(C("div"));
	child.id = "backstory";
	A(child)(h2Node("Backstory"));
	child.innerHTML += "<p>" + character.backstory.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
	child = _(fakeTableNode("attributes"));
	A(child)(h2Node("Attribute"));
	attributeNames.forEach((attr, index) => A(child)(slide50Node(attr, attr, character.attributes[index])));

}
