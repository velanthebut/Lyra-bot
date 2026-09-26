const { PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  nome: 'warn',
  aliases: ['avisar', 'aviso'],
  descricao: 'Dar um aviso a um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Você precisa da permissão `Moderate Members` para usar este comando.');

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(' ') || 'Sem motivo informado';

    if (!alvo)
      return msg.reply('🔔 Este comando dá um aviso ao usuário punido!\nEu preciso que você me informe quem receberá a punição, e se desejar, pode incluir um motivo para isso.\n**Fica assim:**\n`--warn @user xingamentos excessivos!`');

    if (alvo.id === msg.author.id)
      return msg.reply('❌ Você avisar a você mesmo... Pera, eu tô me bugando!');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.guild.ownerId !== msg.author.id)
      return msg.reply('⚠️ Esse usuário tem um cargo igual ou maior que o seu, não posso deixar você fazer isso.');

    const antiga = db.prepare('SELECT quantidade FROM avisos WHERE usuarioId = ?').get(alvo.id);
    const nova = (antiga?.quantidade || 0) + 1;

    db.prepare('REPLACE INTO avisos (usuarioId, quantidade) VALUES (?, ?)').run(alvo.id, nova);
    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'warn', ?)
    `).run(alvo.id, msg.author.id, motivo);

    await msg.reply('✅ Punição aplicada! O registro foi adicionado ao histórico do servidor.');

    if (nova === 3) {
      await msg.channel.send('⚠️ Cuidado! Ao receber 5 avisos, você é silenciado(a) automaticamente.');
    } else if (nova === 5) {
      await msg.channel.send('⚠️ O usuário foi automaticamente silenciado por **2 horas** por receber 5 avisos!');
      if (alvo.moderatable) {
        await alvo.timeout(2 * 60 * 60 * 1000, '5+ avisos — silenciamento automático').catch(() => {});
      }
    }
  }
};
