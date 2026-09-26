const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const t = require('../../textos.json');
const cfg = require('../../config.json');

module.exports = {
  nome: 'kick',
  aliases: ['expulsar'],
  descricao: 'Expulsar um usuário do servidor',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.KickMembers))
      return msg.reply(`❌ ${t.sistema.semPermissao}`);

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const motivo = args.slice(1).join(' ') || t.moderação.kick.semMotivo;

    if (!alvo)
      return msg.reply('💜 **Como usar:** `--kick @Usuário motivo`\nMencione quem deseja expulsar!');

    if (alvo.id === msg.author.id)
      return msg.reply('🤭 Se expulsar? Não dá, hein! 😅');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.author.id !== cfg.donoId)
      return msg.reply('⚠️ Esse usuário tem cargo igual ou maior!');

    if (!alvo.kickable)
      return msg.reply('❌ Não tenho permissão para expulsar esse usuário!');

    if (db.getConfig('mod_dmPunicoes', 'sim') === 'sim') {
      const textoDM = t.moderação.kick.dm
        .replace(/{servidor}/g, msg.guild.name)
        .replace(/{motivo}/g, motivo);
      await alvo.send(textoDM).catch(() => {});
    }

    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'kick', ?)
    `).run(alvo.id, msg.author.id, motivo);

    const embed = new EmbedBuilder()
      .setColor('#F39C12')
      .setAuthor({ name: t.moderação.kick.titulo, iconURL: msg.guild.iconURL() })
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

    await alvo.kick(motivo);
    await msg.reply({ embeds: [embed] });
  }
};
