const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  nome: 'unmute',
  aliases: ['dessilenciar', 'desmutar', 'removersilenciamento'],
  descricao: 'Remover o silenciamento de um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Você não tem permissão para isso, tá? 🌸');

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);

    if (!alvo)
      return msg.reply('💜 **Como usar:** `--unmute @Usuário`\nMencione quem deseja liberar!');

    if (!alvo.isCommunicationDisabled())
      return msg.reply(`✅ **${alvo.user.username}** não está silenciado!`);

    if (!alvo.moderatable)
      return msg.reply('❌ Não consigo agir nesse usuário!');

    await alvo.timeout(null, 'Silenciamento removido por moderador');

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setAuthor({ name: '🔊 Silenciamento Removido', iconURL: msg.guild.iconURL() })
      .setThumbnail(alvo.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '👤 Usuário', value: `**${alvo.user.tag}**`, inline: true },
        { name: '🛡️ Por', value: `**${msg.author.tag}**`, inline: true }
      )
      .setFooter({ text: 'Pode falar novamente ✨' })
      .setTimestamp();

    const canalLog = msg.guild.channels.cache.get(db.getConfig('mod_canalLog'));
    if (canalLog) await canalLog.send({ embeds: [embed] });

    await msg.reply({ embeds: [embed] });
  }
};
