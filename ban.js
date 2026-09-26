const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const t = require('../../textos.json');
const cfg = require('../../config.json');

module.exports = {
  nome: 'ban',
  aliases: ['banir'],
  descricao: 'Banir um usuário do servidor',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.BanMembers))
      return msg.reply(`❌ ${t.sistema.semPermissao}`);

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(' ') || t.moderação.ban.semMotivo;

    if (!alvo)
      return msg.reply('💜 **Como usar:** `--ban @Usuário motivo`\nMencione quem deseja banir!');

    if (alvo.id === msg.author.id)
      return msg.reply('🤭 Nãao, você não pode se banir, ué!');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.author.id !== cfg.donoId)
      return msg.reply('⚠️ Esse usuário tem cargo igual ou maior que o seu! Não posso deixar você agir.');

    if (!alvo.bannable)
      return msg.reply('❌ Não tenho permissão para banir esse usuário! Verifique meu cargo.');

    if (db.getConfig('mod_dmPunicoes', 'sim') === 'sim') {
      const textoDM = t.moderação.ban.dm
        .replace(/{servidor}/g, msg.guild.name)
        .replace(/{motivo}/g, motivo);
      await alvo.send(textoDM).catch(() => {});
    }

    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'ban', ?)
    `).run(alvo.id, msg.author.id, motivo);

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setAuthor({ name: t.moderação.ban.titulo, iconURL: msg.guild.iconURL() })
      .setThumbnail(alvo.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '👤 Usuário', value: `**${alvo.user.tag}**\n\`${alvo.id}\``, inline: true },
        { name: '🛡️ Moderador', value: `**${msg.author.tag}**`, inline: true },
        { name: '📝 Motivo', value: motivo }
      )
      .setFooter({ text: `ID: ${alvo.id}` })
      .setTimestamp();

    const canalLog = msg.guild.channels.cache.get(db.getConfig('mod_canalLog'));
    if (canalLog) await canalLog.send({ embeds: [embed] });

    await alvo.ban({ reason: motivo });
    await msg.reply({ embeds: [embed] });
  }
};
