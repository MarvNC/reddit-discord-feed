const fs = require('fs');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    const startFiles = fs.readdirSync('./start').filter((file) => file.endsWith('.js'));

    for (const file of startFiles) {
      const start = require(`../start/${file}`);
      start.execute(client);
    }
  },
};
