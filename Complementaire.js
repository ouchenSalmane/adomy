var parser = require("ical");
var fs = require('fs');
//var test = parser.parseFile('./exad.ics');


/*
	Function permettant de retourner un fichier iCAL contenant les crénaux où personne n'est diponible
	Paramètre : EDTS -> Tableau contenant les chemin des fichiers iCal cotenant les emploi du temps
	Return : Un fichier iCal contenant les les crénaux non disponible
*/
function Complementaire(EDTs){

}


/*
	Function permettant de savoir si un fichier existe ou non
*/
function fileExist(path){
	var exist = true;
	fs.access('./test.t',function(err){
	if(err.code == 'ENOENT'){
		exist = false;
	}
});

	return exist;
}
