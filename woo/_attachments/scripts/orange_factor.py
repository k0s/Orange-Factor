try:
    import json
except:
    import simplejson as json
import urllib
import re
import datetime
import time
import httplib2
import tempfile
import os
import sys

from optparse import OptionParser

http = httplib2.Http(".cache")

def pushToCouch(data, wooData=None):
    if wooData is not None:
      wooRev = getWooRev(wooData['rows'][0]['id'])
      rev = wooRev['rows'][0]['value']
      d_push_url = push_url
      d_push_url += '/' + wooData['rows'][0]['id']
      d_push_url += '?rev=' + rev + ''
      print "delete push_url: " + str(d_push_url)
      resp, content = http.request(d_push_url, method='DELETE')

    #TODO: query for same date, then compare length of results, if equal don't repost
    resp, content = http.request(push_url, method='POST',
                                 body=json.dumps(data), headers={'content-type':'application/json'})

def getBugInfo(bugid):
    if (bugid == None or int(bugid) < 0):
      return None
      
    try:
      f = open(g_bugdata + str(bugid) + '.txt', 'r')
      data = f.read()
      f.close()
      return json.loads(data)
    except:
      getBugzillaDataLive(bugid)
      return getBugInfo(bugid)

def getBugzillaData(bugid=None):
    if (bugid == None):
      apiURL = "https://api-dev.bugzilla.mozilla.org/latest/bug?blocks=438871&include_fields=id"
      jsonurl = urllib.urlopen(apiURL)
      buglist = jsonurl.read()
      jsonurl.close()
    else:
      return {'bugs':[{'id':bugid}]}
    
    result = json.loads(buglist)
    return result

def getBugzillaDataLive(bugid):
    result = getBugzillaData(bugid)
    for bug in result['bugs']:
        apiURL = "https://api-dev.bugzilla.mozilla.org/latest/bug?id=" + str(bug['id']) + "&include_fields=id,summary,comments"
        jsonurl = urllib.urlopen(apiURL)
        buginfo = jsonurl.read()
        jsonurl.close()
        f = open(g_bugdata + str(bug['id']) + ".txt", 'w')
        f.write(buginfo)
        f.close()

def getBugzillaData_DATE(yesterday, tomorrow):
    try:
      f = open(str(yesterday + datetime.timedelta(days=1)) + '.txt', 'r')
      data = f.read()
      f.close()
      return json.loads(data)
    except:
      return getBugzillaDataLive(yesterday, tomorrow)
      
def getBugzillaDataLive_DATE(yesterday, tomorrow):

    # TODO: make configurable
    apiURL = "https://api-dev.bugzilla.mozilla.org/latest/bug"
    apiURL += "?blocks=438871"
    apiURL += "&changed_after=" + str(yesterday)
    apiURL += "&changed_before=" + str(tomorrow)
#    apiURL += "&status=new,assigned,reopened"
    apiURL += "&include_fields=id,summary,comments"
    jsonurl = urllib.urlopen(apiURL)

    data = jsonurl.read()
    jsonurl.close()
    f = open(str(yesterday + datetime.timedelta(days=1)) + ".txt", 'w')
    f.write(data)
    f.close()
    result = json.loads(data)
    return result

def getHGPushCount(today, tomorrow):

    # TODO: make configurable
    apiURL = "http://hg.mozilla.org/mozilla-central/json-pushes?"
    apiURL += "startdate=" + str(today)
    apiURL += "&enddate=" + str(tomorrow)
    
    jsonurl = urllib.urlopen(apiURL)
    
    data = jsonurl.read()
    jsonurl.close()
    result = json.loads(data)
    count = 0
    for push in result:
      count += 1

    return [count, data];

def findMatchDetails(text):
    platforms = ['Fedora 12', 'Fedora 12x64', 'MacOSX Snow Leopard 10.6.2', 'MacOSX Leopard 10.5.8', 'WINNT 5.1', 'WINNT 5.2', 'WINNT 6.1']
    branches = ['mozilla-central']
    buildtypes = ['opt', 'debug']
    testruns = ['mochitests-1/5', 'mochitests-2/5',  'mochitests-3/5', 'mochitests-4/5', 'mochitests-5/5', 
                'mochitest-other', 'reftest', 'crashtest', 'jsreftest', 'xpcshell']

    for platform in platforms:
      for branch in branches:
        for buildtype in buildtypes:
          for testrun in testruns:
            strstr = str(platform) + ' ' + str(branch) + ' ' + str(buildtype) + ' test ' + str(testrun)
            if re.search(strstr, text):
              return [platform, branch, buildtype, testrun]
              
    print "unable to find matching info" 
    return [None, None, None, None]

#only read in 200K since we are looking for the 'platform branch buildtype testrun' info in the log file and revision
#in looking at a few hundred logs, we are safe in the first 2000 lines which is normally 95-120k, 200k is a safe rounding
#technique
def getTextFromGZ(url):
    id = url.split('=')[1]
    dirname = os.path.dirname(os.path.join(g_tboxdata, id))
    if not os.path.exists(dirname):
        os.makedirs(dirname)
    url += "&fulltext=1"
    filename = os.path.join(g_tboxdata, id + ".log")
    try:
      f = open(filename, 'r')
    except:
      print "getting log from server: " + url
      filename, headers = urllib.urlretrieve(url, filename)
      f = open(filename, 'r')
    content = f.read(1024 * 200)
    f.close()
    return content

def collectHGPushes(refdate):
    allresults = {}
    yesterday = refdate - datetime.timedelta(days=gDateRange)
    while (yesterday <= refdate):
      [pushcount, pushdata] = getHGPushCount(yesterday, yesterday + datetime.timedelta(days=1))
      allresults[str(yesterday)] = [pushcount, pushdata]
      yesterday += datetime.timedelta(days=1)

    return allresults

def isOlderFile(refdate, bugid):
    filename = g_bugdata + str(bugid) + ".txt"
    
    if not os.path.exists(filename):
      return True
      
    dt = datetime.date.fromtimestamp(os.path.getctime(filename))
    if (dt < refdate):
      return True
      
    return False

def parseData(refdate):
    allresults = {}
    results = []

    tbox = re.compile('http:\/\/tinderbox\.mozilla\.org\/showlog.cgi\?log=Firefox\/([0-9.]+).gz')
    yesterday = refdate - datetime.timedelta(days=gDateRange)
    tomorrow = refdate + datetime.timedelta(days=1)
    data = getBugzillaData()
    
    if (data == None):
      return "NONE!"
      
    for bug in data['bugs']:
      c = 0
      m = 0
      if isOlderFile(refdate, bug['id']):
        getBugzillaDataLive(bug['id'])
       
      buginfo = getBugInfo(bug['id'])
      if (buginfo == None or 
          buginfo['bugs'] == None or
          len(buginfo['bugs']) == 0):
        continue
        
      bugdata = buginfo['bugs'][0]
      for comment in bugdata['comments']:
        parts = comment['creation_time'].split('T')[0].split('-')
        if (len(parts) != 3):
          continue

        d = datetime.date(int(parts[0]), int(parts[1]), int(parts[2]))
        if (d > yesterday): #really 30 days of history
          c += 1
          if comment['text'] == None or comment['text'] == '{}':
            continue
            
          try:
            matches = tbox.search(comment['text'])
          except:
            print "BAD COMMENT: " + str(comment['text'])
            continue
            
          if matches:
            m += 1
            tboxid = matches.group(0)
            gz = getTextFromGZ(tboxid)
            [platform, branch, buildtype, testrun] = findMatchDetails(gz)

            if platform != None:
              revision = ''
              rev = re.compile("revision: ([a-zA-Z0-9]+)")
              matches = rev.search(gz)
              if (matches):
                revision = matches.group(0).split(':')[1].strip()

              bd = re.compile("builddate: ([0-9]+)")
              matches = bd.search(gz)
              if (matches):
                builddate = matches.group(0).split(':')[1].strip()
                bdate = str(datetime.date.fromtimestamp(eval(builddate + ".0")))
              try:
                x = allresults[bdate]
              except:
                allresults[bdate] = []
              allresults[bdate].append({"revision":revision,"bug":bugdata['id'],"summary":bugdata['summary'],"platform":platform,"branch":branch,"buildtype":buildtype,"test":testrun,"date":bdate,"timestamp":comment['creation_time']})
#      print "bug: " + str(bugdata['id']) + ", comments: " + str(len(bugdata['comments'])) + ", good date: " + str(c) + ", tbox comment: " + str(m)
    return allresults


def getWooRev(id):
    retVal = None
    apiURL = push_url + '/_design/woo/_view/rev?key="' + id + '"'
    jsonurl = urllib.urlopen(apiURL)
    
    data = jsonurl.read()
    jsonurl.close()
    result = json.loads(data)
    if (result != None):
        return result
    return retVal


def deleteWooDuplicates(date):
    retVal = None
    date = datetime.datetime.fromtimestamp(time.mktime(time.strptime(date, "%Y-%m-%d")))

    nextdate = date + datetime.timedelta(days=1)

    apiURL = push_url + "/_design/woo/_view/date_count?startkey=[%22" + str(date) + "%22]&endkey=[%22" + str(nextdate) + "%22]"
    jsonurl = urllib.urlopen(apiURL)
    
    data = jsonurl.read()
    jsonurl.close()
    result = json.loads(data)
    highvalue = 0
    highrev = ''
    highid = ''
    try:
      if (result["reason"] == "missing"):
        return
    except:
      pass

    if (result and 
        result != '' and 
        len(result['rows']) > 0):
        for idx in result['rows']:
          if idx['key'][2] >= highvalue:
            if highrev != '':
              d_push_url = push_url
              d_push_url += '/' + str(highid)
              d_push_url += '?rev=' + str(highrev) + ''
              print "delete push_url(" + str(date) + "): " + str(d_push_url) + " : " + str(highvalue)
              try:
                resp, content = http.request(d_push_url, method='DELETE')
              except: 
                print "\nfailed to delete, moving on\n"
            highid = idx['id']
            try:
              highrev = getWooRev(highid)['rows'][0]['value']
            except: continue
            highvalue = idx['key'][2]

def getWooResults(date):
    retVal = None
    apiURL = push_url + "/_design/woo/_view/date_count?limit=1&startkey=[%22" + str(date) + "%22,]"
    jsonurl = urllib.urlopen(apiURL)
    
    data = jsonurl.read()
    jsonurl.close()
    result = json.loads(data)
    if (result and 
        result != '' and 
        len(result['rows']) > 0):
        return result
    return retVal

def main(args=sys.argv[1:]):

    # parse options
    parser = OptionParser()
    parser.add_option('-u', '--url', dest='push_url',
                      default='http://localhost:5984/orange_factor',
                      help='push_url')
    parser.add_option('--bugs',  dest='g_bugdata',
                      default=os.path.join('orange_data', 'Bugs'),
                      help='where to put bug data')
    parser.add_option('--tboxdata', dest='g_tboxdata',
                      default='orange_data',
                      help='where to put tinderbox data')
    parser.add_option('--date-range', dest='gDateRange', type='int',
                      default=30,
                      help='date range')
    options, args = parser.parse_args(args)
    options.push_url = options.push_url.rstrip('/')
    for directory in 'g_bugdata', 'g_tboxdata':
        directory = getattr(options, directory)
        if not os.path.exists(directory):
            os.makedirs(directory)

    # update global variables from options [HACK]
    globals().update(options.__dict__)

    # date stuff
    today = datetime.date.today()
    startdate = today - datetime.timedelta(days=1)
    allresults = parseData(startdate)
    hgpushes = collectHGPushes(today)

    refdate = today - datetime.timedelta(days=60)

    for r in sorted(allresults):
      push = False
      try:
        pushcount, pushdata = hgpushes[str(r)]
      except:
        continue #we don't have push data, lets skip for now

      deleteWooDuplicates(r)
      wooData = getWooResults(r)
      if (wooData != None and len(wooData['rows']) > 0):
        if len(allresults[str(r)]) != wooData['rows'][0]['key'][2]:
          push = True
      else:
        push = True
    
      if push == True:
        print "pushing to couch: " + str(r) + " : " + str(pushcount)
        pushToCouch({"date":str(r),"pushcount":pushcount,"pushes":pushdata,"oranges":allresults[str(r)]}, wooData)
    return 
  
class Cache(dict):
    def __init__(self, *args, **kwargs):
        super(Cache, self).__init__(*args, **kwargs)
        setattr(self, 'del', lambda *args, **kwargs: dict.__delitem__(*args, **kwargs) )
    get = lambda *args, **kwargs: dict.__getitem__(*args, **kwargs)
    set = lambda *args, **kwargs: dict.__setitem__(*args, **kwargs)
      
if __name__ == "__main__":
  main()

