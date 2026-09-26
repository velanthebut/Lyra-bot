const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const config = require('../config.json');
const textos = require('../textos.json');

function calcularXpParaNivel(nivel) {
  return Math.floor(100 * Math.pow(1.5, nivel - 1));
}

module.exports = {
  nome: 'rank',
  aliases: ['perfil', 'xp'],
  executar: async (client, msg, args) => {
    const usuario = args[0] ? msg.mentions.users.first() : msg.author;
    if (!usuario) return msg.reply(textos.niveis.rankVazio);

    const dados = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario.id);
    if (!dados) return msg.reply(textos.niveis.rankVazio);

    const xpNecessario = calcularXpParaNivel(dados.nivel + 1);
    const porcentagem = Math.min(100, Math.round((dados.xp / xpNecessario) * 100));
    const barra = '█'.repeat(Math.floor(porcentagem / 10)) + '░'.repeat(10 - Math.floor(porcentagem / 10));

    const embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle(`⭐ Nível de ${usuario.username}`)
      .setThumbnail(usuario.displayAvatarURL())
      .addFields(
        { name: 'Nível', value: `${dados.nivel}`, inline: true },
        { name: 'XP Atual', value: `${dados.xp} / ${xpNecessario}`, inline: true },
        { name: 'Progresso', value: `\`${barra}\` ${porcentagem}%` }
      )
      .setTimestamp();

    msg.reply({ embeds: [embed] });
  }
};
