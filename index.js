const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Servidor HTTP mínimo, só para o Render ver que o processo está de pé.
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Lyra online.');
  })
  .listen(PORT, () => console.log(`Servidor de status ouvindo na porta ${PORT}`));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  presence: {
    activities: [{ name: 'Eu amo chocolate! | --ajuda', type: ActivityType.Playing }],
    status: 'online'
  }
});

client.commands = new Collection();

function carregar(pasta) {
  const caminho = path.join(__dirname, pasta);
  if (!fs.existsSync(caminho)) return;
  for (const arq of fs.readdirSync(caminho)) {
    const comp = path.join(caminho, arq);
    if (fs.statSync(comp).isDirectory()) carregar(path.join(pasta, arq));
    else if (arq.endsWith('.js')) {
      const cmd = require(comp);
      if (cmd.nome) client.commands.set(cmd.nome, cmd);
    }
  }
}
carregar('commands');

const eventos = path.join(__dirname, 'events');
if (fs.existsSync(eventos)) {
  for (const arq of fs.readdirSync(eventos)) {
    if (arq.endsWith('.js')) {
      const ev = require(path.join(eventos, arq));
      const nome = arq.replace('.js', '');
      client.on(nome, ev.bind(null, client));
    }
  }
}

const token = process.env.DISCORD_TOKEN || config.token;

client.login(token).catch(err => {
  console.error('❌ Erro ao conectar:', err.message);
});
