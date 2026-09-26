const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');
const config = require('../config.json');

function calcularXpParaNivel(nivel) {
  return Math.floor(100 * Math.pow(1.5, nivel - 1));
}

const emblemas = ['👑', '🥈', '🥉'];

module.exports = {
  nome: 'top',
  aliases: ['ranking', 'leaderboard'],
  executar: async (client, msg, args) => {
    const pagina = Math.max(1, parseInt(args[0]) || 1);
    const porPagina = 7;
    const offset = (pagina - 1) * porPagina;

    const total = db.prepare('SELECT COUNT(*) as qtd FROM usuarios').get().qtd;
    const usuarios = db.prepare(`
      SELECT id, xp, nivel 
      FROM usuarios 
      ORDER BY (nivel * 1000000 + xp) DESC 
      LIMIT ? OFFSET ?
    `).all(porPagina, offset);

    if (!usuarios.length && pagina > 1) {
      return msg.reply('📭 Essa página não existe!');
    }

    const linhas = [];
    for (let i = 0; i < usuarios.length; i++) {
      const posicao = offset + i + 1;
      const user = await client.users.fetch(usuarios[i].id).catch(() => null);
      if (!user) continue;

      const emblema = posicao <= 3 ? `${emblemas[posicao - 1]} ` : `\`${String(posicao).padStart(2, ' ')}\` `;
      const xpNecessario = calcularXpParaNivel(usuarios[i].nivel + 1);
      const barra = '━'.repeat(Math.floor((usuarios[i].xp / xpNecessario) * 10)) + '─'.repeat(10 - Math.floor((usuarios[i].xp / xpNecessario) * 10));

      linhas.push(
        `${emblema}**${user.username}** — Lv.${usuarios[i].nivel}\n` +
        `   \`${barra}\` ${usuarios[i].xp}/${xpNecessario}`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle(`⭐ Mais Ativos — ${msg.guild.name}`)
      .setDescription(linhas.join('\n\n') || 'Nenhum usuário registrado ainda 💫')
      .setThumbnail(msg.guild.iconURL())
      .setFooter({ text: `Página ${pagina}/${Math.ceil(total / porPagina) || 1} • Total: ${total}` })
      .setTimestamp();

    const botoes = new ActionRowBuilder();
    if (pagina > 1) {
      botoes.addComponents(
        new ButtonBuilder()
          .setCustomId(`top_${pagina - 1}`)
          .setLabel('← Anterior')
          .setStyle(ButtonStyle.Secondary)
      );
    }
    if (offset + porPagina < total) {
      botoes.addComponents(
        new ButtonBuilder()
          .setCustomId(`top_${pagina + 1}`)
          .setLabel('Próxima →')
          .setStyle(ButtonStyle.Secondary)
      );
    }

    await msg.reply({ embeds: [embed], components: botoes.components.length ? [botoes] : [] });
  }
};
