const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const t = require('../../textos.json');

module.exports = {
  nome: 'clear',
  aliases: ['limpar', 'apagar', 'purge'],
  descricao: 'Limpar mensagens do canal',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return msg.reply(`❌ ${t.sistema.semPermissao}`);

    const quantidade = parseInt(args[0]);

    if (!quantidade || quantidade < 1 || quantidade > 1000) {
      return msg.reply(
        '💜 **Como usar:** `--clear número`\n' +
        'Limpe mensagens deste canal!\n' +
        '📊 Valores aceitos: **1 a 1000** mensagens'
      );
    }

    await msg.delete().catch(() => {});

    let totalApagado = 0;
    let restante = quantidade;

    while (restante > 0) {
      const lote = await msg.channel.bulkDelete(Math.min(restante, 100), true);
      totalApagado += lote.size;
      restante -= 100;
      if (lote.size === 0) break;
    }

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setAuthor({ name: t.moderação.limpar.titulo, iconURL: msg.guild.iconURL() })
      .setDescription(`Foram apagadas **${totalApagado}** mensagens deste canal! ✨`)
      .addFields(
        { name: '🧹 Por', value: `${msg.author}`, inline: true },
        { name: '📍 Canal', value: `${msg.channel}`, inline: true }
      )
      .setTimestamp();

    const confirmacao = await msg.channel.send({ embeds: [embed] });
    setTimeout(() => confirmacao.delete().catch(() => {}), 6000);

    const canalLog = msg.guild.channels.cache.get(db.getConfig('mod_canalLog'));
    if (canalLog) {
      const logEmbed = new EmbedBuilder()
        .setColor('#3498DB')
        .setAuthor({ name: '🧹 Mensagens Limpadas', iconURL: msg.guild.iconURL() })
        .addFields(
          { name: '📍 Canal', value: `${msg.channel}`, inline: true },
          { name: '📊 Quantidade', value: `**${totalApagado}**`, inline: true },
          { name: '🛡️ Por', value: `${msg.author}` }
        )
        .setTimestamp();
      await canalLog.send({ embeds: [logEmbed] });
    }
  }
};
