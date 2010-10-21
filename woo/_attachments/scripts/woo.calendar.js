//requires woo.utils.js

var month_map = {'01':'January',
                 '02':'February',
                 '03':'March',
                 '04':'April',
                 '05':'May',
                 '06':'June',
                 '07':'July',
                 '08':'August',
                 '09':'September',
                 '10':'October',
                 '11':'November',
                 '12':'December'};


function getId(year, month, table, day) {
  var today = buildTboxDate(year, month - 1, day);
  var tomorrow = buildTboxDate(year, month - 1, day, 1);
  if (day < 10) day = "0" + day;
  
  var spanid = 'gray';
  if (table[day] >= 0) {
    spanid = 'blue';
//TODO: we can color the links for each day, but it looks sort of ghetto
//  } else if (table[day] < 10) {
//    spanid = 'yellow';
//  } else if (table[day] < 20) {
//    spanid = 'orange';
//  } else if (table[day] > 20) {
//    spanid = 'red';
  }
    
  var retVal = '<span id="' + spanid + '">';
  if (table[day] === undefined) {
    retVal += day;
  } else {
    retVal += '<a href="' +
              buildUrl('HeatMap', {startday: today, endday: tomorrow}) +
              '">';
    retVal += day + '</a>';
  }
  retVal += '</span>';
  return retVal;
}

function buildCalendar(app, id) {
  var year = (new Date()).getFullYear();
  var month = (new Date()).getMonth() + 1; //0-11
  var monthsToDisplay = 2;

  displayCalendar(app, id, month-1, 2010, monthsToDisplay);
}
  
function viewCalendar(data, app, id, month, year, display_count) {
  var currentMonth = month;
  var currentYear = year;

  text = '';
  text += '<p><span id="title">' + month_map[strmonth] + '</span></p>';
  month_data = Array();
  for (row in data.rows) {
    var date = data.rows[row].key[0];
    var day = date.split('-')[2];
    month_data[day] = data.rows[row].value;
  }
            
  var startDayOfWeek = (new Date(currentMonth + '/01/' + currentYear)).getDay();
  var lastDay = (new Date((new Date(currentMonth+1 +'/01/'+currentYear))-1)).getDate();
  var i = 1;
  text += '<table>';
  var started = false;
  while (i <= lastDay) {
    text += '<tr>';
    for (d in [1,2,3,4,5,6,7]) {
      if (started == false && i > startDayOfWeek) {
        i = 1;
        started = true;
      }
      text += '<td>';
      if (started == true) {
        text += getId(currentYear, currentMonth, month_data, i);
      }
      text += '</td>';
      i += 1;
      if (i > lastDay) break;
    }
    text += '</tr>';
  }
  text += '</table>';
  $(id).append(text);
  if (--display_count > 0) {
    displayCalendar(app, id, month+1, year, display_count);
  }
}
  
function displayCalendar(app, id, month, year, display_count) {
  strmonth = month;
  strnextmonth = month + 1;
  if (month < 9) strnextmonth = "0" + strnextmonth;
  if (month < 10) strmonth = "0" + month;
  var monthkey = year + "-" + strmonth + "-00";
  var nextmonthkey = year + '-' + strnextmonth + '-00';
  if (month == 11) {
    nextmonthkey = (year + 1) + '-01-00';
  }

  app.db.view('woo/date_count', 
      {success: function(data) {viewCalendar(data, app, id, month, year, display_count);},
       startkey: [monthkey],
       endkey: [nextmonthkey],
      });

}

