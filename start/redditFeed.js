const { feeds } = require('../feeds.json');
const fetch = require('node-fetch');
const entities = require('entities');
const { MessageEmbed } = require('discord.js');

subredditUrl = (sub) => `https://www.reddit.com/${sub}/new.json?limit=10`;

async function run(client) {
  for (feed of feeds) {
    const { slug: sub, channel } = feed;
    const url = subredditUrl(sub);

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
      },
    });
    console.log(response);
    const json = await response.json();
    const { data } = json;
    const { children } = data;
    for (child of children.reverse()) {
      const { title, url, author, subreddit, created_utc, selftext, preview, permalink } =
        child.data;

      const embed = new MessageEmbed()
        .setTitle(title)
        .setURL(`https://reddit.com` + permalink)
        .setFooter(`/u/${author} on r/${subreddit}`)
        .setTimestamp(created_utc * 1000);

      if (url) {
        embed.setAuthor('Linked Content', undefined, url);
      }

      if (selftext) {
        embed.setDescription(selftext);
      }
      if (preview) {
        embed.setImage(entities.decode(preview.images[0].source.url));
      }

      client.channels.fetch(channel).then((channel) => {
        channel.send({ embeds: [embed] });
      });
    }
  }
}

module.exports = {
  name: 'redditFeed',
  execute(client) {
    run(client);
    setInterval(() => {
      run(client);
    }, 60000);
  },
};
