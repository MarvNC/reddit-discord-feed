const interval = 60000;

function run(client) {
  client.user.setActivity(`${client.guilds.cache.size} servers`, { type: 'WATCHING' });
}
module.exports = {
  name: 'watching',
  execute(client) {
    run(client);
    setInterval(() => {
      run(client);
    }, interval);
  },
};
