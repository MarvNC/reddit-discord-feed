module.exports = {
  name: 'watching',
  execute(client) {
    client.user.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' });
  },
  interval: 60000,
};
