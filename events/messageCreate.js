const config = require('../config.json');
const db = require('../database');
const ultimoEnvio = new Map();

function calcularXpParaNivel(nivel) {
  return Math.floor(100 * Math.pow(1.5, nivel - 1));
}

function substituir(texto, usuario, dados) {
  return texto
    .replace(/{usuario}/g, `<@${usuario.id}>`)
    .replace(/{nivel}/g, dados.nivel)
    .replace(/{xp}/g, dados.xp);
}

module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;

  const prefixo = config.prefix;
  if (message.content.startsWith(prefixo)) {
    const [comando, ...args] = message.content.slice(prefixo.length).trim().split(/\s+/);
    const cmd = client.commands.get(comando.toLowerCase()) 
      || [...client.commands.values()].find(c => c.aliases?.includes(comando.toLowerCase()));
    if (cmd) {
      try {
        await cmd.executar(client, message, args, db);
      } catch (e) {
        message.reply('Um erro inesperado aconteceu... 😟/nTava tudo bem, e de repente... Buh! Sumiu. Tente novamente, e se o erro persistir, por favor, contate o meu desenvolvedor. Peço desculpas pelo incoveniente...');
        console.error(e);
      }
      return;
    }
  }

  if (db.getConfig('nivel_ativo', 'sim') !== 'sim') return;

  const canalBloqueado = db.prepare('SELECT 1 FROM canais_sem_xp WHERE canalId = ?').get(message.channel.id);
  if (canalBloqueado) return;

  const chave = `${message.author.id}-${message.guild.id}`;
  const agora = Date.now();
  if (ultimoEnvio.has(chave) && agora - ultimoEnvio.get(chave) < config.cooldownXP) return;
  ultimoEnvio.set(chave, agora);

  let multiplicador = 1.0;
  const cargosUsuario = message.member.roles.cache.map(r => r.id);
  for (const cargoId of cargosUsuario) {
    const mult = db.prepare('SELECT multiplicador FROM multiplicador_xp WHERE cargoId = ?').get(cargoId);
    if (mult && mult.multiplicador > multiplicador) multiplicador = mult.multiplicador;
  }

  const xpBase = Math.floor(Math.random() * (config.xpPorMensagem.max - config.xpPorMensagem.min + 1)) 
    + config.xpPorMensagem.min;
  const xpGanho = Math.floor(xpBase * multiplicador);

  let usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(message.author.id);
  if (!usuario) {
    db.prepare('INSERT INTO usuarios (id, xp, nivel) VALUES (?, ?, 1)').run(message.author.id, xpGanho);
    return;
  }

  const novoXpTotal = usuario.xp + xpGanho;
  const xpNecessario = calcularXpParaNivel(usuario.nivel + 1);

  if (novoXpTotal >= xpNecessario) {
    const novoNivel = usuario.nivel + 1;
    const restoXp = novoXpTotal - xpNecessario;

    db.prepare('UPDATE usuarios SET xp = ?, nivel = ? WHERE id = ?').run(restoXp, novoNivel, message.author.id);

    const recompensas = db.prepare('SELECT cargoId, mensagem FROM recompensas_nivel WHERE nivel = ?').all(novoNivel);
    for (const rec of recompensas) {
      if (rec.cargoId) {
        const cargo = message.guild.roles.cache.get(rec.cargoId);
        if (cargo) await message.member.roles.add(cargo).catch(() => {});
      }
      if (rec.mensagem) {
        const msgPersonalizada = substituir(rec.mensagem, message.author, { nivel: novoNivel, xp: restoXp });
        const canalAlvo = db.getConfig('nivel_canal') ? message.guild.channels.cache.get(db.getConfig('nivel_canal')) : message.channel;
        if (canalAlvo) await canalAlvo.send(msgPersonalizada).catch(() => {});
      }
    }

    if (!recompensas.some(r => r.mensagem)) {
      let mensagemSubida = db.getConfig('nivel_mensagem', '✨ Parabéns, {usuario}! Você chegou ao nível {nivel}!');
      mensagemSubida = substituir(mensagemSubida, message.author, { nivel: novoNivel, xp: restoXp });
      const canalAlvo = db.getConfig('nivel_canal') ? message.guild.channels.cache.get(db.getConfig('nivel_canal')) : message.channel;
      if (canalAlvo) await canalAlvo.send(mensagemSubida).catch(() => {});
    }
  } else {
    db.prepare('UPDATE usuarios SET xp = ? WHERE id = ?').run(novoXpTotal, message.author.id);
  }
};
