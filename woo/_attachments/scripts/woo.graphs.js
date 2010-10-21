  function showTooltip(x, y, contents, extracontents) {
      if (extracontents === undefined) {
        extracontents = '';
      }
      var jdate = new Date(Math.floor(contents));
      var today = getTboxDate(jdate);
      var content = '<div id="tooltip">';
      content += '<a href="' + buildUrl('HeatMap', {startday: today, endday: getTboxDate(jdate, 1)}) + '">';
      content += jdate.toDateString() + extracontents + '</a>';
      content += '</div>';
      
      $(content).css( {
          position: 'absolute',
          display: 'none',
          top: y + 5,
          left: x + 5,
          border: '1px solid #fdd',
          padding: '2px',
          'background-color': '#fee',
          opacity: 0.80
      }).appendTo("body").fadeIn(200);
  }

  function showLineTooltip(x, y, contents, extracontents) {
      if (extracontents === undefined) {
        extracontents = '';
      }
      var jdate = new Date(Math.floor(contents));
      var today = getTboxDate(jdate);
      var content = '<div id="tooltip">';
      content += '<a href="' + buildUrl('HeatMap', {startday: today, endday: getTboxDate(jdate, 1)}) + '">';
      content += jdate.toDateString() + '</a>';
      content += '</div>';
      
      $(content).css( {
          position: 'absolute',
          display: 'none',
          top: y + 5,
          left: x + 5,
          border: '1px solid #fdd',
          padding: '2px',
          'background-color': '#fee',
          opacity: 0.80
      }).appendTo("body").fadeIn(200);
  }

  function showBarGraph(points, test, plat, startday, endday) {
    var labelText = test + " " + plat;
    var minTime = getDate(startday).getTime();
    var maxTime = getDate(endday).getTime();
    if (startday == endday) {
      minTime = null;
      maxTime = null;
    }
    $("#placeholder").css("height","300px");
    $.plot($("#placeholder"), [{data: points, label: labelText}], {
             grid: { hoverable: true, clickable: true },
             series: 
               { points: { show: true },
                 bars: { show: true } 
               },
             xaxis:
               { mode: "time",
                 minTickSize: [1, "day"],
                 min: minTime,
                 max: maxTime,
               }
             });

    var previousPoint = null;
    $("#placeholder").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

        if (item) {
            if (previousPoint != item.datapoint) {
                previousPoint = item.datapoint;
                    
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);
                
                showTooltip(item.pageX, item.pageY, x);
            }
        }
        else {
            $("#tooltip").remove();
            previousPoint = null;            
        }
    });

    $("#placeholder").bind("plotclick", function (event, pos, item) {
        if (item) {
            $("#clickdata").text("You clicked point " + item.dataIndex + " in " + item.series.label + ".");
            plot.highlight(item.series, item.datapoint);
        }
    });

  }

  function showLineGraph(dailyMetric, labelText, startday, endday) {
    $("#placeholder").css("height","300px");
    $.plot($("#placeholder"), [{data: dailyMetric, label: labelText}], {
             grid: { hoverable: true, clickable: true },
             series: 
               { points: { show: true },
                 lines: { show: true } 
               },
             xaxis: 
               { mode: "time", 
                 min: (getDate(startday).getTime()),
                 max: (getDate(endday).getTime())
               }
             });

    var previousPoint = null;
    $("#placeholder").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

        if (item) {
            if (previousPoint != item.datapoint) {
                previousPoint = item.datapoint;
                    
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);

                  showLineTooltip(item.pageX, item.pageY,
                            x, ' ' + item.series.label + ' ' + y);
            }
        }
        else {
            $("#tooltip").remove();
            previousPoint = null;            
        }
    });

    $("#placeholder").bind("plotclick", function (event, pos, item) {
        if (item) {
            $("#clickdata").text("You clicked point " + item.dataIndex + " in " + item.series.label + ".");
            plot.highlight(item.series, item.datapoint);
        }
    });
  }

  function showLineGraphMultiple(dailyMetric, labelText, startday, endday) {
    $("#placeholder").css("height","300px");
    var plotdata = Array();
    for (var idx in dailyMetric) {
      if (idx > 0) {
        plotdata.push({data: dailyMetric[idx], label: labelText[idx], yaxis: 2});
      } else {
        plotdata.push({data: dailyMetric[idx], label: labelText[idx]});
      }
    }
    $.plot($("#placeholder"), plotdata, {
             grid: { hoverable: true, clickable: true },
             series: 
               { points: { show: true },
                 lines: { show: true } 
               },
             xaxis: 
               { mode: "time", 
                 min: startday,
                 max: endday
               },
             yaxis: { min: 0 },
             y2axis: { min: 0 },
             legend: { position: 'nw' },
             });

    var previousPoint = null;
    $("#placeholder").bind("plothover", function (event, pos, item) {
        $("#x").text(pos.x.toFixed(2));
        $("#y").text(pos.y.toFixed(2));

        if (item) {
            if (previousPoint != item.datapoint) {
                previousPoint = item.datapoint;
                    
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);

                  showLineTooltip(item.pageX, item.pageY,
                            x, ' ' + item.series.label + ' ' + y);
            }
        }
        else {
            $("#tooltip").remove();
            previousPoint = null;            
        }
    });

    $("#placeholder").bind("plotclick", function (event, pos, item) {
        if (item) {
            $("#clickdata").text("You clicked point " + item.dataIndex + " in " + item.series.label + ".");
            plot.highlight(item.series, item.datapoint);
        }
    });
  }

  function showBarGraphDay(points, test, plat, startday, endday) {
    $("#placeholder").css("height","300px");
    var labelText = test + " " + plat;
    var plats = [];
    var count = 0;
    for (platform in platforms) {
      plats.push([count++, platform]);
    }
    $.plot($("#placeholder"), [{data: points, label: labelText}], {
             series:
               { bars: { show: true } 
               },
               xaxis: {
                   ticks: plats
               },
             });
  }

