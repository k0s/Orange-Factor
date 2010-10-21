
function getPlatformID(plat) {
  for (p in platforms) {
    if (p == plat) {
      return platforms[p];
    }
  }
  return '';
}

function getMapID(number) {
  if (number == 0) {
    return "green";
  } else if (number < 5) {
    return "yellow";
  } else if (number < 10) {
    return "orange";
  }
  return "red";
}

function buildHeatMap(data) {
  var gData = data;
  var results = {};
  var total = 0;
  for (row in data.rows) {
    var oranges = data.rows[row].value.oranges;
    total += oranges.length;
    results = buildDailyHeatMap(oranges, results);
  }
  return [results, total];
}

function buildDailyHeatMap(oranges, results) {    
  for (platform in platforms) {
    if (results[platform] === undefined)
      results[platform] = Array();

    for (testrun in testruns) {
      for (type in buildtypes) {
        if (typeof(testruns[testrun]) != "object") {
          var blob = {};
          blob[testrun] = testruns[testrun];
        } else {
          blob = testruns[testrun];
        }
        for (sub in blob) {
          var pr = results[platform];
          var testid = testrun + type + sub;
          if (testrun == sub) {
            testid = testrun + type;
          }
          pr[testid] = [0, blob[sub]];
             
          for (orange in oranges) {
            var or = oranges[orange];                    
            if (or.platform == platforms[platform] &&
                or.test == blob[sub] &&
                or.buildtype == buildtypes[type]) {
                  pr[testid][0] += 1;
            }
          } //orange in oranges
        } //sub in blob
      } //type in buildtypes
    } //testrun in testruns
  } //platform in platforms
  return results;
}
  
  
function displayHeatMap(app, id, args) {
  var startday = args['startday'];
  var endday = args['endday'];

  if (startday == "" || startday === undefined) {
    startday = '';
  }
  if (endday == "" || endday === undefined) {
    endday = getTboxDate();
  }
      
  app.db.view('woo/date', 
     {success: function(data) {
        text = '';

        var hm = buildHeatMap(data);
        var dr = getDateRange(data);
        if (startday == "") startday = dr[0];
        if (endday == "") endday = dr[1];
        var metric = calculateMetric(data);
              
        text += '<p><span id="title">';
        if (dr[0] == dr[1]) {
          text += dr[0];
        } else {
          text += dr[0] + ' to ' + dr[1];
        }
        text += ' - </span><span id="subtitle">';
        
        if (dr[0] != dr[1]) {
          text += metric[0] + ' Orange Factor ';
        }
        text += '(' + hm[1] + ' failures, ' + metric[2] + ' pushes)';
        text += '</span></p>';

        text += "<table>";
        var results = hm[0];
        for (plat in results) {
          text += '<tr><td>' + plat + "&nbsp;</td><td>";
          var started = false;
          var type = 'o';
          for (item in results[plat]) {
            text += '';
            var mapid = getMapID(results[plat][item][0]);
            if (item.indexOf('M') >= 0) {
              if (item.indexOf('d') > 0) type = 'd';
              if (!started) {
                started = true;
                text += 'M' + type + '(';
              }
              var parts = item.split(type, 2);
              text += '<span id="' + mapid + '">';
              text += '<a href="'
              text += buildUrl('TestRun', {
                plat: getPlatformID(plat),
                test: results[plat][item][1],
                branch: 'mozilla-central',
                type: 'opt',
                startday: startday,
                endday: getTboxDate(getDate(endday), -1)
              });
              text += '" id="' + mapid + '">';
              text += parts[1] + '</a>';
              text += '</span>&nbsp;';
              if (parts[1] == 'Oth') {
                started = false;
                text += ')&nbsp;';
              }
            } else {
              text += '<span id="' + mapid + '">';
              text += '<a href="'
              text += buildUrl('TestRun', {
                plat: getPlatformID(plat),
                test: results[plat][item][1],
                branch: 'mozilla-central',
                type: 'opt',
                startday: startday,
                endday: getTboxDate(getDate(endday), -1)
              });
              text += '" id="' + mapid + '">';
              text += item + '</a>';
              text += '&nbsp;</span>&nbsp;';
            }
          }
          text += "</td></tr>";
        }
        text += "</table>";
            
        $(id).html(text);
        var det = '';
        if (dr[0] != dr[1]) {
          showLineGraph(metric[3], "Orange Factor", startday, endday);
        } else {
          var graphdata = [];
          var dayresults = {};
          var doneit = false;
          for (rplat in results) {
            for (testid in results[rplat]) {
              if (dayresults[rplat] === undefined) {
                dayresults[rplat] = 0;
              }
              dayresults[rplat] += results[rplat][testid][0];
            }
          }
          
          for (rplat in dayresults) {
            graphdata.push([getPlatformAsArray(rplat)[1], dayresults[rplat]]);
          }
          showBarGraphDay(graphdata, 'All', 'All', startday, endday);

          det += displayDetails(app, data, '', '', '', '', startday, endday);
        }
        $("#details").html(det);
      },
      startkey: [startday],
      endkey: [endday],
      });
}
  

