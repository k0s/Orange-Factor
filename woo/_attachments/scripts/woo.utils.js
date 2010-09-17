
platforms = {'Linux':'Fedora 12',
             'Linux 64':'Fedora 12x64',
             'OS X':'MacOSX Leopard 10.5.8',
             'OS X64':'MacOSX Snow Leopard 10.6.2',
//             'WinXP':'WINNT 5.1',
             'Win2003':'WINNT 5.2',
             'Win7':'WINNT 6.1'};
testruns = {'M':{'1':'mochitests-1/5',
                 '2':'mochitests-2/5',
                 '3':'mochitests-3/5',
                 '4':'mochitests-4/5',
                 '5':'mochitests-5/5',
                 'Oth':'mochitest-other'},
            'R':'reftest',
            'C':'crashtest',
            'J':'jsreftest',
            'X':'xpcshell'};
branches = {'m-c':'mozilla-central'};
buildtypes = {'o':'opt', 'd':'debug'};

function clearPage() {
  $("#display").html('');
  $("#placeholder").html('');
  $("#details").html('');
  $("#misc").html('');
  $("#tooltip").remove();
}

function getPlatformAsArray(val) {
  var plats = [];
  var values = [];
  for (platform in platforms) {
    plats.push(platform);
    values.push(platforms[platform]);
  }

  if (val === undefined) {
    return [plats, values];
  }
  for (v in values) {
    if (val == values[v]) {
      return [plats, v];
    }
  }
  for (v in plats) {
    if (val == plats[v]) {
      return [plats, v];
    }
  }
  return [plats, 0];
}

function getDateRange(data, keyindex) {
  if (keyindex === undefined) {
    keyindex = 0;
  }
  
  var firstdate = getTboxDate(new Date());
  var lastdate = getTboxDate(new Date(1971,00,01));
  for (row in data.rows) {
    firstdate = findLowerDate(firstdate, data.rows[row].key[keyindex]);
    lastdate = findLaterDate(lastdate, data.rows[row].key[keyindex]);
  }
  return [firstdate, lastdate];
}

function getTboxDate(today, delta) {
  if (today === undefined || today == '') {
    today = new Date();
  }
  if (delta === undefined || delta == '') {
    delta = 0;
  }

  var reference = new Date(Date.parse(today) + (delta*(60*60*24*1000)));
  var month = reference.getMonth() + 1;
  var day = reference.getDate();
  if (day < 10) day = "0" + day;

  if (month < 10) month = "0" + month;
  var reference_format = reference.getFullYear() + "-" + month + "-" + day;
  return reference_format;    
}

function buildTboxDate(year, month, day, delta) {
  var date = new Date(year, month, day);
  return getTboxDate(date, delta);
}

function getDate(tbox) {
  var aparts = tbox.split('-');
  return new Date(aparts[0], parseInt(aparts[1],10) - 1, aparts[2]);
}

function findLowerDate(a, b) {
  if (a === undefined || a == null || a == '') return b;
  if (b === undefined || b == null || b == '') return a;
  if (getDate(a) < getDate(b))
    return a;
  return b;
}
  
function findLaterDate(a, b) {
  if (getDate(a) > getDate(b))
    return a;
  return b;
}
  
function calculateMetric(data, range) {
  var history = [];
  if (range === undefined) {
    range = {"startdate":null,
             "enddate":null,
             "platform":null,
             "branch":null,
             "buildtype":null,
             "testrun":null};
  }
    
  var totalpushes = 0;
  var totaloranges = 0;
  var count = 0;
  minCount = 10;
  for (row in data.rows) {
    if (data.rows[row] != null && data.rows[row].key != null) {
      totalpushes += data.rows[row].key[1];
      var value = data.rows[row].value;
      if (typeof(value) == "object") {
        totaloranges += value.oranges.length;
      } else {
        totaloranges += value;
      }
      if (count >= minCount) {
        var parts = data.rows[row].key[0].split('-');
        var d = new Date(parts[0], (parseInt(parts[1], 10) -1), parts[2]);
        history.push([d.getTime(), Math.floor((totaloranges / totalpushes) * 100) / 100]);
      }
      count++;
    }
  }
  return [Math.floor((totaloranges / totalpushes) * 100) / 100, totaloranges, totalpushes, history];
}


