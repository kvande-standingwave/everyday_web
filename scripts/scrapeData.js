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
  if (await db.findOne({ trackName: trackName })) {
    console.log(`Already have "${trackName}" so skipping it.`);
  } else {
    getFileWithJsdom(trackName);
  }
}

async function getFileWithJsdom(trackName) {
  const fileName = `https://soundcloud.com/standingwave/${trackName}`;
  try {
    JSDOM.fromURL(fileName, {}).then(async (dom) => {
      const content = dom.serialize();
      const re = /<meta property="twitter:app:url:googleplay"\s?content="soundcloud:\/\/sounds:([^"]*?)"/
      const found = content.match(re);
      if (found) {
        console.log(`Found embedId "${found[1]}" for "${trackName}"`);
        await db.update({ trackName: trackName }, { trackName: trackName, embedId: found[1] }, { upsert: true });
      }
    });
  } catch(err) {
    console.error(`Caught an issue for "${trackName}"`);
  }
}

async function runIt() {
  const trackNames = await getTrackNames();
  console.log(`Total tracks: ${trackNames.length}`);
  for (let i = 0; i < trackNames.length; ++i) {
    getTrack(trackNames[i]);
  }
}

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

runIt();