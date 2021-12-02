const { redditFeeds } = require('../feeds.json');

const fetch = require('node-fetch');

const entities = require('entities');
const { MessageEmbed } = require('discord.js');

// 60 seconds
const interval = 60 * 1000;
const subredditUrl = (slug, comments = false) =>
  `http://www.reddit.com/${slug}/${comments ? 'comments' : 'new'}.json?limit=15`;

let lastTimeStamp = 0;

async function run(client) {
  let currentTimeStamp = lastTimeStamp;

  // console.log('Last fetch: ' + Date(lastTimeStamp));

  for (const feed of redditFeeds) {
    const url = subredditUrl(feed.slug, feed.isComment);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'reddit-feed-bot:0.1',
      },
    });

    if (!response.ok) {
      console.log(url, response.statusText);
      continue;
    }

    const json = await response.json();
    const { data } = json;
    const { children } = data;

    for (const child of children.reverse()) {
      const post = child.data;

      if (post.created_utc <= lastTimeStamp) {
        continue;
      } else {
        currentTimeStamp = post.created_utc;
      }

      const embed = new MessageEmbed()
        .setFooter(`/u/${post.author} on r/${post.subreddit}`)
        .setTimestamp(post.created_utc * 1000);

      let redditUrl = `https://reddit.com` + post.permalink;

      if (!feed.isComment) {
        const title = post.title.length > 200 ? post.title.substring(0, 200) + '...' : post.title;
        embed.setTitle(title);

        // url for linked content
        if (!post.is_self) {
          let domain = '';
          try {
            domain = new URL(post.url)?.hostname;
          } catch (error) {
            console.log(post.url, post.permalink, error);
          }
          embed.setAuthor('Link: ' + domain, undefined, post.url);
        }

        // if the post is nsfw then check if the feed allows nsfw(default false) otherwise allow
        // if the post is spoiler check if the feed allows spoiler(default false) otherwise allow
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
        redditUrl += '?context=10000';
        const title =
          post.link_title.length > 200
            ? post.link_title.substring(0, 200) + '...'
            : post.link_title;
        embed.setTitle(title);

        // limit comment to 2000 characters
        let comment = entities.decodeHTML(post.body);
        if (comment.length > 2000) {
          comment = comment.substring(0, 2000) + '...';
        }
        embed.setDescription(comment);
      }

      embed.setURL(redditUrl);

      client.channels
        .fetch(feed.channelID)
        .then((channel) => {
          channel.send({ embeds: [embed] });
          // console.log(`Sent post in ${feed.slug} to ${channel.name}`);
        })
        .catch((err) => {
          console.log(feed, err);
        });
    }
  }
  lastTimeStamp = currentTimeStamp;
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
