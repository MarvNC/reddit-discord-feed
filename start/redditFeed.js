const { redditFeeds } = require('../feeds.json');

const fetch = require('node-fetch');

const entities = require('entities');
const { MessageEmbed } = require('discord.js');
const { time } = require('console');

// 60 seconds
const interval = 30 * 1000;
const subredditUrl = (slug) => `http://www.reddit.com/${slug}/new.json?limit=10`;

let lastTimeStamp = 0;

async function run(client) {
  for (feed of redditFeeds) {
    const url = subredditUrl(feed.slug);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'reddit-feed-bot:0.1',
      },
    });

    if (!response.ok) {
      console.log(response.statusText);
      continue;
    }

    const json = await response.json();
    const { data } = json;
    const { children } = data;
    for (child of children.reverse()) {
      const data = child.data;

      if (data.created_utc < lastTimeStamp) {
        continue;
      } else {
        lastTimeStamp = data.created_utc;
      }

      const embed = new MessageEmbed()
        .setTitle(data.title)
        .setURL(`https://reddit.com` + data.permalink)
        .setFooter(`/u/${data.author} on r/${data.subreddit}`)
        .setTimestamp(data.created_utc * 1000);

      // url for linked content
      if (!data.is_self) {
        embed.setAuthor('Link: ' + new URL(data.url).hostname, undefined, data.url);
      }

      if (data.selftext) {
        selftext = entities.decodeHTML(data.selftext);
        // limit length to 2000 characters
        if (selftext.length > 2000) {
          selftext = selftext.substring(0, 2000) + '...';
        }
        embed.setDescription(selftext);
      }

      if (data.preview) {
        embed.setImage(entities.decode(data.preview.images[0].source.url));
      }

      client.channels.fetch(feed.channel).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
}

module.exports = {
  name: 'redditFeed',
  execute(client) {
    lastTimeStamp = Math.floor(Date.now() / 1000);
    run(client);
    setInterval(() => {
      run(client);
    }, interval);
  },
};
