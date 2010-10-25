  function parseBugs(data) {
    var results = {};
    var dateresults = {};
    var pushresults = {};
    var movingresults = {};
    var movingdays = 7;
    var dr = data["rows"];
    for (row in dr) {
      var r = dr[row];
      var key = r["key"][0];
      if (key == null)
        continue
        
      if (results[key] == null) {
        results[key] = new Array();
      }

      var date = r["value"][1]["date"];
      var parts = date.split('-');
      var d = new Date(parts[0], (parseInt(parts[1], 10) -1), parts[2]);
      var udate = d.getTime();
      results[key].push({"date":date, "udate":udate, "pushcount": r["value"][0], "data":r["value"][1]});
    }
    for (row in results) {
      results[row] = results[row].sort(function(a, b) { return a["udate"] - b["udate"]});
      var datecount = {};
      var pushcount = {};
      for (item in results[row]) {
        var it = results[row][item]
        date = it["udate"];
        if (datecount[date] == null) {
          datecount[date] = 0;
          pushcount[date] = it["pushcount"];
        }
        datecount[date] += 1;
      }
      var dateArray = [];
      var pushArray = [];
      var movingArray = [];
      var movingSum = [];
      var startdate = 0;
      var enddate = 0;
      movingIter = 0;
      for (d in datecount)  {
        if (enddate < d) {
          enddate = d;
        }
        if (startdate <= 0 || startdate > d) {
          startdate = d;
        }
        dateArray.push([d, datecount[d]]);
        pushArray.push([d, datecount[d]/pushcount[d]]);
        movingSum.push(datecount[d]/pushcount[d]);
        if (movingIter >= movingdays) {
          var sum = 0;
          for (var idx = 0; idx < movingSum.length; idx++)
            sum += movingSum[idx];
          
          sum = sum / movingSum.length;
          movingSum.shift();
          movingArray.push([d, sum]);
        }
        movingIter += 1;
      }
      dateresults[row] = dateArray;
      pushresults[row] = pushArray;
      movingresults[row] = movingArray;
    }
    return [results, dateresults, pushresults, movingresults, startdate, enddate];
  }


  /* takes arr2 and adds it to arr1.  if arr2[0] exists, then arr1[1]+= arr2[1]
   */
  function mergeBugArrays(arr1, arr2) {
    var count = 0;
    for (var idx in arr2) {
      var merged = false;
      for (idx2 in arr1) {
        if (arr1[idx2][0] == arr2[idx][0]) {
          arr1[idx2][1] += arr2[idx][1];
          merged = true;
          break;
        }
      }
      if (merged == false) {
        arr1.push(arr2[idx]);
      }
    }
    return arr1;
  }

  function parseBugDates(dateresults, dayCount) {
    var dateArray = {};
    for (var bug in dateresults) {
      for (var dr in dateresults[bug]) {
        dr = dateresults[bug][dr];
        date = dr[0];
        count = dr[1];
        tarray = dateArray[date];
        if (tarray == null) {
          tarray = [];
        }
        tarray.push([bug, count]);
        dateArray[date] = tarray;
      }
    }

    //rebuild array based on number of days to lump together (i.e. 1 week/1 month)
    var lumpedArray = {};
    var i = 1;
    var tempArray = [];
    var keys = getKeys(dateArray).sort();
    if (dayCount == "All") dayCount = keys.length;
    for (var key in keys) {
      var d = keys[key];
      if (i % dayCount == 0) {
        lumpedArray[d] = tempArray.sort(function(a, b) { return b[1] - a[1]});
        tempArray = [];
      }
      tempArray = mergeBugArrays(tempArray, dateArray[d]);
      i += 1;
    }
    return lumpedArray;
  }

  function displayBug(app, id, args) {
    var bugid = args['bugid'];
    if (isNaN(parseInt(bugid, 10)))
      return;
    var text = '';
    clearPage();
    text += "<h1>Detail for bug: " + bugid + "</h1>";
    app.db.view('woo/bybug',
                {success: function(data) {
                  var results = parseBugs(data);
                  table = "<table><tr><td>Date</td><td>Platform</td><td>BuildType</td></tr>";
                  for (bug in results[0]) {
                    b = results[0][bug];
                    text += '<span id="bug"><a href="https://bugzilla.mozilla.org/show_bug.cgi?id=' + bug + '">' + bug + '</a>, ' + b.length + ' total failures';
                    text += ': </span><span id="summary">';
                    text += b[0].data.summary;
                    text += '</span><p>';
                    for (item in b) {
                      var dat = b[item].data;
                      table += "<tr><td>"+b[item].date + "</td><td>" + dat.platform + "</td><td>" + dat.buildtype + "</td></tr>";
                    }
                  }
                  table += "</table>";
                  $("#display").html(text);
                  showLineGraphMultiple([results[1][bugid], results[2][bugid], results[3][bugid]], ["Bug Frequency (BF)", "Frequency/Pushes per Day (F/P/D)", "7day moving avg of F/P/D"], results[4], results[5]);
                  $("#details").html(table);

                },
                key: [parseInt(bugid, 10)],
                });
  }

  /*
   * simple utility function to take a hash and get keys.  This way I can 'sort' the hash keys in the order I want
   */
  function getKeys(obj) {
    var keys = [];
    for (var o in obj) {
      keys.push(o);
    }
    return keys;
  }

  function buildCountSummaryFilters(bugCount, dayCount) {
    var bc = encodeURIComponent(bugCount);
    var dc = encodeURIComponent(dayCount);

    var args = { dayCount: 'form.dc.value',
                 bugCount: 'form.bc.value'};

    var text = 'Bugs: <input type="text" id="bc" size="2" value="' + bc + '"';
    text += ' onchange="window.location.assign(buildUrl(\'CountSummary\', ' +
            displayArgs(args) + '));" /	>';

    text += ' Days: <input type="text" id="dc" size="2" value="' + dc + '"';
    text += ' onchange="window.location.assign(buildUrl(\'CountSummary\', ' +
            displayArgs(args) + '));" />';
    text += ' <a href="' + buildUrl('CountSummary', {dayCount: 7, bugCount: 5}) + '">Weeks</a>';
    text += ' <a href="' + buildUrl('CountSummary', {dayCount: 30, bugCount: 3}) + '">Months</a>';
    text += ' <a href="' + buildUrl('CountSummary', {dayCount: 'All', bugCount: 10}) + '">All</a>';
    return text;
  }

  function displayCountSummary(app, id, args) {
    var text = '';
    clearPage();
    var numbugs = 10;
    if (args.bugCount > 0) numbugs = args.bugCount;
    var numdays = "All";
    if (args.dayCount > 0) numdays = args.dayCount;
    app.db.view('woo/bybug',
                {success: function(data) {
                  var results = parseBugs(data);
                  var weekly = parseBugDates(results[1], numdays);
                  var byBug = {};
                  var datelist = [];
                  var week_count = 0;
                  //sort the weeks descending
                  var sortedDates = getKeys(weekly).sort(function(a,b){return b-a;});
                  for (var idx in sortedDates) {
                    var date = sortedDates[idx];
                    var d = [];
                    var bugs = weekly[date];
                    var count = 0;
                    for (var b in bugs) {
                      var temp = byBug[bugs[b][0]];
                      if (temp == null) temp = [];
                      temp.push([date, bugs[b][1]]);
                      if (datelist.indexOf(date) == -1) datelist.push(date);
                      byBug[bugs[b][0]] = temp.sort(function(a, b) { return a[0] - b[0]});
                      if (count++ >= (numbugs - 1))
                        break;
                    }
                    week_count++;
                    if (week_count >= 6) break;
                  }

                  var stats = [];
                  var names = [];
                  //order the dates from lowest -> highest to match the graph 
                  datelist = datelist.sort(function (a,b){return a-b;});
                  table = "<p><p><table border=1><tr><td>Bug</td>";
                  for (d in datelist) {
                     var jdate = new Date(Math.floor(datelist[d]));
                     table += "<td>" + getTboxDate(jdate) + "</td>";
                  }
                  table += "</tr>";
                  for (bug in byBug) {
                    for (diter in datelist) {
                      var found = false;
                      for (bugitem in byBug[bug]) {
                        var tbug = byBug[bug][bugitem];
                        if (tbug[0] == datelist[diter]) {
                          found = true;
                          break;
                        }
                      }
                      if (found == false) {
                        tbug = byBug[bug];
                        tbug.push([datelist[diter], results[1][bug][diter][1]]);
                        byBug[bug] = tbug;
                      }
                    }
                    stats.push(byBug[bug].sort(function(a, b) { return a[0] - b[0]}));
                    names.push(bug);

                    table += "<tr><td><a href=\""+buildUrl('Bug', {bugid: bug}) +"\">" + bug + "</a></td>";
                    for (d in byBug[bug]) {
                      table += "<td align='center'>" + byBug[bug][d][1] + "</td>";
                    }
                    table += "</tr>";
                  }
                  showBugStacks(stats, names);
                  table += "</table>";
                  $("#details").html(table);

                  var display = '<span id="title"><form>';
                  display += buildCountSummaryFilters(numbugs, numdays);
                  display += "</form></span><p>";
                  display += '<span id="subtitle">';
                  display += ' number of bugs (1-10) to display for each group of days (1-30, or All)';
                  display += "</span><p>";
                  $("#display").html(display);
                },
                });
  }

  function displayDetails(app, data, platform, test, branch, type, startday, endday) {
    var text = '<p><span id="title">';
    text += 'Bugs related to above failures</span></p>';

    var retVal = [];
    var count = 1;
    for (row in data.rows) {      
      var oranges = data.rows[row].value.oranges;
      if (oranges === undefined) {
        oranges = [data.rows[row].value];
      }
      for (orange in oranges) {
        var or = oranges[orange];

        var mplat = false;
        if (platform === undefined || platform == '' || platform == 'All') {
          mplat = true;
        } else if (platform == or.platform) {
          mplat = true;
        }

        var mbranch = false;
        if (branch === undefined || branch == '' || branch == 'All') {
          mbranch = true;
        } else if (branch == or.branch) {
          mbranch = true;
        }

        var mtype = false;
        if (type === undefined || type == '' || type == 'All') {
          mtype = true;
        } else if (type == or.buildtype) {
          mtype = true;
        }

        if (mplat && mbranch && mtype) {
          if (retVal[or.bug] === undefined) {
            retVal[or.bug] = {'summary':or.summary, 'test':or.test, 'count':1};
          } else {
            retVal[or.bug].count += 1;
          }
        }
      }
    }
    
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

