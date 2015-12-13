/**
 * Created by PC on 01/12/2015.
 */



   months = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mao', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octbore', 'Novembre', 'Décembre'],
    days = ['Mon' , 'Tue' , 'Wed' , 'Thu' , 'Fri' , 'Sat' ,'Sun'];

    /* Dépendances */

    var moment = require('moment');
    var ical = require('ical');
    var csv = require('csv');
    var promise = require("bluebird");
    var iCalGen = require("ical-generator");
    var fs = require('fs');

    /* Variables Globales */

    var every30minutesCreneau = [];
    var events = [];



    /* Fonctions s'éxécutant automatiquement quand on lance le script Script.js
    *
    * C'est ci-dessous que vous devrez implémenter l'interface en lignes de commande.
    *
    * */

loadFromEDT("./test_samples/adomy-contact.ics");
//console.log(getIntersection("30-11-2015"));

//console.log(getComplementaire("30-11-2015"));




    /* Début des fonctions de la librairie */



function iCalFromCSV(filePath)
{
  //Renvoie un string en format iCal
  var eventsCal = [],
      calendar = iCalGen({name: 'Calendrier obtenu du fichier csv '+filePath}),
      csvFile = fs.readFileSync(filePath,'utf8'),
      parserCSV = csv.parse({delimiter: ','});

      parserCSV.on('readable',function(){
          while(ligne = parserCSV.read()){
            eventsCal.push(
              {
                start:new Date(parseInt(ligne[1])),
                end: new Date(parseInt(ligne[2])),
                summary: ligne[3],
                description: ligne[4]
              })
          }
      });

      parserCSV.write(csvFile);

      parserCSV.end()

      for(var i = 0; i < eventsCal.length; i++){
        calendar.createEvent(eventsCal[i])
      }
    return calendar.toString();
}

// Prends le fichier chargé pour le transformer en csv (voir loadFromEDT)
function CSVfromiCal()
{
  //Renvoie une string en format CSV
  var data = '';
  stringifier = csv.stringify({delimiter: ','})
  stringifier.on('readable', function(){
    while(row = stringifier.read()){
      data += row;
    }
  });
  for(var i = 0; i < events.length; i++){
    var tmp = events[i];
    var summary = (tmp.summary == "") ? "Pas de résumé" : tmp.summary;
    var desc = (tmp.description == "")? "Pas de description":tmp.description;
    stringifier.write([tmp.uid,tmp.start,tmp.end,summary,desc]);
  }
  stringifier.end();
  return data;
}


function getTimeIntervention(){
    //Renvoie un object contenant une propriété intervention (nombre total d'intervention) et une durée total 
  var duree = 0;
  for(var i = 0; i < events.length; i++){
      var eve = events[i];
      //La durée est en milliseconde
    duree  += (eve.end - eve.start);
  }
  var duration = moment.duration(duree)._data;
  var hours = duration.hours;
  var minutes = duration.minutes;
  //On souhaite avoir le temps total en heure et minutes, on convertit les jours et mois
  if(duration.days > 0){
    hours += (duration.days * 24);
  }

  return {intervention: events.length, tempsTravail: hours+'H'+minutes+'mn(s)' }
}





function generateTimeCreneaux(startDate)
{
    var day = moment(startDate + '00:00:00' , "DD-MM-YYYY HH:mm:ss");

    for(var j=0; j<7; j++)
    {
        var nbCreneaux = 48;
        var h = 0;

        function loop()
        {
            if(h < nbCreneaux)
            {
                day =  day.clone();
                every30minutesCreneau.push(day);
                day.add(30,'minutes');
                h++;
                loop();
            }
        };
        loop();
}
}

function getIntersection(startDate)
{
    //Renvoi un calendrier iCal contenant tous les creneaux où plus d'un personnel est disponible.

    var calendar = iCalGen({
        name: "Calendrier GRH - Créneaux horaires avec plus d'un personnel disponible"
    });

    generateTimeCreneaux(startDate);

    var creneaux = getCreneauMoreThanOneAvaible();


    creneaux.forEach(function(creneau)
    {
        calendar.createEvent(
            {
                start: creneau[0].subtract(30,'minutes').toDate(),
                end: creneau[0].toDate(),
                summary: 'Plusieurs personells disponibles sur ce créneau',
                description: creneau[1]
            }
        )
    });

    return calendar.toString();

}


function getComplementaire(startDate)
{

    // Renvoi un calendrier iCal contenant les créneaux ou aucun personnel n'est disponible.

    var calendar = iCalGen({
        name: "Calendrier GRH - Créneaux horaires sans personnels disponibles"
    });

    generateTimeCreneaux(startDate);
    var emptyCreneaux = getEmptyCreneaux();
    var iCalResult = null;
    var startIcalCreneau = null;



    for(var i = 0; i < emptyCreneaux.length - 1; i++)
    {
            if(emptyCreneaux[i] != null  && startIcalCreneau == null)
            {
                startIcalCreneau =  emptyCreneaux[i];
            }

            if((emptyCreneaux[i] != null && emptyCreneaux[i + 1] == null && startIcalCreneau != null) ||
                ( startIcalCreneau != null && i == emptyCreneaux.length - 2 ))
            {
                calendar.createEvent(
                    {
                        start: startIcalCreneau.toDate() ,
                        end: emptyCreneaux[i].toDate() ,
                        summary: 'Aucun personnel de disponible'

                    }
                )

                startIcalCreneau = null;
            }
    }

    return calendar.toString();

}

function getEmptyCreneaux()
{
    //Renvoi une collection de creneau moment.js où personne ne travaille.

            return every30minutesCreneau.map(function(creneau)
                {
                    for(var i=0; i < events.length; i++)
                    {
                        var moment1 = moment({ day : events[i].start.getDate(), month: events[i].start.getMonth(), hour: events[i].start.getHours(), minute: events[i].start.getMinutes(), year: events[i].start.getFullYear()});
                        var moment2 = moment({ day : events[i].end.getDate(), month: events[i].end.getMonth(), hour: events[i].end.getHours(), minute: events[i].start.getMinutes(), year: events[i].end.getFullYear()});

                        if(creneau.isBetween(moment1, moment2, "minutes")) {
                            return null;
                        }
                }
                return creneau;
            });

}


function getCreneauMoreThanOneAvaible()
{

    return every30minutesCreneau.map(function(creneau)
    {
        // Renvoi une collection de moment.JS représentant les créneaux ou plus d'un personnel est disponible
        // associé à une string contenant les informations relative aux personnes disponible

       var eventsInCreneau = events.filter(function(event)
        {
            var start = moment({ day : event.start.getDate(), month: event.start.getMonth(), hour: event.start.getHours(), minute: event.start.getMinutes(), year: event.start.getFullYear()});
            var end = moment({ day : event.end.getDate(), month: event.end.getMonth(), hour: event.end.getHours(), minute: event.start.getMinutes() + 1, year: event.end.getFullYear()});

            if(creneau.isBetween(start, end, "minutes"))
            {
                return true;
            }
            else
            {
                return false;
            }
        });

        if(eventsInCreneau.length > 1)
        {
            var infosAboutAvaibleWorkers = eventsInCreneau.length + " Personnels disponibles sur ce créneau \n";
            for(i = 0; i < eventsInCreneau.length; i++)
            {
                infosAboutAvaibleWorkers += ((i + 1) + "/" + eventsInCreneau.length + " : "  +  eventsInCreneau[i].summary) + "\n";
            }
            return [creneau, infosAboutAvaibleWorkers];
        }
        else
        {
            return null;
        }


        }).filter(function(event)
    {
        if(event == null)
        {
            return false;
        }
        else
        {
            return true;
        }
    }
    );





}


function clearMemory()
{
    events = [];
}


function loadFromEDT(filePath)
{
    clearMemory();

    var data = ical.parseFile(filePath);

    for (var k in data){
        if (data.hasOwnProperty(k)) {
            console.log(JSON.stringify(" Import du créneau de disponibilité "  + data[k].summary + " Début " + data[k].start + " Fin " + data[k].end + " " + data[k].start.getDate() + data[k].start.getMonth() +
            data[k].start.getUTCFullYear() + " " + data[k].start.getHours() + data[k].start.getUTCMinutes() ));
            events.push(data[k]);
        }
    }
}
