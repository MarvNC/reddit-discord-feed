const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder().setName('feed').setDescription('Add/Remove/Get a feed.'),
  async execute(interaction) {
    await interaction.reply('Pong!', { ephemeral: true });
  },
};
