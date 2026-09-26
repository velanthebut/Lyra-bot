const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  nome: 'punicoes',
  aliases: ['historico', 'punições', 'registros'],
  descricao: 'Ver o histórico de punições de um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Sem permissão para ver históricos 🌸');

    const alvo = msg.mentions.users.first() || client.users.cache.get(args[0]);

    if (!alvo)
      return msg.reply('💜 **Como usar:** `--punicoes @Usuário`\nMencione o usuário para consultar!');

    const qtdAvisos = db.prepare('SELECT quantidade FROM avisos WHERE usuarioId = ?').get(alvo.id)?.quantidade || 0;
    const registros = db.prepare(`
      SELECT tipo, motivo, data, moderadorId
      FROM punicoes
      WHERE usuarioId = ?
      ORDER BY data DESC
      LIMIT 10
    `).all(alvo.id);

    let lista = '';
    if (registros.length === 0) {
      lista = '✅ Nenhum registro encontrado! Que bom! 🌸';
    } else {
      lista = registros.map(r => {
        const mod = client.users.cache.get(r.moderadorId)?.username || 'Desconhecido';
        const icone = r.tipo === 'ban' ? '🚫' : r.tipo === 'kick' ? '👢' : r.tipo === 'mute' ? '🔇' : '⚠️';
        return `${icone} **${r.tipo.toUpperCase()}** — ${r.motivo}\n    📅 ${r.data} · por **${mod}**`;
      }).join('\n\n');
    }

    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setAuthor({ name: `📋 Histórico — ${alvo.username}`, iconURL: alvo.displayAvatarURL() })
      .setThumbnail(alvo.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '📋 Avisos Ativos', value: `**${qtdAvisos}**`, inline: true },
        { name: '📑 Últimas Punições', value: lista }
      )
      .setFooter({ text: `ID do usuário: ${alvo.id}` })
      .setTimestamp();

    await msg.reply({ embeds: [embed] });
  }
};
