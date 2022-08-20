
const Q = (id) => document.getElementById(id);
const C = (tagname) => document.createElement(tagname);
const A = (parent) => (child) => parent.appendChild(child);

let cache = {
	sheets: [],
	templates: [],
	selected: {
		sheet: 0
	}
};

let statGroup = {};

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
	if (localStorage.getItem("sheets") && localStorage.getItem("selected")) {
		cache.sheets = JSON.parse(localStorage.getItem("sheets"));
		// cache.templates = JSON.parse(localStorage.getItem("templates"));
		cache.selected = JSON.parse(localStorage.getItem("selected"));
		fullUpdateSheet();
	}
	// Q("hitpoints").addEventListener("input", updateHitpoints);
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
	node.onchange = (ev) => {
		appendTemplateStats(Q("cc-stats"), cache.templates[ev.target.value]);
		appendTemplateSkills(Q("cc-skills"), cache.templates[ev.target.value]);
		Q(ftprefix + "points").updateAttributes();
		Q(ftprefix + "points").updateOthers();
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

const maxBase = (attributes, index = -1) => {
	let max_base = 0;
	attributes.forEach(attr => {
		let attr_base;
		if (index > -1) attr_base = parseInt(Q(attr).value);
		else attr_base = parseInt(Q(ftprefix + codify(attr)).value);
		max_base = max_base < attr_base ? attr_base : max_base;
	});
	return max_base;
}

const slide50Node = (name, attributes = undefined, value = 0, min = 0, index = -1) => {
	/*
	<div class="tr $(codify attribute)">
		<label class="td" for="$(codify name)">$name</label>
		<input class="td" type="range" min="0" max="50" name="$(codify name)" value="$value">
	</div>
	*/
	if (!attributes) attributes = [name];
	let node = C("div");
	node.classList.add("tr");
	attributes.forEach(attr => node.classList.add(codify(attr)));
	let child = A(node)(C("label"));
	child.className = "td";
	child.for = codify(name);
	child.innerText = name;
	child = A(node)(C("input"));
	child.className = "td";
	child.name = codify(name);
	child.type = "number";
	child.min = min;
	child.max = min + 50;
	child.value = min + value;
	let input_methods = [];
	input_methods.push(child);
	child = A(node)(C("span"));
	child.className = "td";
	child.innerText = Math.round((min + value) / 2);
	child = A(node)(C("span"));
	child.className = "td";
	child.innerText = Math.round((min + value) / 5);
	child = A(node)(C("input"));
	child.className = "td";
	child.name = codify(name);
	child.id = index > -1 ? codify(name) : ftprefix + codify(name);
	child.type = "range";
	child.min = min;
	child.max = min + 50;
	child.value = min + value;
	input_methods.push(child);
	if (attributes[0] != name) {
		input_methods[0].oninput = () => {
			const value = parseInt(input_methods[0].value);
			input_methods[1].value = value;
			input_methods[0].nextSibling.innerText = Math.round(value / 2);
			input_methods[0].nextSibling.nextSibling.innerText = Math.round(value / 5);
			if (index > -1) {
				cache.sheets[cache.selected.sheet].stats[index].value = (input_methods[1].value - input_methods[1].min);
				storeLocally();
			} else Q(ftprefix + "points").updateOthers();
		};
		input_methods[1].oninput = () => {
			const value = parseInt(input_methods[1].value);
			input_methods[0].value = value;
			input_methods[0].nextSibling.innerText = Math.round(value / 2);
			input_methods[0].nextSibling.nextSibling.innerText = Math.round(value / 5);
			if (index > -1) {
				cache.sheets[cache.selected.sheet].stats[index].value = (input_methods[1].value - input_methods[1].min);
				storeLocally();
			} else Q(ftprefix + "points").updateOthers();
		};
		node.attrup = () => {
			let max_base = maxBase(attributes, index);
			input_methods.forEach(im => {
				let diff = (input_methods[1].value - im.min);
				im.min = max_base;
				im.max = max_base + 50;
				im.value = max_base + diff;
			});
		};
	} else {
		input_methods[0].step = 2;
		input_methods[0].max = 100;
		input_methods[0].value = value * 2;
		input_methods[0].nextSibling.innerText = value;
		input_methods[0].nextSibling.nextSibling.innerText = Math.round(value * 2 / 5);
		input_methods[0].oninput = () => {
			const value = parseInt(input_methods[0].value) / 2;
			input_methods[1].value = value;
			input_methods[0].nextSibling.innerText = value;
			input_methods[0].nextSibling.nextSibling.innerText = Math.round(value * 2 / 5);
			statGroup[codify(name)].forEach(statnode => statnode.attrup());
			if (index > -1) {
				cache.sheets[cache.selected.sheet].attributes[index] = parseInt(input_methods[1].value);
				storeLocally();
			} else Q(ftprefix + "points").updateAttributes();
		};
		input_methods[1].oninput = () => {
			const value = parseInt(input_methods[1].value);
			input_methods[0].value = value * 2;
			input_methods[0].nextSibling.innerText = value;
			input_methods[0].nextSibling.nextSibling.innerText = Math.round(value * 2 / 5);
			statGroup[codify(name)].forEach(statnode => statnode.attrup());
			if (index > -1) {
				cache.sheets[cache.selected.sheet].attributes[index] = parseInt(input_methods[1].value);
				storeLocally();
			} else Q(ftprefix + "points").updateAttributes();
		};
	}
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
	return node;
};

const appendTemplateStats = (faketable, template) => {
	let refpoint = faketable.lastChild;
	while (!refpoint.previousSibling.isSameNode(faketable.firstChild)) faketable.removeChild(refpoint.previousSibling);
	attributeNames.forEach(attr => statGroup[codify(attr)] = []);
	template.stats.forEach(stat => {
		let statnode = slide50Node(stat.name, stat.base);
		faketable.insertBefore(slide50Node(stat.name, stat.base), refpoint);
		stat.base.forEach(attr => statGroup[codify(attr)].push(refpoint.previousSibling));
	});
};

const skillNode = (name, checked = false, index = -1) => {
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
	child.checked = checked;
	if (index > -1) child.onchange = () => {
		cache.sheets[cache.selected.sheet].skills[index].value = child.checked;
		storeLocally();
	};
	else child.onchange = () => {
		Q(ftprefix + "points").updateOthers();
	};
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

const itemNode = (name = "", index = -1, count = 1, description = "") => {
	// TODO define input-data names.
	let node = C("div");
	node.className = "tr";
	let child = A(node)(C("input"));
	child.className = "td";
	child.type = "number";
	child.min = 0;
	child.value = count;
	child.placeholder = "Anzahl";
	let item_args = [];
	item_args.push(child);
	child = A(node)(C("input"));
	child.className = "td";
	child.type = "text";
	child.value = name;
	child.placeholder = "Gegenstandsname";
	item_args.push(child);
	child = A(node)(C("textarea"));
	child.className = "td";
	child.value = description;
	child.placeholder = "Beschreibung";
	item_args.push(child);
	if (index > -1) {
		item_args[0].onchange = () => {
			cache.sheets[cache.selected.sheet].inventory[index].count = parseInt(item_args[0].value);
			storeLocally();
		};
		item_args[1].oninput = () => {
			cache.sheets[cache.selected.sheet].inventory[index].name = item_args[1].value;
			storeLocally();
		};
		item_args[2].oninput = () => {
			cache.sheets[cache.selected.sheet].inventory[index].description = item_args[2].value;
			storeLocally();
		};
	}
	return node;
};

const entryAdderNode = (faketable, nodegen, subnode = null, getindex = null, action = () => undefined) => {
	// TODO give more options and more arguments to nodegen
	let node = C("div");
	node.className = "append-button-div tr";
	if (subnode) A(node)(subnode).className = "td";
	let child = A(node)(C("button"));
	child.className = "append-button td";
	child.innerText = "+";
	child.type = "button";
	child.onclick = () => {
		action();
		faketable.insertBefore(nodegen(subnode ? subnode : "", getindex ? getindex() : -1), faketable.lastChild);
	}
	return node;
};

const pointCounterNode = () => {
	let node = C("div");
	node.id = ftprefix + "points";
	// Keep these around if someone believes in an easy cheat, to have redundancy.
	let child = A(node)(C("input"));
	child.type = "hidden";
	child.name = ftprefix + "points-attributes";
	child.id = child.name;
	child.value = 0;
	child = A(node)(C("input"));
	child.type = "hidden";
	child.name = ftprefix + "points-other";
	child.id = child.name;
	child.value = 0;
	child = A(node)(fakeTableNode("points-display", ftprefix));
	child.innerHTML = "<div class='tr'><div class='td'>Attribute</div><div class='td' id='" + ftprefix + "points-attributes-display'>0</div></div><div class='tr'><div class='td'>Werte, Skills</div><div class='td' id='" + ftprefix + "points-other-display'>0</div></div>";
	node.updateAttributes = () => {
		let sum = attributeNames.reduce((prev, current) => prev + parseInt(Q(ftprefix + codify(current)).value), 0);
		Q(ftprefix + "points-attributes").value = sum;
		Q(ftprefix + "points-attributes-display").innerText = sum + "/" + cache.templates[Q("template-chooser").value].attribute_points;
	};
	node.updateOthers = () => {
		let refnode = Q(ftprefix + "stats");
		let inode;
		let sum = 0;
		for (inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sum += (inode.lastChild.value - inode.lastChild.min);
		refnode = Q(ftprefix + "skills");
		for (inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sum += inode.lastChild.checked ? 15 : 0;
		Q(ftprefix + "points-other").value = sum;
		Q(ftprefix + "points-other-display").innerText = sum + "/" + cache.templates[Q("template-chooser").value].stat_points;
	};
	node.valid = () => {
		return parseInt(Q(ftprefix + "points-attributes").value) == cache.templates[Q("template-chooser").value].attribute_points && parseInt(Q(ftprefix + "points-other").value) == cache.templates[Q("template-chooser").value].stat_points;
	};
	return node;
};

const characterSubmitterNode = () => {
	let node = C("div");
	node.className = ftprefix + "submit";
	const close = (ev) => {
		if (ev.target.value == "confirm" && Q(ftprefix + "name").value && Q(ftprefix + "points").valid()) {
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
			for (inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) {
				let base = [];
				inode.classList.forEach(cls => { if (cls != "tr") base.push(cls) });
				sheet.stats.push({
					name: inode.firstChild.innerText,
					value: (inode.lastChild.value - inode.lastChild.min),
					base: base
				});
			}
			refnode = Q(ftprefix + "skills");
			for (inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sheet.skills.push({
				name: inode.firstChild.innerText,
				value: inode.lastChild.checked
			});
			refnode = Q(ftprefix + "inventory");
			for (inode = refnode.firstChild.nextSibling; !inode.isSameNode(refnode.lastChild); inode = inode.nextSibling) sheet.inventory.push({
				count: parseInt(inode.firstChild.value),
				name: inode.firstChild.nextSibling.value,
				description: inode.lastChild.value
			});
			cache.sheets.push(sheet);
			cache.selected.sheet = cache.sheets.length - 1;
			fullUpdateSheet();
		}
		else if (ev.target.value == "cancel")
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
	cache.selected.sheet = -1;
	fullUpdateSheet();
	// TODO do more than a demo here!
	let dialog = C("dialog");
	dialog.id = "dialog";
	A(dialog)(templateChooserNode());
	let form = A(dialog)(C("form"));
	form.method = "dialog";
	let _ = A(dialog);

	_(nameNode());
	let child = _(C("div"));
	A(child)(h2Node("Backstory"));
	A(child)(textareaNode(ftprefix + "backstory", "Backstory"));
	child = _(fakeTableNode("attributes", ftprefix));
	A(child)(h2Node("Attribute"));
	attributeNames.forEach(attr => {
		A(child)(slide50Node(attr));
		statGroup[codify(attr)] = [];
	});
	child = _(fakeTableNode("stats", ftprefix));
	A(child)(h2Node("Werte"));
	A(child)(entryAdderNode(child, (subnode) => slide50Node(subnode.firstChild.value, [...subnode.lastChild.selectedOptions].map(opt => opt.value)), statAdderNode()));
	child = _(fakeTableNode("skills", ftprefix));
	A(child)(h2Node("Andere Skills"));
	A(child)(entryAdderNode(child, (subnode) => skillNode(subnode.value), skillAdderNode()));
	child = _(fakeTableNode("inventory", ftprefix));
	A(child)(h2Node("Inventar"));
	A(child)(entryAdderNode(child, itemNode));
	_(pointCounterNode());
	_(characterSubmitterNode());
	Q("sheet").insertBefore(dialog, Q("sheet").firstChild);
	dialog.show();
};

const download = () => {
	if (!cache.sheets[cache.selected.sheet]) return;
	let node = C("a");
	node.href = "data:text/json;charset=utf-8," + encodeURI(JSON.stringify(cache.sheets[cache.selected.sheet]));
	node.download = codify(cache.sheets[cache.selected.sheet].name) + ".json";
	node.click();
};

const upload = () => {
	let node = C("dialog");
	let child = A(node)(C("form"));
	child.method = "dialog";
	const _ = A(child);
	child = _(C("input"));
	child.type = "file";
	child.accept = ".json";
	child.id = "file-picker";
	child = _(C("button"));
	child.innerText = "Load";
	child.onclick = () => {
		const reader = new FileReader();
		reader.onload = () => {
			cache.sheets.push(JSON.parse(reader.result));
			cache.selected.sheet = cache.sheets.length - 1;
			fullUpdateSheet();
		};
		reader.readAsText(Q("file-picker").files[0]);
		Q("sheet").removeChild(node);
	};
	Q("sheet").insertBefore(node, Q("sheet").firstChild);
	node.show();
}

const storeLocally = () => {
	localStorage.setItem("sheets", JSON.stringify(cache.sheets));
	localStorage.setItem("selected", JSON.stringify(cache.selected));
};

const characterSelectNode = (sheet_id) => {
	let node = C("li");
	if (sheet_id == cache.selected.sheet) node.style.fontWeight = "bold";
	node.className = "character-select";
	let child = A(node)(C("a"));
	child.innerText = cache.sheets[sheet_id].name;
	child.onclick = () => {
		cache.selected.sheet = sheet_id;
		fullUpdateSheet();
	};
	child = A(node)(C("button"));
	child.innerText = "🗑";
	child.onclick = () => {
		cache.sheets.splice(sheet_id, 1);
		if (cache.selected.sheet > 0) cache.selected.sheet--;
		fullUpdateSheet();
	};
	return node;
};

const appendCharacterSelectNodes = () => {
	let node = Q("character-list");
	node.innerHTML = "";
	cache.sheets.forEach((_, id) => A(node)(characterSelectNode(id)));
};

const fullUpdateSheet = () => {
	storeLocally();
	const character = cache.sheets[cache.selected.sheet];
	appendCharacterSelectNodes();
	let sheet = Q("sheet");
	sheet.innerHTML = "";
	if (!character) return;
	const _ = A(sheet);

	_(nameNode(character.name));
	let child = _(C("div"));
	child.id = "backstory";
	A(child)(h2Node("Backstory"));
	child.innerHTML += "<p>" + character.backstory.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
	child = _(fakeTableNode("attributes"));
	A(child)(h2Node("Attribute"));
	attributeNames.forEach((attr, index) => {
		A(child)(slide50Node(attr, [attr], character.attributes[index], 0, index));
		statGroup[codify(attr)] = [];
	});
	child = _(fakeTableNode("stats"));
	A(child)(h2Node("Werte"));
	character.stats.forEach((stat, index) => {
		let max_base = maxBase(stat.base, index);
		let statNode = A(child)(slide50Node(stat.name, stat.base, stat.value, max_base, index));
		stat.base.forEach(attr => statGroup[attr].push(statNode));
	});
	child = _(fakeTableNode("skills"));
	A(child)(h2Node("Andere Skills"));
	character.skills.forEach((skill, index) => A(child)(skillNode(skill.name, skill.value, index)));
	child = _(fakeTableNode("inventory"));
	A(child)(h2Node("Inventar"));
	character.inventory.forEach((item, index) => A(child)(itemNode(item.name, index, item.count, item.description)));
	A(child)(entryAdderNode(child, itemNode, null, () => (cache.sheets[cache.selected.sheet].inventory.length - 1), () => character.inventory.push({
		count: 1,
		name: "",
		description: ""
	})));
	child = _(C("div"));
	A(child)(h2Node("Notizen"));
	child = A(child)(textareaNode("notes", "Hier kommen deine Notizen hin.", character.notes));
	child.cols = 30;
	child.rows = 5;
	child.oninput = () => {
		character.notes = child.value;
		storeLocally();
	};
};
