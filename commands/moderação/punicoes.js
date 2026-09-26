const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

module.exports = {
  nome: 'punicoes',
  aliases: ['historico', 'punições', 'registros'],
  descricao: 'Ver o histórico de punições de um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Você precisa da permissão `Moderate Members` para usar este comando.');

    const alvo = msg.mentions.users.first() || client.users.cache.get(args[0]);

    if (!alvo)
      return msg.reply('🔔 Este comando mostra o histórico de punições de um usuário!\n**Fica assim:**\n`--punicoes @user`');

    const qtdAvisos = db.prepare('SELECT quantidade FROM avisos WHERE usuarioId = ?').get(alvo.id)?.quantidade || 0;
    const registros = db.prepare(`
      SELECT tipo, motivo, data, moderadorId
      FROM punicoes
      WHERE usuarioId = ?
      ORDER BY data DESC
      LIMIT 10
    `).all(alvo.id);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Histórico — ${alvo.tag}`)
      .setAuthor({ name: `${qtdAvisos} Avisos ativos`, iconURL: alvo.displayAvatarURL() })
  
    if (registros.length === 0) {
      embed.setDescription('✅ Nenhum registro encontrado! É um anjo!');
    } else {
      const lista = registros.map(r => {
        const mod = client.users.cache.get(r.moderadorId)?.tag || 'Desconhecido';
        const quando = /^\d+$/.test(String(r.data)) ? `<t:${r.data}:f>` : r.data;
        return `**${r.tipo.toUpperCase()}** — ${r.motivo}\n${quando} · por ${mod}`;
      }).join('\n\n');
      embed.setDescription(lista);
    }

    await msg.reply({ embeds: [embed] });
  }
};
