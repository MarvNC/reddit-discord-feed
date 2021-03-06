const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder().setName('server').setDescription('Replies with server info!'),
  async execute(interaction) {
    await interaction.reply({
      content:
        `Server name: ${interaction.guild.name}\n` +
        `Total members: ${interaction.guild.memberCount}\n` +
        `Creation date: ${interaction.guild.createdAt}\n` +
        `Total channels: ${interaction.guild.channels.cache.size}`,
      ephemeral: true,
    });
  },
};
