const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const t = require('../../textos.json');

module.exports = {
  nome: 'warn',
  aliases: ['avisar', 'aviso'],
  descricao: 'Dar um aviso a um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply(`❌ Você precisa da permissão `Moderate Members` para usar este comando.`);

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(' ') || 'Sem motivo informado';

    if (!alvo)
      return msg.reply('🔔 Este comando dá um aviso ao usuário punido!\nEu preciso que você me informe quem receberá a punição, e se desejar, pode incluir um motivo para isso.\n**Fica assim:**\n`--warn @user xingamentos excessivos!`');

    if (alvo.id === msg.author.id)
      return msg.reply('❌ Você avisar a você mesmo... Pera, eu tô me bugando!');

    const antiga = db.prepare('SELECT quantidade FROM avisos WHERE usuarioId = ?').get(alvo.id);
    const nova = (antiga?.quantidade || 0) + 1;

    db.prepare('REPLACE INTO avisos (usuarioId, quantidade) VALUES (?, ?)').run(alvo.id, nova);
    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'warn', ?)
    `).run(alvo.id, msg.author.id, motivo);

    let mensagem = '✅ Punição aplicada! ';
    if (nova >= 5) {
      mensagem += 'O usuário foi automaticamente silenciado por **2 horas** por receber 5 avisos! ';
    } else if (nova >= 3) {
      mensagem += '\nTome cuidado! Ao receber 5 avisos, há uma punição imediata... 🗣️ ';
    } else {
      mensagem += 'Lembre-se de seguir as regras da próxima vez! 🗣️';
    }

    await msg.reply(mensagem);

    if (nova === 5 && alvo.moderatable) {
      await alvo.timeout(2 * 60 * 60 * 1000, '5+ avisos — silenciamento automático').catch(() => {});
    }
  }
};
