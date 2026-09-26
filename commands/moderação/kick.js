const { PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  nome: 'kick',
  aliases: ['expulsar'],
  descricao: 'Expulsar um usuário do servidor',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.KickMembers))
      return msg.reply('❌ Você precisa da permissão `Kick Members` para usar este comando.');

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(' ') || 'Sem motivo informado';

    if (!alvo)
      return msg.reply('🔔 Este comando expulsa o usuário do servidor!\nEu preciso que você me informe quem será expulso, e se desejar, pode incluir um motivo.\n**Fica assim:**\n`--kick @user perturbando o chat`');

    if (alvo.id === msg.author.id)
      return msg.reply('❌ Você vai se expulsar? Vou fingir que não vi isso...');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.guild.ownerId !== msg.author.id)
      return msg.reply('⚠️ Esse usuário tem um cargo igual ou maior que o seu, não posso deixar você fazer isso.');

    if (!alvo.kickable)
      return msg.reply('❌ Não consigo expulsar esse usuário! Verifique se meu cargo está acima do dele.');

    await alvo.send(`Você foi expulso(a) do servidor **${msg.guild.name}**.\nMotivo: ${motivo}`).catch(() => {});

    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'kick', ?)
    `).run(alvo.id, msg.author.id, motivo);

    await alvo.kick(`${motivo} | Aplicado por: ${msg.author.tag}`);

    await msg.reply('✅ Punição aplicada! O registro foi adicionado ao histórico do servidor.');
  }
};
