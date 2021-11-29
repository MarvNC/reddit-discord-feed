const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.once('ready', () => {
  console.log('Ready!');
  setInterval(() => {
    client.user.setActivity(
      `${client.guilds.cache.size} servers | ${client.users.cache.size} users`,
      { type: 'WATCHING' }
    );
  }, 60000);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('Pong!');
  } else if (commandName === 'server') {
    await interaction.reply(
      `Server name: ${interaction.guild.name}
Total members: ${interaction.guild.memberCount}
Creation date: ${interaction.guild.createdAt}
Total channels: ${interaction.guild.channels.cache.size}`
    );
  } else if (commandName === 'user') {
    await interaction.reply(`Your tag: ${interaction.user.tag}\nYour id: ${interaction.user.id}`);
  }
});

client.login(token);
