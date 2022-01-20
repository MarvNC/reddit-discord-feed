const { pandaFeeds } = require('../feeds.json');

const fetch = require('node-fetch');
const { XMLParser } = require('fast-xml-parser');
const { MessageEmbed } = require('discord.js');

const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: true,
  // htmlEntities: true,
});
const pandaURL = 'https://xml.e-hentai.org/ehg.xml';

const interval = 60 * 1000;

let lastTimeStamp = 0;

async function run(client) {
  let currentTimeStamp = lastTimeStamp;

  try {
    const response = await fetch(pandaURL);
    const xml = await response.text();
    let data = parser.parse(xml);

    for (const entry of data.feed?.entry.reverse()) {
      const updatedTime = Date.parse(entry.updated);
      if (updatedTime >= lastTimeStamp) {
        console.log(`Sending ${entry.title} uploaded at ${new Date(updatedTime).toISOString()}`);
        currentTimeStamp = Math.max(updatedTime, currentTimeStamp);
        const embed = new MessageEmbed();

        embed.setTitle(entry.title);
        embed.setURL(entry.link['@_href']);
        embed.setTimestamp(updatedTime);
        embed.setAuthor(
          `Uploader: ${entry.author?.name}`,
          undefined,
          `https://e-hentai.org/uploader/${entry.author?.name}/`
        );
        embed.setImage(entry.content?.div?.img['@_src']);

        for (const channelID of pandaFeeds) {
          try {
            client.channels.fetch(channelID).then((channel) => {
              channel.send({ embeds: [embed] });
            });
          } catch (error) {
            console.error(error);
            console.log(embed);
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  lastTimeStamp = currentTimeStamp;
}

module.exports = {
  name: 'pandaFeed',
  execute(client) {
    // temp
    return;
    lastTimeStamp = Date.now();
    run(client);
    setInterval(() => {
      run(client);
    }, interval);
  },
};

// const axios = require('axios');
// const { JSDOM } = require('jsdom');

// async function getURL(url) {
//   const { data } = await axios.get(url, { validateStatus: null });
//   const dom = new JSDOM(data, {});
//   const { document } = dom.window;
//   return document;
// }