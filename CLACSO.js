{
	"translatorID": "a6f95213-468c-4558-94a3-59b2436cbcdd",
	"label": "CLACSO",
	"creator": "Sebastian Karcher",
	"target": "^https?://biblioteca\\.clacso\\.edu\\.ar/gsdl/cgi-bin/",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "g",
	"lastUpdated": "2013-02-26 23:50:19"
}

/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2013 Sebastian Karcher 
	
	This file is part of Zotero.
	
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	
	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
	
	***** END LICENSE BLOCK *****
*/


function detectWeb(doc, url) {
	if (ZU.xpath(doc, '//div[@class="document"]/div[@class="documenttext"]').length>0) return getType(doc);
	else if (ZU.xpath(doc, '//div[@class="document"]/div[@class="divbar"]').length>0) return "multiple";
}

function cleanAuthorstring(author) {
  	//removes author function
	author = author.replace(/-\s*(Autor\/a|Compilador\/a o Editor\/a)/, "");
	return author
}

function authorRole(author){
	var role;
	//this may be overkill for a function, but may be necessary to add more.
	if (author.search(/\-\s*Compilador\/a o Editor\/a/)!=-1) role = "editor";
	else role = "author";
	return role;
	}

function getType (doc){
	var itemType = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Tipo de documento")]]/following-sibling::td');
	var type;
	if (itemType){
		if (itemType.indexOf("Doc. de trabajo")!=-1){
			type= "report";
		}
		else if (itemType.indexOf("Capítulo de Libro")!=-1){
			type= "bookSection";
		}
		else if (itemType.indexOf("Capítulo de Libro")!=-1){
			type= "bookSection";
		}
		else if (itemType.indexOf("Artículo")!=-1){
			type= "journalArticle";
		}
		else if (itemType.indexOf("Ponencia")!=-1){
			type= "presentation";
		}
		else if (itemType.indexOf("Tesis")!=-1){
			type= "thesis";
		}
		else type = "book";
	
	return type;
	}
}

function scrape(doc, url) {
	
	var newItem = new Zotero.Item(getType(doc));
	var title = ZU.xpathText(doc, '//tbody/tr/td[span/b[contains(text(), "Título")]]/following-sibling::td');
	var publication = ZU.xpathText(doc, '//tr/td[@id="bold" and contains(text(), "Revista")]/following-sibling::td');
	var date = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Fecha")]]/following-sibling::td');
	var identifier = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Identificador")]]/following-sibling::td/text()');
	var language = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Idioma")]]/following-sibling::td/text()');
	var publisher = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Editorial")]]/following-sibling::td');
	var place = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Ciudad")]]/following-sibling::td');
	var abstract = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Resumen")]]/following-sibling::td');
	var content = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Contenidos")]]/following-sibling::td');
	var pages = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Extensión")]]/following-sibling::td');
	var fulltext = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "URL")]]/following-sibling::td');

	
	//Descripción field has pages, issue and volume
	var publication;
	var volume;
	var issue;
	var description = ZU.xpathText(doc, '//tbody/tr/td[b[contains(text(), "Cita Bibliográfica")]]/following-sibling::td');
	if (description) {
		//We perform regex acrobatics to maybe parse some of the citation info. It's not great, but better than nothing
		publication = description.match(/^(En:)?\s*(.+?)\s*([.\(\,]|Año)/);
		volume = description.match(/(Año|vol\.?)\s*([\dIVX]+)/);
		issue = description.match(/no\.\s*(\d+)/);
	}
	
	//Authors
	var authors = ZU.xpath(doc, '//tbody/tr/td[b[contains(text(), "Autor")]]/following-sibling::td/a');
	var author;
	var role;
	for (var i in authors) {
		 role;
		 //TODO: define more author roles
		 author = cleanAuthorstring(authors[i].textContent);
		 role = authorRole(author)
		 newItem.creators.push(ZU.cleanAuthor(author, role, true));
	}
	

	// TAGS
	var tags = ZU.xpath(doc, '//tbody/tr/td[b[contains(text(), "Temas")]]/following-sibling::td/a');
	for (var i in tags) {
		 newItem.tags.push(tags[i].textContent);
	}
	
	//distinguish between page ranges and num of pages
	var numPages;
	var pagerange;
	if (pages){
		if (pages.search(/\sp\./)!=-1){
			numPages = pages.replace(/p\./, "");
		}
		else if (pages.search(/pp\./)!=-1){
			pagerange = pages.replace(/pp\./, "");
		}
	}
	
	var ISBN;
	var ISSN;
	if (identifier){
		if (identifier.indexOf("ISBN")!=-1){
			ISBN = ZU.cleanISBN(identifier)
		}
		if (identifier.indexOf("ISSN")!=-1){
			ISSN = identifier;
		}
		
	}

	if (fulltext) {
		fulltext = fulltext.trim();
		if (fulltext.search(/\.pdf/) != -1) {
			newItem.attachments.push({
				url: fulltext,
				title: "CLASSO Full Text PDF",
				mimeType: "application/pdf"
			})
		} else {
			newItem.attachments.push({
				url: fulltext,
				title: "CLACSO Full Text",
				mimeType: "text/html"
			})
		}
	}
	newItem.attachments.push({
		document: doc,
		title: "CLACSO Record Snapshot",
		mimeType: "text/html"
	})
	newItem.title = title;
	if (publication) newItem.publication = publication[2];
	newItem.date = date;
	newItem.place = place;
	newItem.publisher = publisher;
	newItem.numPages = numPages;
	newItem.pages = pagerange;
	if (volume) newItem.volume = volume[2];
	if (issue) newItem.issue = issue[1];
	if (abstract) newItem.abstractNote = abstract.replace(/\n+/g, "; ");
	newItem.ISSN = ISSN;
	newItem.ISBN = ISBN;
	newItem.language = language;
	if (content)  newItem.notes.push(content);
	newItem.complete();
}


function doWeb(doc, url) {

	var articles = new Array();
	var items = {};
	if (detectWeb(doc, url) == "multiple") {
		//this currently doesn't do anything as multiple detect is disabled
		var rows = ZU.xpath(doc, '//table[@id="toc_top"]/tbody/tr');
		var title;
		var link;
		for (var i in rows){
			title = ZU.xpathText(rows[i], './td/b');
			link = ZU.xpathText(rows[i], './td/a[contains(@href, "/gsdl/cgi-bin/library.cgi?")]/@href');
			items[link] = title;
		}

		Zotero.selectItems(items, function (items) {
			if (!items) {
				return true;
			}
			for (var i in items) {
				articles.push(i);
			}
			//Z.debug(articles)
			Zotero.Utilities.processDocuments(articles, scrape);
		})
	} else {
		scrape(doc, url);
	}
}/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://132.248.9.1:8991/F/J5PQFH44IIKCKQBMV1TMTSRNRXDL4BX5VRM7MKSLR453CD3951-00456?func=full-set-set&set_number=164623&set_entry=000034&format=999",
		"items": [
			{
				"itemType": "journalArticle",
				"creators": [
					{
						"firstName": "Murillo de",
						"lastName": "Aragao",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"Gobierno",
					"Partidos políticos",
					"Finanzas públicas",
					"Condiciones económicas",
					"Brasil",
					"Programa de Aceleración del Crecimiento"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "CLASE Record Snapshot",
						"mimeType": "text/html"
					}
				],
				"title": "O andamento do PAC e o ambiente pre-eleitoral",
				"publication": "Conjuntura economica (Rio de Janeiro)",
				"date": "2009",
				"pages": "34-35",
				"volume": "63",
				"issue": "6",
				"ISSN": "0010-5945",
				"language": "Portugués",
				"libraryCatalog": "CLASE"
			}
		]
	},
	{
		"type": "web",
		"url": "http://132.248.9.1:8991/F/J5PQFH44IIKCKQBMV1TMTSRNRXDL4BX5VRM7MKSLR453CD3951-01032?func=full-set-set&set_number=164623&set_entry=000016&format=999",
		"items": [
			{
				"itemType": "journalArticle",
				"creators": [
					{
						"firstName": "Marcela",
						"lastName": "Román",
						"creatorType": "author"
					},
					{
						"firstName": "F. Javier",
						"lastName": "Murillo",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"Educación básica",
					"Problemas sociales",
					"América Latina",
					"Violencia escolar",
					"Desempeño escolar",
					"Indicadores socioeconómicos"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "CLASE Full Text PDF",
						"mimeType": "application/pdf"
					},
					{
						"title": "CLASE Record Snapshot",
						"mimeType": "text/html"
					}
				],
				"title": "América Latina: violencia entre estudiantes y desempeño escolar",
				"publication": "Revista de la CEPAL",
				"date": "2011",
				"pages": "37-54",
				"issue": "104",
				"abstractNote": "Se estimó la magnitud de la violencia escolar en las escuelas latinoamericanas y su incidencia en el desempeño de los estudiantes de primaria. Se analizaron características sociodemográficas del estudiante vinculadas al maltrato entre pares. Se utilizaron modelos multinivel de cuatro y tres niveles con los datos del Segundo Estudio Regional Comparativo y Explicativo (SERCE) de la Organización de las Naciones Unidas para la Educación, la Ciencia y la Cultura (UNESCO), analizándose 2.969 escuelas, 3.903 aulas y 91.223 estudiantes de 6º grado de 16 países latinoamericanos (excluido México al relacionar violencia escolar y desempeño académico). Conclusiones: la violencia interpares es un grave problema en toda la región; los estudiantes que sufrieron violencia de sus iguales alcanzaron un desempeño en lectura y matemáticas significativamente inferior al de quienes no la experimentaron; en aulas con mayores episodios de violencia física o verbal los educandos muestran peores desempeños que en aulas con menor violencia.",
				"ISSN": "0252-0257",
				"language": "Español",
				"libraryCatalog": "CLASE",
				"shortTitle": "América Latina"
			}
		]
	}
]
/** END TEST CASES **/