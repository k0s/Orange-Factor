
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

function clearPage(clearCalendar) {
  $("#display").html('');
  $("#placeholder").html('<p id="loading"><br/><br/><br/>Loading...</p>');
  $("#details").html('');
  $("#misc").html('');
  $("#tooltip").remove();
  if (clearCalendar == true) {
    $("#calendar").html('');
  }
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

function getDateRange(data, keyindex, startday) {
  if (keyindex === undefined) {
    keyindex = 0;
  }
  
  var firstdate = getTboxDate(new Date());
  var lastdate = getTboxDate(new Date(1971,00,01));

  if (startday === undefined) {
    startday = firstdate;
  }

  for (row in data.rows) {
    if (data.rows[row] == null || data.rows[row].key == null)
      continue;

    firstdate = findLowerDate(firstdate, data.rows[row].key[keyindex]);
    lastdate = findLaterDate(lastdate, data.rows[row].key[keyindex]);
  }

  if (lastdate == "1971-01-01")
    return [startday, startday];

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
  var lastDate = "1970-01-01";
  for (row in data.rows) {
    if (data.rows[row] != null && data.rows[row].key != null) {
      if (data.rows[row].key[0] != lastDate) {
        lastDate = data.rows[row].key[0]; //TODO: this could be solved with a group_level=3 query on heat_simple
        totalpushes += data.rows[row].key[1];
        var value = data.rows[row].value;
        totaloranges += data.rows[row].key[2];
        if (count >= minCount) {
          var parts = data.rows[row].key[0].split('-');
          var d = new Date(parts[0], (parseInt(parts[1], 10) -1), parts[2]);
//          history.push([d.getTime(), Math.floor((totaloranges / totalpushes) * 100) / 100]);
          history.push([d.getTime(), Math.floor((data.rows[row].key[2] / data.rows[row].key[1]) * 100) / 100]);
        }
        count++;
      }
    }
  }
  return [Math.floor((totaloranges / totalpushes) * 100) / 100, totaloranges, totalpushes, history];
}

function baseUrl() {
  return window.location.protocol + '//' + window.location.host +
         window.location.pathname;
}

function buildUrl(display_name, args) {
  var url = baseUrl() + '?display=' + display_name;
  for (a in args) {
    url += '&' + a + '=' + args[a];
  }
  return url;
}

function displayArgs(args) {
  var s = '{';
  for (a in args) {
    s += a + ':' + args[a] + ',';
  }
  s += '}';
  return s;
}


function buildCouchView(queryname, platform, type, test, startday, endday) {

    var qdb = 'woo/';
    var qname = queryname;
    var query = qdb + qname;
    var basekey = [];
    var index_map = [1,2,3,0];

    //map: plat 1, type: 2, test: 4.
    var m_plat = -1;
    var m_type = -1;
    var m_test = -1;

    if (platform === undefined || platform == '' || platform == 'All')
      m_plat = 0;
    else 
      m_plat = 1;
    if (type === undefined || type == '' || type == 'All') 
      m_type = 0;
    else
      m_type = 2;
    if (test === undefined || test == '' || test == 'All')
      m_test = 0;
    else
      m_test = 4;

    switch(m_plat + m_type + m_test) {
    case 1:
      query = qdb + 'plat' + qname;
      basekey = [platform];
      index_map = [0, 2, 3, 1];
      break;
    case 2:
      query = qdb + 'type' + qname;
      basekey = [type];
      index_map = [2, 0, 3, 1]
      break;
    case 4:
      query = qdb + 'test' + qname;
      basekey = [test];
      index_map = [2, 3, 0, 1]
      break;
    case 3:
      query = qdb + 'plattype' + qname;
      basekey = [platform, type];
      index_map = [0, 1, 3, 2]
      break;
    case 5:
      query = qdb + 'plattest' + qname;
      basekey = [platform, test];
      index_map = [0, 3, 1, 2]
      break;
    case 6:
      query = qdb + 'typetest' + qname;
      basekey = [type, test];
      index_map = [3, 0, 1, 2]
      break;
    case 7:
      query = qdb + 'plattypetest' + qname;
      basekey = [platform, type, test];
      index_map = [0, 1, 2, 3]
      break;
    default:
      break;
    }

    var start_key = [];
    var end_key = [];
    for (key in basekey) {
      start_key.push(basekey[key]);
      end_key.push(basekey[key]);
    }
    start_key.push(startday);
    end_key.push(endday);
    return [query, start_key, end_key, index_map];
}

function listDetails(data, testindex) {
  var retVal = {};
  for (row in data.rows) {
    var k = data.rows[row].key;
    if (retVal[k[4]] === undefined) {
      retVal[k[4]] = {'summary':k[5], 'test':k[testindex], 'count':data.rows[row].value};
    } else {
      retVal[k[4]].count += data.rows[row].value;
    }
  }

  var text = '<p><span id="title">';
  text += 'Bugs related to above failures</span></p>';

  for (testrun in testruns) {
    if (typeof(testruns[testrun]) != "object") {
      var blob = {};
      blob[testrun] = testruns[testrun];
    } else {
      blob = testruns[testrun];
    }
    for (sub in blob) {
      var title = false;
      for (id in retVal) {
        var bug = retVal[id];
        if (bug.test == blob[sub]) {
          if (!title) {
            title = true;
            text += '<p><span id="bug">' + bug.test + '</span></p>';
          }
          text += '<p><span id="bug"><a href="' + buildUrl('Bug', {bugid: id}) + '">';
          text += id + '</a> (' + bug.count + ') - </span>';
          text += '<span id="summary">' + bug.summary + '</span></p>';
        }
      }
    }
  }
  return text;
}

