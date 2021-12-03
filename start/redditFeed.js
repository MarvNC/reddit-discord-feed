const { redditFeeds } = require('../feeds.json');

const fetch = require('node-fetch');

const entities = require('entities');
const { MessageEmbed } = require('discord.js');

// 60 seconds
const interval = 60 * 1000;
const REDDIT_URL = 'https://www.reddit.com/';
const subredditUrl = (slug, comments = false) =>
  `${REDDIT_URL}${slug}/${comments ? 'comments' : 'new'}.json?limit=15`;

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

      let redditUrl = REDDIT_URL + post.permalink;

      if (!feed.isComment) {
        const title = post.title.length > 200 ? post.title.substring(0, 200) + '...' : post.title;
        embed.setTitle(title);

        // url for linked content
        if (!post.is_self) {
          let domain = '',
            linkedURL = '';

          let getUrl = (postURL, domain, linkedURL) => {
            try {
              domain = new URL(postURL)?.hostname;
              linkedURL = new URL(postURL);
            } catch (error) {
              return false;
            }
            return { domain, linkedURL };
          };

          let gotUrl = getUrl(post.url);
          if (gotUrl) {
            domain = gotUrl.domain;
            linkedURL = gotUrl.linkedURL;
          } else {
            gotUrl = getUrl(REDDIT_URL + post.url);
            domain = gotUrl?.domain ?? undefined;
            linkedURL = gotUrl?.linkedURL ?? undefined;
          }

          embed.setAuthor('Link: ' + domain, undefined, linkedURL);
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

      try {
        client.channels.fetch(feed.channelID).then((channel) => {
          channel.send({ embeds: [embed] });
        });
      } catch (error) {
        console.log(feed, error);
      }
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
