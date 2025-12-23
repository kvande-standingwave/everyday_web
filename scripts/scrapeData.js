const fs = require('fs')
const rp = require('request-promise');
const jquery = require('jquery');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const Datastore = require('nedb-promise');
const db = new Datastore({ filename: 'data.db', autoload: true });

db.ensureIndex({ fieldName: 'trackName' });

// twitter:app:url:googleplay

async function getTrackNames() {
  return new Promise((resolve, reject) => {
    fs.readFile('./inputTrackNames.json', 'utf8', function(err, contents) {
      if (err) {
        reject(err);
      }

      resolve(JSON.parse(contents));
    })
  })
}

async function getRemoteFile(fileName) {
  return rp(fileName)
          .then((results) => results)
          .catch((err) => { 
            console.log(Object.keys(err));
            console.log('looking for twitter:app:url:googleplay - ', err.error.indexOf('twitter:app:url:googleplay'));
            console.log('there was an error'); 

            return 'testing'; 
          });
}

async function getTrack(trackName) {
  // if (await db.findOne({ trackName: trackName })) {
  //   console.log(`Already have "${trackName}" so skipping it.`);
  // } else {
    const content = await getFileWithJsdom(trackName);
    const metaTags = await parseMetaTagsFromContent(content);
    for (let i = 0; i < metaTags.length; ++i) {
      const thisTag = metaTags[i];
      if (thisTag.indexOf(`embedUrl\"`) !== -1) {
        console.log(`looking at ${thisTag}`);
        const contentStart = thisTag.indexOf('content=\"') + 9;
        const contentEnd = thisTag.indexOf('"', contentStart);
        console.log(`contentStart=${contentStart}, contentEnd=${contentEnd}`);
        let link = thisTag.substring(contentStart, contentEnd);
        console.log(`embedUrl: [${link}]`);
        link = decodeURIComponent(decodeURIComponent(link));
        console.log(`decoded: ${link}`);
        // db.insert({trackName: trackName, metaTags: metaTags});
      }
    }
  // }
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const openMetaTag = '<meta ';
const closeMetaTag = '>';
function parseMetaTagsFromContent(content) {
  let results = {};

  let nextMeta = content.indexOf(openMetaTag);
  let nextClose = nextMeta !== -1 ? content.indexOf(closeMetaTag, nextMeta) : -1;
  while (nextMeta !== -1 && nextClose !== -1 && nextClose > nextMeta) {
    const metaContent = content.substring(nextMeta + openMetaTag.length, nextClose);
    // We can skip ones that have "SoundCloud" in it
    if (!metaContent.indexOf(`"SoundCloud"`) !== -1) { 
      const hash = metaContent.trim().hashCode();
      if (!results.hasOwnProperty(hash)) {
        results[hash] = metaContent;
      }
    }
    
    nextMeta = content.indexOf(openMetaTag, nextClose);
    nextClose = content.indexOf(closeMetaTag, nextMeta);
  }

  return Object.keys(results).map((hash, index) => results[hash]);
}

async function getFileWithJsdom(trackName) {
  const fileName = `https://soundcloud.com/standingwave/${trackName}`;
  try {
    return await JSDOM.fromURL(fileName, { resources: "usable" }).then((dom) => dom.serialize());
  } catch(err) {
    console.error(`Caught an issue for "${trackName}"`);
  }
  console.log(`Found ${Object.keys(results).length} meta properties`);
}

function parseTrackContent(content, trackData) {
  const re = /<meta property="twitter:app:url:googleplay"\s?content="soundcloud:\/\/sounds:([^"]*?)"/
  const found = content.match(re);
  if (found) {
    console.log(`Found embedId "${found[1]}" for "${trackData.trackName}"`);
    trackData['embedId'] = found[1];

    trackData['playCount'] = parseSingleValue(content, /<li title="([^\s]*) plays"/);
    trackData['content'] = content;

    return true;
  }

  return false;
}

function parseSingleValue(content, regex) {
  const found = content.match(regex);
  if (found) {
    return found[1];
  }
  return null;
}

async function runIt() {
  const trackNames = await getTrackNames();
  console.log(`Total tracks: ${trackNames.length}`);
  for (let i = 0; i < 1; ++i) {
    getTrack(trackNames[i]);
  }
}

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

runIt();