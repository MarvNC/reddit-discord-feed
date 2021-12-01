const { redditFeeds } = require('../feeds.json');

const fetch = require('node-fetch');

const entities = require('entities');
const { MessageEmbed } = require('discord.js');

// 60 seconds
const interval = 30 * 1000;
const subredditUrl = (slug, comments = false) =>
  `http://www.reddit.com/${slug}/${comments ? 'comments' : 'new'}.json?limit=15`;

let lastTimeStamp = 0;

async function run(client) {
  console.log('Running reddit feed');
  for (feed of redditFeeds) {
    const url = subredditUrl(feed.slug, feed.isComment);

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
      const post = child.data;

      if (post.created_utc < lastTimeStamp) {
        continue;
      } else {
        lastTimeStamp = post.created_utc;
      }

      const embed = new MessageEmbed()
        .setURL(`https://reddit.com` + post.permalink)
        .setFooter(`/u/${post.author} on r/${post.subreddit}`)
        .setTimestamp(post.created_utc * 1000);

      if (!feed.isComment) {
        const title = post.title.length > 200 ? post.title.substring(0, 200) + '...' : post.title;
        embed.setTitle(title);

        // url for linked content
        if (!post.is_self) {
          embed.setAuthor('Link: ' + new URL(post.url)?.hostname, undefined, post.url);
        }

        // if the post is nsfw then check if the feed allows nsfw otherwise allow
        // if the post is spoiler check if the feed allows spoiler otherwise allow
        if (
          post.over_18
            ? feed.allowNsfw ?? false
            : true && post.spoiler
            ? feed.allowSpoiler ?? false
            : true
        ) {
          if (post.selftext) {
            selftext = entities.decodeHTML(post.selftext);
            // limit length to 2000 characters
            if (selftext.length > 2000) {
              selftext = selftext.substring(0, 2000) + '...';
            }
            embed.setDescription(selftext);
          }

          if (post.preview) {
            embed.setImage(entities.decode(post.preview.images[0].source.url));
          }
        } else {
          embed.setDescription('Post marked as NSFW/Spoilers.');
        }
      } else {
        console.log(data);
        const title =
          post.link_title.length > 200
            ? entities.decodeHTML(post.title.substring(0, 200)) + '...'
            : entities.decodeHTML(post.title);
        embed.setTitle(title);

        // limit comment to 2000 characters
        let comment = entities.decodeHTML(post.body);
        if (comment.length > 2000) {
          comment = comment.substring(0, 2000) + '...';
        }
        embed.setDescription(comment);
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
